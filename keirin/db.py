"""DB の作成と upsert。"""
import sqlite3
from pathlib import Path

from .timeutil import now_jst

SCHEMA = Path(__file__).resolve().parent.parent / "db" / "schema.sql"


def connect(path="keirin.db"):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn):
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))
    conn.commit()


def upsert(conn, table, row, key_cols):
    """key_cols が同じ行があれば更新、なければ追加。created_at は最初の値を残す。
    戻り値: 'inserted' / 'updated' / 'unchanged'"""
    row = dict(row)
    ts = now_jst()
    has_ts = {r[1] for r in conn.execute(f"PRAGMA table_info({table})")}
    where = " AND ".join(f"{k} = ?" for k in key_cols)
    old = conn.execute(f"SELECT * FROM {table} WHERE {where}", [row[k] for k in key_cols]).fetchone()
    if old is not None:
        changed = {k: v for k, v in row.items() if k not in key_cols and old[k] != v}
        if not changed:
            return "unchanged"
        if "updated_at" in has_ts:
            changed["updated_at"] = ts
        sets = ", ".join(f"{k} = ?" for k in changed)
        conn.execute(f"UPDATE {table} SET {sets} WHERE {where}",
                     list(changed.values()) + [row[k] for k in key_cols])
        return "updated"
    if "created_at" in has_ts:
        row.setdefault("created_at", ts)
    if "updated_at" in has_ts:
        row.setdefault("updated_at", ts)
    cols = ", ".join(row)
    conn.execute(f"INSERT INTO {table} ({cols}) VALUES ({', '.join('?' * len(row))})", list(row.values()))
    return "inserted"


def audit(conn):
    """監査用ビューの件数。すべて 0 なら問題なし。"""
    views = ["v_leak_features", "v_leak_predictions", "v_leak_train_overlap", "v_leak_backtest_odds"]
    return {v: conn.execute(f"SELECT COUNT(*) FROM {v}").fetchone()[0] for v in views}
