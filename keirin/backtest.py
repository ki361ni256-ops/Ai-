"""時系列バックテスト（STEP 7）。ランダム分割は使わない。walk-forward で
「学習 → 校正 → 検証」を時間順に並べ、検証期間をずらしながら繰り返す。"""
from datetime import datetime, timedelta

from .db import upsert
from .timeutil import now_jst


def _d(s):
    return datetime.fromisoformat(s)


def walk_forward_folds(races, train_days, calib_days, test_days, step_days=None):
    """races: [(race_id, race_start_time)]。各 fold は時間が重ならない
    train < calib < test の順。step_days ごとに検証期間を後ろへずらす。"""
    races = sorted(races, key=lambda r: r[1])
    if not races:
        return []
    step = timedelta(days=step_days or test_days)
    start = _d(races[0][1])
    last = _d(races[-1][1])
    folds = []
    t0 = start
    while True:
        train_end = t0 + timedelta(days=train_days)
        calib_end = train_end + timedelta(days=calib_days)
        test_end = calib_end + timedelta(days=test_days)
        if calib_end > last:
            break
        pick = lambda a, b: [rid for rid, t in races if a <= _d(t) < b]  # noqa: E731
        folds.append(dict(train=pick(t0, train_end), calib=pick(train_end, calib_end),
                          test=pick(calib_end, test_end),
                          train_end=train_end.isoformat(), calib_end=calib_end.isoformat(),
                          test_end=test_end.isoformat()))
        t0 += step
    return folds


def latest_usable_odds(conn, race_id, bet_type, as_of):
    """as_of 以前に取得した pre_0800 オッズのうち、最新の取得時刻の一式。"""
    t = conn.execute("SELECT MAX(retrieved_at) FROM v_odds_usable_0800 WHERE race_id=? AND bet_type=? AND retrieved_at<=?",
                     (race_id, bet_type, as_of)).fetchone()[0]
    if t is None:
        return None, {}
    rows = conn.execute("SELECT combination, odds_min FROM v_odds_usable_0800 WHERE race_id=? AND bet_type=? AND retrieved_at=?",
                        (race_id, bet_type, t)).fetchall()
    return t, {r[0]: r[1] for r in rows}


def favorite_baseline(conn, race_ids, as_of_fn, bet_type="2車単", stake=100):
    """AIを使わない基準：朝8時のオッズで一番人気（最低オッズ）の組合せを固定金額で買う。"""
    bets = []
    for rid in race_ids:
        as_of = as_of_fn(rid)
        t, odds = latest_usable_odds(conn, rid, bet_type, as_of)
        if not odds:
            continue  # オッズがない＝Skip
        combo = min(odds, key=lambda c: (odds[c], c))
        bets.append(dict(race_id=rid, bet_type=bet_type, combination=combo, stake_yen=stake, as_of=as_of,
                         odds_retrieved_at=t, odds_used=odds[combo]))
    return bets


def settle(conn, bets):
    """払戻は payouts（100円あたりの実際の払戻金）で精算する。オッズの値では精算しない。"""
    out = []
    for b in bets:
        p = conn.execute("SELECT payout_yen FROM payouts WHERE race_id=? AND bet_type=? AND combination=?",
                         (b["race_id"], b["bet_type"], b["combination"])).fetchone()
        ret = p[0] * b["stake_yen"] // 100 if p else 0
        out.append(dict(b, return_yen=ret))
    return out


def metrics(target_race_ids, settled):
    """必須の指標。連敗・ドローダウンはレース単位（発走順）で数える。"""
    n_target = len(set(target_race_ids))
    by_race = {}
    for b in settled:
        r = by_race.setdefault(b["race_id"], dict(stake=0, ret=0, as_of=b["as_of"]))
        r["stake"] += b["stake_yen"]
        r["ret"] += b["return_yen"]
    order = sorted(by_race, key=lambda k: by_race[k]["as_of"])
    stake = sum(r["stake"] for r in by_race.values())
    ret = sum(r["ret"] for r in by_race.values())
    hits = sum(1 for r in by_race.values() if r["ret"] > 0)
    streak = max_streak = 0
    cum = peak = max_dd = 0
    for k in order:
        r = by_race[k]
        streak = 0 if r["ret"] > 0 else streak + 1
        max_streak = max(max_streak, streak)
        cum += r["ret"] - r["stake"]
        peak = max(peak, cum)
        max_dd = max(max_dd, peak - cum)
    n_buy = len(by_race)
    return dict(
        target_races=n_target, purchased_races=n_buy, n_bets=len(settled), stake_yen=stake, return_yen=ret,
        profit_yen=ret - stake, roi=(ret / stake if stake else None),
        hit_rate=(hits / n_buy if n_buy else None), max_losing_streak=max_streak, max_drawdown_yen=max_dd,
        avg_stake_per_race=(stake / n_buy if n_buy else None),
        skip_rate=((n_target - n_buy) / n_target if n_target else None))


def audit_bets(conn, bets, odds_basis="pre_0800"):
    """買い目ごとの監査。問題のある買い目のリストを返す（空なら合格）。"""
    problems = []
    for b in bets:
        race = conn.execute("SELECT race_start_time FROM races WHERE race_id=?", (b["race_id"],)).fetchone()
        if b["as_of"] >= race[0]:
            problems.append((b, "予測時点が発走時刻以降"))
        if odds_basis == "pre_0800":
            if not b.get("odds_retrieved_at"):
                problems.append((b, "オッズの取得時刻が不明"))
                continue
            if b["odds_retrieved_at"] > b["as_of"]:
                problems.append((b, "予測時点より後のオッズ"))
            k = conn.execute("SELECT snapshot_kind FROM odds_snapshots WHERE race_id=? AND bet_type=? AND combination=?"
                             " AND retrieved_at=?", (b["race_id"], b["bet_type"], b["combination"],
                                                     b["odds_retrieved_at"])).fetchone()
            if k is None or k[0] != "pre_0800":
                problems.append((b, "朝8時以前のオッズではない"))
    return problems


def save_run(conn, model_id, period_start, period_end, odds_basis, settled, rule_json=None):
    bid = conn.execute("INSERT INTO backtest_runs(model_id, period_start, period_end, odds_basis, rule_json, created_at)"
                       " VALUES (?,?,?,?,?,?)", (model_id, period_start, period_end, odds_basis, rule_json, now_jst())).lastrowid
    for b in settled:
        upsert(conn, "backtest_bets", dict(backtest_id=bid, race_id=b["race_id"], bet_type=b["bet_type"],
                                           combination=b["combination"], stake_yen=b["stake_yen"], as_of=b["as_of"],
                                           odds_retrieved_at=b.get("odds_retrieved_at"), odds_used=b.get("odds_used")),
               ["backtest_id", "race_id", "bet_type", "combination"])
    conn.commit()
    return bid
