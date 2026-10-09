"""STEP 7〜9 の仕組みの確認（架空データ）。数字は成績ではない。"""
import statistics
import unittest

from keirin import model as M
from keirin.backtest import walk_forward_folds, favorite_baseline, settle, metrics, audit_bets, save_run, latest_usable_odds
from keirin.db import audit, upsert
from keirin.features import compute_race, register_definitions
from keirin.strategy import decide, render, kelly_fraction, kelly_allowed, bootstrap_roi, ruin_probability
from keirin.timeutil import cutoff_0800
from tests.synthetic import build


class TestPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.conn, cls.races = build()
        register_definitions(cls.conn)
        cls.date = {rid: t[:10] for rid, t in cls.races}
        cls.as_of = lambda self, rid: cutoff_0800(self.date[rid])
        for rid, _ in cls.races:
            compute_race(cls.conn, rid)

    def asof(self, rid):
        return cutoff_0800(self.date[rid])

    def test_folds_are_time_ordered(self):
        folds = walk_forward_folds(self.races, train_days=90, calib_days=20, test_days=20)
        self.assertGreaterEqual(len(folds), 1)
        t = dict(self.races)
        for f in folds:
            self.assertLess(max(t[r] for r in f["train"]), min(t[r] for r in f["calib"]))
            self.assertLess(max(t[r] for r in f["calib"]), min(t[r] for r in f["test"]))

    def test_baseline_metrics_and_audit(self):
        f = walk_forward_folds(self.races, 90, 20, 20)[0]
        bets = favorite_baseline(self.conn, f["test"], self.asof)
        self.assertEqual(audit_bets(self.conn, bets), [])
        m = metrics(f["test"], settle(self.conn, bets))
        for k in ("purchased_races", "n_bets", "stake_yen", "return_yen", "profit_yen", "roi", "hit_rate",
                  "max_losing_streak", "max_drawdown_yen", "avg_stake_per_race", "target_races", "skip_rate"):
            self.assertIn(k, m)
        self.assertEqual(m["stake_yen"], 100 * m["n_bets"])
        # 最終オッズを使った買いは監査で止まる
        bad = [dict(bets[0], odds_retrieved_at="2099-01-01T00:00:00+09:00")]
        self.assertTrue(audit_bets(self.conn, bad))

    def test_model_calibration_and_strategy(self):
        f = walk_forward_folds(self.races, 90, 20, 20)[0]
        mdl = M.train(self.conn, f["train"], self.asof)
        a = M.fit_power(mdl, self.conn, f["calib"], self.asof)
        preds = M.predict(mdl, self.conn, f["test"], self.asof, power=a)
        ev = M.evaluate(preds, self.conn)
        self.assertLess(ev["log_loss"], M.uniform_log_loss(preds))  # 何も学習しないより良い（仕組みの確認）
        mk = M.evaluate(M.market_probs(self.conn, f["test"], self.asof), self.conn)
        self.assertIsNotNone(mk["log_loss"])  # 市場（人気順）との比較ができる。勝ち負けはここでは問わない
        for d in preds.values():
            self.assertAlmostEqual(sum(d.values()), 1.0, places=6)  # 確率分布として整合
        rid = f["test"][0]
        t, odds = latest_usable_odds(self.conn, rid, "2車単", self.asof(rid))
        common = dict(calib=ev, n_train_races=len(f["train"]), median_past_races=10, leak_ok=True)
        d1 = decide(rid, preds[rid], odds, t, odds_spec_confirmed=False, **common)
        self.assertTrue(d1["skip"])  # オッズ仕様が未確認なら必ず Skip
        self.assertIn("今回はSkip", render(d1))
        d2 = decide(rid, preds[rid], odds, t, odds_spec_confirmed=True, **common)
        self.assertIn("今回はSkip" if d2["skip"] else "自信度", render(d2))
        self.assertEqual(sum(audit(self.conn).values()), 0)

    def test_money_management_helpers(self):
        self.assertEqual(kelly_fraction(0.1, 5.0), 0.0)            # 期待値1未満は0
        self.assertAlmostEqual(kelly_fraction(0.3, 5.0), (1.5 - 1) / 4 * 0.5)
        ok, checks = kelly_allowed(dict(ece=0.01, purchased_races=10, roi_ci95=(0.8, 1.3), odds_basis="pre_0800", leak_count=0))
        self.assertFalse(ok)                                       # サンプル不足・下限1.0以下なら使わない
        rr = [(100, 0)] * 9 + [(100, 800)]
        lo, hi = bootstrap_roi(rr, n=500)
        self.assertLessEqual(lo, hi)
        self.assertTrue(0 <= ruin_probability(rr, 1000, n_paths=200) <= 1)


if __name__ == "__main__":
    unittest.main()
