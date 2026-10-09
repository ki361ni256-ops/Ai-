"""特徴量の作成（STEP 6）。as-of join：予測時点 as_of（既定は開催日 08:00）までに
取得・確定していた行だけを使う。対象レース自身と、発走時刻が対象以降のレースの結果は使わない。"""
import statistics

from .db import upsert
from .timeutil import cutoff_0800, now_jst

VERSION = 1

DEFINITIONS = [
    # name, description, available_at, leakage_risk, source_tables
    ("prev_finish_1", "直近1走の着順", "as_of までに確定・取得した結果", "低（確定時刻と発走時刻で除外）", "results,entries,races"),
    ("mean_finish_last2", "直近2走の平均着順", "同上", "低", "results,entries,races"),
    ("mean_finish_last3", "直近3走の平均着順", "同上", "低", "results,entries,races"),
    ("mean_finish_last5", "直近5走の平均着順", "同上", "低", "results,entries,races"),
    ("win_rate_last5", "直近5走の1着率", "同上", "低", "results,entries,races"),
    ("top3_rate_last5", "直近5走の3着以内率", "同上", "低", "results,entries,races"),
    ("n_past_races", "as_of までに確定した出走数（サンプル数の目安）", "同上", "低", "results,entries,races"),
    ("days_since_last_race", "前走からの日数", "同上", "低", "results,entries,races"),
    ("official_score", "競走得点（公式項目と確認できた場合のみ値が入る）", "as_of までに取得した racer_snapshots の最新", "中（取得時刻が予測時点より後の値を使わないこと）", "racer_snapshots"),
    ("track_length_m", "競輪場の周長", "静的情報", "中（改修でバンクが変わった場合、過去レースに新しい値が入る）", "velodromes"),
    ("home_straight_m", "みなし直線距離", "静的情報", "中（同上）", "velodromes"),
    ("odds_2tan_min_as_first", "2車単でこの車番が1着の組合せの最低オッズ（朝8時以前に取得したもの）", "v_odds_usable_0800 のうち as_of 以前の最新", "高（最終オッズを使うと未来情報。pre_0800 のみ使用）", "odds_snapshots"),
]


def register_definitions(conn):
    ts = now_jst()
    for name, desc, avail, risk, src in DEFINITIONS:
        upsert(conn, "feature_definitions",
               dict(feature_name=name, feature_version=VERSION, description=desc, available_at=avail,
                    leakage_risk=risk, source_tables=src, created_at=ts),
               ["feature_name", "feature_version"])


def _entries_as_of(conn, race_id, as_of, policy):
    """対象レースの出走表。policy='as_of'：as_of 以前に取得した最新（欠車を除く）。
    policy='backfill'：as_of 以前の取得がない過去レース用に、最も古い取得を使う（近似。leak_flags に記録）。"""
    rows = conn.execute(
        """SELECT e.* FROM entries e
           WHERE e.race_id = ? AND e.retrieved_at <= ?
             AND e.retrieved_at = (SELECT MAX(retrieved_at) FROM entries x
                                   WHERE x.race_id = e.race_id AND x.car_no = e.car_no AND x.retrieved_at <= ?)
             AND e.is_scratched = 0
           ORDER BY e.car_no""", (race_id, as_of, as_of)).fetchall()
    if rows or policy != "backfill":
        return rows, None
    rows = conn.execute(
        """SELECT e.* FROM entries e
           WHERE e.race_id = ?
             AND e.retrieved_at = (SELECT MIN(retrieved_at) FROM entries x
                                   WHERE x.race_id = e.race_id AND x.car_no = e.car_no)
             AND e.is_scratched = 0
           ORDER BY e.car_no""", (race_id,)).fetchall()
    return rows, "backfilled_entries"


def _past_results(conn, racer_id, target_race, as_of):
    """使ってよい過去の結果（新しい順）。条件：
    - 発走時刻が対象レースより前
    - 確定時刻があれば as_of 以前。確定時刻が不明なら、開催日が対象レースの前日以前のものだけ
      （前日以前のレースは当日 08:00 には確定済み。同じ日のレースは確定時刻がなければ使わない）
    結果は確定後に変わらない前提なので、こちらが取得した時刻（retrieved_at）では絞らない。"""
    return conn.execute(
        """SELECT res.race_id, res.finish_order, r.race_start_time, r.event_date, res.result_confirmed_at
           FROM results res
           JOIN races r ON r.race_id = res.race_id
           JOIN entries e ON e.race_id = res.race_id AND e.car_no = res.car_no
           WHERE e.racer_id = ?
             AND r.race_start_time < ?
             AND ( (res.result_confirmed_at IS NOT NULL AND res.result_confirmed_at <= ?)
                OR (res.result_confirmed_at IS NULL AND r.event_date < ?) )
           GROUP BY res.race_id
           ORDER BY r.race_start_time DESC""",
        (racer_id, target_race["race_start_time"], as_of, target_race["event_date"])).fetchall()


