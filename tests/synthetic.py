"""テスト専用の架空データ生成。実在の選手・レース・オッズではない。
ここで出た数字は、仕組みが動くかの確認にだけ使い、成績としては絶対に報告しない。"""
import itertools
import math
import random
from datetime import date, timedelta

from keirin.db import upsert
from keirin.loaders import add_race, add_entry, add_result, add_odds
from tests.fixtures import make_db


def build(n_days=150, races_per_day=2, n_racers=40, seed=1):
    rnd = random.Random(seed)
    conn = make_db()
    strength = {f"T{k:03d}": rnd.gauss(0, 1) for k in range(n_racers)}
    for rid in strength:
        upsert(conn, "racers", dict(racer_id=rid, name=rid), ["racer_id"])
    d0 = date(2025, 1, 1)
    ids = []
    for day in range(n_days):
        d = (d0 + timedelta(days=day)).isoformat()
        for no in range(1, races_per_day + 1):
            start = f"{d}T{10 + no}:00:00+09:00"
            rid, _ = add_race(conn, dict(meet_id=1, velodrome_id=1, event_date=d, race_no=no, class_tier="S",
                                         race_start_time=start, retrieved_at=f"{d}T06:00:00+09:00"))
            riders = rnd.sample(sorted(strength), 7)
            for car, r in enumerate(riders, 1):
                add_entry(conn, dict(race_id=rid, car_no=car, racer_id=r, retrieved_at=f"{d}T06:00:00+09:00"))
            w = {car: math.exp(1.2 * strength[r]) for car, r in enumerate(riders, 1)}
            tot = sum(w.values())
            # 2車単の真の確率（生成にだけ使う）
            true = {}
            for i, j in itertools.permutations(w, 2):
                true[f"{i}-{j}"] = w[i] / tot * w[j] / (tot - w[i])
            for c, p in true.items():
                o = round(max(1.1, 0.75 / p * math.exp(rnd.gauss(0, 0.15))), 1)
                add_odds(conn, rid, "2車単", c, o, f"{d}T07:45:00+09:00")
            # 着順（Plackett-Luce）
            left, order = dict(w), []
            while left:
                x = rnd.random() * sum(left.values())
                for car, v in left.items():
                    x -= v
                    if x <= 0:
                        break
                order.append(car)
                left.pop(car)
            for pos, car in enumerate(order, 1):
                add_result(conn, dict(race_id=rid, car_no=car, finish_order=pos,
                                      result_confirmed_at=f"{d}T{10 + no}:10:00+09:00",
                                      retrieved_at=f"{d}T{10 + no}:30:00+09:00"))
            win = f"{order[0]}-{order[1]}"
            o = conn.execute("SELECT odds_min FROM odds_snapshots WHERE race_id=? AND combination=?", (rid, win)).fetchone()[0]
            upsert(conn, "payouts", dict(race_id=rid, bet_type="2車単", combination=win, payout_yen=int(o * 100),
                                         retrieved_at=f"{d}T{10 + no}:30:00+09:00"), ["race_id", "bet_type", "combination"])
            ids.append((rid, start))
    conn.commit()
    return conn, ids
