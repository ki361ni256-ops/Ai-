"""少しずつ取得する仕組み（STEP 5）。

- 提供元の auto_fetch_allowed が 1 でなければ、1件もアクセスしない
- アクセス間隔（min_interval_sec）を必ず空ける
- 失敗は指数バックオフで再試行し、上限（max_attempts）で打ち切る（無限リトライしない）
- 同じ URL はキューで一意。同じ内容は raw_fetches のハッシュで二重登録しない
- キューが DB に残るので、途中で止めても次回は続きから再開できる
- 1回ごとの記録を fetch_log、実行ごとの件数と処理時間を fetch_runs に残す

fetcher は (url) -> (http_status, bytes) を返す関数。実際の HTTP 取得関数は、
規約・robots.txt を確認した提供元についてだけ渡す。
"""
import hashlib
import time
from datetime import datetime, timedelta
from pathlib import Path

from .timeutil import JST, now_jst, to_jst_iso


class FetchRefused(Exception):
    pass


def enqueue(conn, source_id, urls, kind, event_date=None):
    ts = now_jst()
    n = 0
    for u in urls:
        cur = conn.execute(
            "INSERT OR IGNORE INTO fetch_queue(source_id, source_url, kind, event_date, created_at, updated_at)"
            " VALUES (?,?,?,?,?,?)", (source_id, u, kind, event_date, ts, ts))
        n += cur.rowcount
    conn.commit()
    return n


def requeue(conn, source_id, url):
    """取得済みの URL をもう一度取りに行く（結果の再確認など）。内容が同じなら duplicate として数える。"""
    conn.execute("UPDATE fetch_queue SET status='pending', attempts=0, next_try_at=NULL, updated_at=?"
                 " WHERE source_id=? AND source_url=? AND status='done'", (now_jst(), source_id, url))
    conn.commit()


def run(conn, source_id, fetcher, raw_dir="data/raw", max_tasks=20, max_attempts=3,
        base_backoff_sec=30, sleep=time.sleep, clock=time.monotonic):
    src = conn.execute("SELECT * FROM data_sources WHERE source_id=?", (source_id,)).fetchone()
    started = clock()
    run_id = conn.execute("INSERT INTO fetch_runs(started_at, status) VALUES (?, 'running')",
                          (now_jst(),)).lastrowid
    counts = dict(n_ok=0, n_failed=0, n_duplicate=0, n_retry=0)

    def finish(status, note=None):
        conn.execute("UPDATE fetch_runs SET finished_at=?, duration_sec=?, n_ok=?, n_failed=?, n_duplicate=?,"
                     " n_retry=?, status=?, note=? WHERE run_id=?",
                     (now_jst(), round(clock() - started, 3), counts["n_ok"], counts["n_failed"],
                      counts["n_duplicate"], counts["n_retry"], status, note, run_id))
        conn.commit()

    if src is None or src["auto_fetch_allowed"] != 1:
        conn.execute("INSERT INTO fetch_log(run_id, source_url, requested_at, status, attempt, message)"
                     " VALUES (?,?,?,?,?,?)", (run_id, src["base_url"] if src else "?", now_jst(), "refused", 0,
                                               "auto_fetch_allowed が 1 ではない（規約・robots.txt 未確認または禁止）"))
        finish("refused", "提供元の自動取得が許可されていない")
        raise FetchRefused(f"source_id={source_id} は自動取得が許可されていない")

    interval = src["min_interval_sec"]
    now = now_jst()
    tasks = conn.execute(
        "SELECT * FROM fetch_queue WHERE source_id=? AND status='pending'"
        " AND (next_try_at IS NULL OR next_try_at <= ?) ORDER BY task_id LIMIT ?",
        (source_id, now, max_tasks)).fetchall()
    raw_dir = Path(raw_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)
    last = None
    for t in tasks:
        if last is not None:
            wait = interval - (clock() - last)
            if wait > 0:
                sleep(wait)
        last = clock()
        attempt = t["attempts"] + 1
        req_at = now_jst()
        t0 = clock()
        try:
            status, body = fetcher(t["source_url"])
            if status != 200:
                raise RuntimeError(f"HTTP {status}")
        except Exception as e:  # 失敗：ログに残し、上限までは時間を空けて再試行
            ms = int((clock() - t0) * 1000)
            if attempt >= max_attempts:
                conn.execute("UPDATE fetch_queue SET status='failed', attempts=?, last_error=?, updated_at=?"
                             " WHERE task_id=?", (attempt, str(e), now_jst(), t["task_id"]))
                st = "gave_up"
                counts["n_failed"] += 1
            else:
                nxt = to_jst_iso(datetime.now(JST) + timedelta(seconds=base_backoff_sec * 2 ** (attempt - 1)))
                conn.execute("UPDATE fetch_queue SET attempts=?, last_error=?, next_try_at=?, updated_at=?"
                             " WHERE task_id=?", (attempt, str(e), nxt, now_jst(), t["task_id"]))
                st = "error"
                counts["n_retry"] += 1
            conn.execute("INSERT INTO fetch_log(run_id, task_id, source_url, requested_at, elapsed_ms, status, attempt, message)"
                         " VALUES (?,?,?,?,?,?,?,?)", (run_id, t["task_id"], t["source_url"], req_at, ms, st, attempt, str(e)))
            conn.commit()
            continue
        ms = int((clock() - t0) * 1000)
        sha = hashlib.sha256(body).hexdigest()
        path = raw_dir / f"{sha}.bin"
        if not path.exists():
            path.write_bytes(body)
        cur = conn.execute(
            "INSERT OR IGNORE INTO raw_fetches(source_id, source_url, kind, event_date, retrieved_at, http_status,"
            " content_sha256, storage_path, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (source_id, t["source_url"], t["kind"], t["event_date"], req_at, status, sha, str(path), now_jst()))
        st = "ok" if cur.rowcount else "duplicate"
        counts["n_ok" if cur.rowcount else "n_duplicate"] += 1
        conn.execute("UPDATE fetch_queue SET status='done', attempts=?, last_error=NULL, updated_at=? WHERE task_id=?",
                     (attempt, now_jst(), t["task_id"]))
        conn.execute("INSERT INTO fetch_log(run_id, task_id, source_url, requested_at, elapsed_ms, status, http_status, attempt)"
                     " VALUES (?,?,?,?,?,?,?,?)", (run_id, t["task_id"], t["source_url"], req_at, ms, st, status, attempt))
        conn.commit()
    finish("finished")
    return run_id, counts