def _days_between(a, b):
    from datetime import datetime
    return (datetime.fromisoformat(a) - datetime.fromisoformat(b)).total_seconds() / 86400


def compute_race(conn, race_id, as_of=None, entries_policy="as_of"):
    race = conn.execute("SELECT * FROM races WHERE race_id=?", (race_id,)).fetchone()
    as_of = as_of or cutoff_0800(race["event_date"])
    if as_of >= race["race_start_time"]:
        raise ValueError("予測時点が発走時刻以降になっている")
    velo = conn.execute("SELECT * FROM velodromes WHERE velodrome_id=?", (race["velodrome_id"],)).fetchone()
    out = []
    entries, flag = _entries_as_of(conn, race_id, as_of, entries_policy)
    for e in entries:
        feats = {}
        past = _past_results(conn, e["racer_id"], race, as_of) if e["racer_id"] else []
        orders = [p["finish_order"] for p in past]
        # 入力時刻：確定時刻が分かる結果はその時刻。対象レースの出走表は近似（backfill）でなければ取得時刻
        times = [p["result_confirmed_at"] for p in past if p["result_confirmed_at"]]
        if flag is None:
            times.append(e["retrieved_at"])
        newest = max(times) if times else None
        for k, n in (("prev_finish_1", 1), ("mean_finish_last2", 2), ("mean_finish_last3", 3), ("mean_finish_last5", 5)):
            last = orders[:n]
            feats[k] = (statistics.mean(last) if len(last) == n and None not in last else None, newest)
        last5 = orders[:5]
        feats["win_rate_last5"] = (sum(o == 1 for o in last5) / 5 if len(last5) == 5 else None, newest)
        feats["top3_rate_last5"] = (sum(o is not None and o <= 3 for o in last5) / 5 if len(last5) == 5 else None, newest)
        feats["n_past_races"] = (len(orders), newest)
        feats["days_since_last_race"] = (_days_between(race["race_start_time"], past[0]["race_start_time"]) if past else None, newest)

        snap = conn.execute("SELECT official_score, retrieved_at FROM racer_snapshots WHERE racer_id=? AND retrieved_at<=?"
                            " ORDER BY retrieved_at DESC LIMIT 1", (e["racer_id"], as_of)).fetchone()
        feats["official_score"] = (snap["official_score"], snap["retrieved_at"]) if snap else (None, None)

        # 静的情報は取得時刻を入力時刻に含めない（改修リスクは features.md に記載）
        feats["track_length_m"] = (velo["track_length_m"] if velo else None, None)
        feats["home_straight_m"] = (velo["home_straight_m"] if velo else None, None)

        od = conn.execute(
            """SELECT MIN(odds_min) AS m, MAX(retrieved_at) AS t FROM v_odds_usable_0800
               WHERE race_id=? AND bet_type='2車単' AND combination LIKE ? AND retrieved_at <= ?
                 AND retrieved_at = (SELECT MAX(retrieved_at) FROM v_odds_usable_0800
                                     WHERE race_id=? AND bet_type='2車単' AND retrieved_at <= ?)""",
            (race_id, f"{e['car_no']}-%", as_of, race_id, as_of)).fetchone()
        feats["odds_2tan_min_as_first"] = (od["m"], od["t"]) if od and od["m"] is not None else (None, None)

        ts = now_jst()
        for name, (val, inp) in feats.items():
            upsert(conn, "feature_values",
                   dict(race_id=race_id, car_no=e["car_no"], feature_name=name, feature_version=VERSION,
                        as_of=as_of, value=val, max_input_time=inp, leak_flags=flag, computed_at=ts),
                   ["race_id", "car_no", "feature_name", "feature_version", "as_of"])
        out.append((e["car_no"], {k: v for k, (v, _) in feats.items()}))
    conn.commit()
    return out
