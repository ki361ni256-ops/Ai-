"""walk-forward バックテストを実行し、AI戦略と基準（一番人気・固定100円）を比べる。
使い方: python3 scripts/run_backtest.py keirin.db [--odds-spec-confirmed]
実データがない間は実行しても対象0件になる。"""
import json
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from keirin import model as M  # noqa: E402
from keirin.backtest import (walk_forward_folds, favorite_baseline, settle, metrics, audit_bets,  # noqa: E402
                             latest_usable_odds)
from keirin.db import connect, audit  # noqa: E402
from keirin.strategy import decide, bootstrap_roi, ruin_probability, kelly_allowed  # noqa: E402
from keirin.timeutil import cutoff_0800  # noqa: E402


def run(conn, odds_spec_confirmed=False, train_days=365, calib_days=60, test_days=30):
    races = [(r[0], r[1]) for r in conn.execute("SELECT race_id, race_start_time FROM races ORDER BY race_start_time")]
    date = dict(conn.execute("SELECT race_id, event_date FROM races").fetchall())
    asof = lambda rid: cutoff_0800(date[rid])  # noqa: E731
    folds = walk_forward_folds(races, train_days, calib_days, test_days)
    ai_bets, base_bets, targets, evals, decisions = [], [], [], [], []
    for f in folds:
        if not f["test"]:
            continue
        targets += f["test"]
        base_bets += favorite_baseline(conn, f["test"], asof)
        try:
            mdl = M.train(conn, f["train"], asof)
        except ValueError:
            continue
        a = M.fit_power(mdl, conn, f["calib"], asof)
        calib = M.evaluate(M.predict(mdl, conn, f["calib"], asof, power=a), conn)
        preds = M.predict(mdl, conn, f["test"], asof, power=a)
        evals.append(dict(fold_test_end=f["test_end"], power=a, calib=calib, test=M.evaluate(preds, conn),
                          market=M.evaluate(M.market_probs(conn, f["test"], asof), conn)))
        for rid in f["test"]:
            if rid not in preds:
                continue
            t, odds = latest_usable_odds(conn, rid, M.BET_TYPE, asof(rid))
            past = [r[0] for r in conn.execute("SELECT value FROM feature_values WHERE race_id=? AND feature_name='n_past_races'"
                                               " AND as_of=?", (rid, asof(rid)))]
            leak = conn.execute("SELECT COUNT(*) FROM feature_values WHERE race_id=? AND (leak_flags IS NOT NULL"
                                " OR max_input_time > as_of)", (rid,)).fetchone()[0]
            d = decide(rid, preds[rid], odds, t, calib=calib, n_train_races=len(f["train"]),
                       median_past_races=statistics.median(past) if past else None, leak_ok=leak == 0,
                       odds_spec_confirmed=odds_spec_confirmed)
            decisions.append(d)
            if not d["skip"]:
                for p in d["picks"]:
                    ai_bets.append(dict(race_id=rid, bet_type=M.BET_TYPE, combination=p["combination"], stake_yen=100,
                                        as_of=asof(rid), odds_retrieved_at=t, odds_used=p["odds"]))
    out = {}
    for name, bets in (("ai", ai_bets), ("baseline_favorite_100yen", base_bets)):
        s = settle(conn, bets)
        m = metrics(targets, s)
        per_race = {}
        for b in s:
            x = per_race.setdefault(b["race_id"], [0, 0])
            x[0] += b["stake_yen"]
            x[1] += b["return_yen"]
        rr = [tuple(v) for v in per_race.values()]
        m["roi_ci95"] = bootstrap_roi(rr)
        m["ruin_prob_bankroll_10000"] = ruin_probability(rr, 10000)
        m["audit_problems"] = len(audit_bets(conn, bets))
        out[name] = m
    out["folds"] = len(folds)
    out["model_eval"] = evals
    out["db_leak_views"] = audit(conn)
    out["skip_reasons"] = {}
    for d in decisions:
        for r in d.get("reasons", []):
            k = r.split("（")[0]
            out["skip_reasons"][k] = out["skip_reasons"].get(k, 0) + 1
    ai = out["ai"]
    out["kelly_allowed"] = kelly_allowed(dict(ai, ece=(evals[-1]["calib"] or {}).get("ece") if evals else None,
                                              odds_basis="pre_0800", leak_count=sum(out["db_leak_views"].values())))
    return out


if __name__ == "__main__":
    conn = connect(sys.argv[1] if len(sys.argv) > 1 else "keirin.db")
    print(json.dumps(run(conn, "--odds-spec-confirmed" in sys.argv), ensure_ascii=False, indent=1, default=str))
