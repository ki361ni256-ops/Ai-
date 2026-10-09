"""STEP 5 の取得の仕組み（実サイトにはアクセスしない。架空の fetcher を使う）。"""
import tempfile
import unittest

from keirin.collector import enqueue, run, FetchRefused
from tests.fixtures import make_db


class FakeFetcher:
    def __init__(self):
        self.calls = []

    def __call__(self, url):
        self.calls.append(url)
        if url.endswith("/bad"):
            return 500, b""
        if url.endswith("/a") or url.endswith("/a-copy"):
            return 200, b"same body"
        return 200, url.encode()


class TestCollector(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.tmp.cleanup()

    def test_refuses_when_not_allowed(self):
        conn = make_db(allowed=None)
        enqueue(conn, 1, ["https://example.invalid/a"], "race_card")
        f = FakeFetcher()
        with self.assertRaises(FetchRefused):
            run(conn, 1, f, raw_dir=self.tmp.name)
        self.assertEqual(f.calls, [])
        self.assertEqual(conn.execute("SELECT status FROM fetch_runs").fetchone()[0], "refused")

    def test_dedupe_error_resume_and_logs(self):
        conn = make_db()
        urls = [f"https://example.invalid/{x}" for x in ("a", "bad", "c")]
        self.assertEqual(enqueue(conn, 1, urls, "race_card"), 3)
        self.assertEqual(enqueue(conn, 1, urls, "race_card"), 0)  # キューに二重登録しない
        sleeps = []
        f = FakeFetcher()
        kw = dict(raw_dir=self.tmp.name, max_attempts=2, sleep=sleeps.append, base_backoff_sec=0)
        # 1回目：1件だけで止める（途中停止）
        _, c1 = run(conn, 1, f, max_tasks=1, **kw)
        self.assertEqual(c1["n_ok"], 1)
        # 2回目：続きから再開。bad は失敗して再試行待ち、c は成功
        _, c2 = run(conn, 1, f, **kw)
        self.assertEqual((c2["n_ok"], c2["n_retry"]), (1, 1))
        # 3回目：a を再取得（内容が同じ → 重複）、bad は上限で打ち切り
        from keirin.collector import requeue
        requeue(conn, 1, "https://example.invalid/a")
        _, c3 = run(conn, 1, f, **kw)
        self.assertEqual((c3["n_duplicate"], c3["n_failed"]), (1, 1))
        # 4回目：やることがない（無限リトライしない）
        _, c4 = run(conn, 1, f, **kw)
        self.assertEqual(sum(c4.values()), 0)
        self.assertEqual(f.calls.count("https://example.invalid/bad"), 2)
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM raw_fetches").fetchone()[0], 2)
        st = dict(conn.execute("SELECT status, COUNT(*) FROM fetch_queue GROUP BY status").fetchall())
        self.assertEqual(st, {"done": 2, "failed": 1})
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM fetch_log").fetchone()[0], 5)
        self.assertTrue(sleeps and all(x > 0 for x in sleeps))  # アクセス間隔を空けている
        row = conn.execute("SELECT duration_sec, status FROM fetch_runs WHERE run_id=1").fetchone()
        self.assertIsNotNone(row[0])
        self.assertEqual(row[1], "finished")

if __name__ == "__main__":
    unittest.main()
