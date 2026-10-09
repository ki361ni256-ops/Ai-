"""cleaned 層への登録。パース済みの値（dict）を受け取り、時刻をそろえて upsert する。
提供元ごとのパーサーは、規約確認が済んだ提供元についてだけ別途作る（まだ無い）。"""
from .db import upsert
from .timeutil import to_jst_iso, cutoff_0800

BET_TYPES = {"2車単", "2車複", "3連単", "3連複", "ワイド", "2枠単", "2枠複"}
ORDERED = {"2車単", "3連単", "2枠単"}


def normalize_combination(bet_type, combo):
    nums = [int(x) for x in str(combo).replace("=", "-").split("-")]
    if bet_type not in ORDERED:
        nums = sorted(nums)
    return "-".join(map(str, nums))


def classify_snapshot(retrieved_at, race_start_time, event_date):
    """取得時刻からオッズの種類を決める。8時以前かつ発走前だけが 'pre_0800'。"""
    if retrieved_at >= race_start_time:
        return "final"
    if retrieved_at <= cutoff_0800(event_date):
        return "pre_0800"
    return "live"


def add_race(conn, race):
    race = dict(race)
    race["race_start_time"] = to_jst_iso(race["race_start_time"])
    race["retrieved_at"] = to_jst_iso(race["retrieved_at"])
    st = upsert(conn, "races", race, ["velodrome_id", "event_date", "race_no"])
    rid = conn.execute("SELECT race_id FROM races WHERE velodrome_id=? AND event_date=? AND race_no=?",
                       (race["velodrome_id"], race["event_date"], race["race_no"])).fetchone()[0]
    conn.execute("INSERT OR IGNORE INTO race_start_time_history(race_id, race_start_time, retrieved_at, source_id, raw_id)"
                 " VALUES (?,?,?,?,?)", (rid, race["race_start_time"], race["retrieved_at"],
                                         race.get("source_id"), race.get("raw_id")))
    return rid, st


def add_odds(conn, race_id, bet_type, combination, odds_min, retrieved_at, odds_max=None,
             source_timestamp=None, source_id=None, source_url=None, raw_id=None):
    if bet_type not in BET_TYPES:
        raise ValueError(f"競輪に存在しない賭式: {bet_type}")
    if retrieved_at is None:
        raise ValueError("取得時刻のないオッズは登録しない")
    r = conn.execute("SELECT event_date, race_start_time FROM races WHERE race_id=?", (race_id,)).fetchone()
    ret = to_jst_iso(retrieved_at)
    row = dict(race_id=race_id, bet_type=bet_type,
               combination=normalize_combination(bet_type, combination),
               odds_min=odds_min, odds_max=odds_max, retrieved_at=ret,
               source_timestamp=to_jst_iso(source_timestamp), race_start_time=r["race_start_time"],
               snapshot_kind=classify_snapshot(ret, r["race_start_time"], r["event_date"]),
               source_id=source_id, source_url=source_url, raw_id=raw_id)
    return upsert(conn, "odds_snapshots", row, ["race_id", "bet_type", "combination", "retrieved_at"])


def add_result(conn, row):
    row = dict(row)
    row["retrieved_at"] = to_jst_iso(row["retrieved_at"])
    row["result_confirmed_at"] = to_jst_iso(row.get("result_confirmed_at"))
    return upsert(conn, "results", row, ["race_id", "car_no"])


def add_entry(conn, row):
    row = dict(row)
    row["retrieved_at"] = to_jst_iso(row["retrieved_at"])
    return upsert(conn, "entries", row, ["race_id", "car_no", "retrieved_at"])
