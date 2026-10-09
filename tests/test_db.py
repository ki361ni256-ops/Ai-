"""STEP 4 の監査項目を確かめるテスト。"""
import unittest

from keirin.db import init_db, upsert, audit
from keirin.loaders import add_odds, add_race
from tests.fixtures import make_db, race, history


class TestDB(unittest.TestCase):
    def setUp(self):
        self.conn = make_db()

    def test_init_twice_and_no_duplicate_race(self):
        init_db(self.conn)  # 2回目でも壊れない
        race(self.conn, "2026-01-05", 1, "2026-01-05T11:00:00+09:00", "2026-01-05T07:00:00+09:00")
        _, st = add_race(self.conn, dict(meet_id=1, velodrome_id=1, event_date="2026-01-05", race_no=1, class_tier="S",
                                         race_start_time="2026-01-05T11:00:00+09:00",
                                         retrieved_at="2026-01-05T07:00:00+09:00"))
        self.assertEqual(st, "unchanged")
        self.assertEqual(self.conn.execute("SELECT COUNT(*) FROM races").fetchone()[0], 1)

    def test_odds_time_series_and_0800_view(self):
        rid = race(self.conn, "2026-01-05", 1, "2026-01-05T11:00:00+09:00", "2026-01-05T07:00:00+09:00")
        for t, v in (("2026-01-05T07:30:00+09:00", 6.0), ("2026-01-05T09:00:00+09:00", 5.0),
                     ("2026-01-05T11:05:00+09:00", 4.0)):
            add_odds(self.conn, rid, "2車単", "1-2", v, t)
        add_odds(self.conn, rid, "2車単", "1-2", 6.0, "2026-01-05T07:30:00+09:00")  # 同じ取得をもう一度
        kinds = [r[0] for r in self.conn.execute("SELECT snapshot_kind FROM odds_snapshots ORDER BY retrieved_at")]
        self.assertEqual(kinds, ["pre_0800", "live", "final"])
        usable = self.conn.execute("SELECT odds_min FROM v_odds_usable_0800").fetchall()
        self.assertEqual([r[0] for r in usable], [6.0])

    def test_rejects_invalid(self):
        rid = race(self.conn, "2026-01-05", 1, "2026-01-05T11:00:00+09:00", "2026-01-05T07:00:00+09:00")
        with self.assertRaises(ValueError):
            add_odds(self.conn, rid, "単勝", "1", 2.0, "2026-01-05T07:00:00+09:00")
        with self.assertRaises(ValueError):
            add_odds(self.conn, rid, "2車単", "1-2", 2.0, None)
        with self.assertRaises(ValueError):
            add_odds(self.conn, rid, "2車単", "1-2", 2.0, "2026-01-05T07:00:00")  # タイムゾーンなし

    def test_leak_views_detect_problems(self):
        ids = history(self.conn)
        c = self.conn
        upsert(c, "feature_definitions", dict(feature_name="x", feature_version=1, description="d", available_at="a",
                                             leakage_risk="r", source_tables="t"), ["feature_name", "feature_version"])
        upsert(c, "feature_values", dict(race_id=ids["tgt"], car_no=1, feature_name="x", feature_version=1,
                                         as_of="2026-01-03T08:00:00+09:00", value=1,
                                         max_input_time="2026-01-03T11:10:00+09:00", computed_at="2026-01-03T08:00:00+09:00"),
               ["race_id", "car_no", "feature_name", "feature_version", "as_of"])
        upsert(c, "models", dict(model_id=1, name="m", version="1", train_start="2026-01-01T00:00:00+09:00",
                                 train_end="2026-01-03T12:00:00+09:00", feature_set="[]",
                                 trained_at="2026-01-04T00:00:00+09:00"), ["model_id"])
        upsert(c, "predictions", dict(model_id=1, race_id=ids["tgt"], bet_type="2車単", combination="1-2", prob=0.1,
                                      as_of="2026-01-03T11:30:00+09:00"), ["model_id", "race_id", "bet_type", "combination", "as_of"])
        add_odds(c, ids["tgt"], "2車単", "1-2", 4.0, "2026-01-03T11:05:00+09:00")  # 最終オッズ
        upsert(c, "backtest_runs", dict(backtest_id=1, model_id=1, period_start="2026-01-03", period_end="2026-01-03",
                                        odds_basis="pre_0800"), ["backtest_id"])
        upsert(c, "backtest_bets", dict(backtest_id=1, race_id=ids["tgt"], bet_type="2車単", combination="1-2", stake_yen=100,
                                        as_of="2026-01-03T08:00:00+09:00", odds_retrieved_at="2026-01-03T11:05:00+09:00",
                                        odds_used=4.0), ["backtest_id", "race_id", "bet_type", "combination"])
        a = audit(c)
        self.assertEqual(a["v_leak_features"], 1)
        self.assertEqual(a["v_leak_predictions"], 1)
        self.assertEqual(a["v_leak_train_overlap"], 1)
        self.assertEqual(a["v_leak_backtest_odds"], 1)

    def test_predictions_do_not_contain_results(self):
        cols = {r[1] for r in self.conn.execute("PRAGMA table_info(predictions)")}
        self.assertFalse(cols & {"finish_order", "payout_yen", "result_confirmed_at"})


if __name__ == "__main__":
    unittest.main()
