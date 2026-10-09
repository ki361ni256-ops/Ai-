"""STEP 6 の未来情報混入チェック。"""
import unittest

from keirin.db import audit
from keirin.features import compute_race, register_definitions
from keirin.loaders import add_odds, add_entry
from keirin.preprocess import fit_standardizer, apply_standardizer, time_split
from tests.fixtures import make_db, history, race


class TestFeatures(unittest.TestCase):
    def setUp(self):
        self.conn = make_db()
        register_definitions(self.conn)
        self.ids = history(self.conn)

    def test_rolling_excludes_own_and_future(self):
        res = dict(compute_race(self.conn, self.ids["tgt"]))
        f = res[1]
        self.assertEqual(f["prev_finish_1"], 1)          # 1/2 の1着（対象レースの3着は入らない）
        self.assertEqual(f["mean_finish_last2"], 1.5)    # 1/2 と 1/1
        self.assertIsNone(f["mean_finish_last3"])        # 3走そろわない（後のレースの1着は入らない）
        self.assertEqual(f["n_past_races"], 2)
        self.assertEqual(f["track_length_m"], 400)
        self.assertEqual(res[2]["n_past_races"], 0)      # R2 は過去走なし（推測で埋めない）
        self.assertEqual(sum(audit(self.conn).values()), 0)

    def test_same_day_result_without_confirm_time_not_used(self):
        early = race(self.conn, "2026-01-03", 0, "2026-01-03T07:00:00+09:00", "2026-01-03T06:00:00+09:00")
        add_entry(self.conn, dict(race_id=early, car_no=1, racer_id="R1", retrieved_at="2026-01-03T06:00:00+09:00"))
        self.conn.execute("INSERT INTO results(race_id,car_no,finish_order,retrieved_at,created_at,updated_at)"
                          " VALUES (?,1,9,'2026-01-03T07:30:00+09:00','x','x')", (early,))
        f = dict(compute_race(self.conn, self.ids["tgt"]))[1]
        self.assertEqual(f["prev_finish_1"], 1)  # 同日・確定時刻不明の結果は使わない

    def test_odds_feature_uses_only_pre_0800(self):
        t = self.ids["tgt"]
        add_odds(self.conn, t, "2車単", "1-2", 7.0, "2026-01-03T07:40:00+09:00")
        add_odds(self.conn, t, "2車単", "1-2", 3.0, "2026-01-03T10:00:00+09:00")
        add_odds(self.conn, t, "2車単", "1-2", 2.5, "2026-01-03T11:05:00+09:00")
        f = dict(compute_race(self.conn, t))[1]
        self.assertEqual(f["odds_2tan_min_as_first"], 7.0)

    def test_entries_after_as_of_not_used_unless_backfill(self):
        r = race(self.conn, "2026-01-04", 1, "2026-01-04T11:00:00+09:00", "2026-02-01T00:00:00+09:00")
        add_entry(self.conn, dict(race_id=r, car_no=1, racer_id="R1", retrieved_at="2026-02-01T00:00:00+09:00"))
        self.assertEqual(compute_race(self.conn, r), [])  # 8時以前の出走表がない
        out = compute_race(self.conn, r, entries_policy="backfill")
        self.assertEqual(len(out), 1)
        warn = self.conn.execute("SELECT COUNT(*) FROM v_warn_features").fetchone()[0]
        self.assertGreater(warn, 0)  # 近似は WARNING として残る

    def test_standardizer_fits_on_train_only(self):
        rows = [dict(race_start_time=f"2026-01-0{i}T11:00:00+09:00", x=float(i)) for i in range(1, 7)]
        train, test = time_split(rows, "2026-01-03T23:59:59+09:00")
        p = fit_standardizer(train, ["x"])
        self.assertAlmostEqual(p["x"][0], 2.0)  # テスト期間（4〜6）は平均に入らない
        out = apply_standardizer(test, p)
        self.assertGreater(out[0]["x"], 0)


if __name__ == "__main__":
    unittest.main()
