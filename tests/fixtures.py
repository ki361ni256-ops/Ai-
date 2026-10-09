"""テスト専用の架空データ。実在の選手・レースではない。分析には使わない。"""
from keirin.db import connect, init_db, upsert
from keirin.loaders import add_race, add_entry, add_result


def make_db(allowed=1):
    conn = connect(":memory:")
    init_db(conn)
    upsert(conn, "data_sources", dict(source_id=1, name="TEST", base_url="https://example.invalid",
                                      auto_fetch_allowed=allowed, min_interval_sec=5), ["source_id"])
    upsert(conn, "velodromes", dict(velodrome_id=1, name="テスト場", track_length_m=400, home_straight_m=50.0),
           ["velodrome_id"])
    upsert(conn, "meets", dict(meet_id=1, velodrome_id=1, first_date="2026-01-01", grade="unverified"), ["meet_id"])
    for rid in ("R1", "R2"):
        upsert(conn, "racers", dict(racer_id=rid, name=f"テスト{rid}"), ["racer_id"])
    conn.commit()
    return conn


def race(conn, date, no, start, retrieved):
    rid, _ = add_race(conn, dict(meet_id=1, velodrome_id=1, event_date=date, race_no=no, class_tier="S",
                                 race_start_time=start, retrieved_at=retrieved))
    return rid


def history(conn):
    """R1 の成績: 1/1 → 2着、1/2 → 1着（確定時刻あり）、1/3 対象レース（自分の結果 3着）、1/3 対象より後のレース（1着）"""
    r1 = race(conn, "2026-01-01", 1, "2026-01-01T11:00:00+09:00", "2026-02-01T00:00:00+09:00")
    r2 = race(conn, "2026-01-02", 1, "2026-01-02T11:00:00+09:00", "2026-02-01T00:00:00+09:00")
    tgt = race(conn, "2026-01-03", 1, "2026-01-03T11:00:00+09:00", "2026-01-03T07:00:00+09:00")
    later = race(conn, "2026-01-03", 5, "2026-01-03T14:00:00+09:00", "2026-01-03T07:00:00+09:00")
    for r in (r1, r2):
        add_entry(conn, dict(race_id=r, car_no=1, racer_id="R1", retrieved_at="2026-02-01T00:00:00+09:00"))
    add_entry(conn, dict(race_id=tgt, car_no=1, racer_id="R1", retrieved_at="2026-01-03T07:00:00+09:00"))
    add_entry(conn, dict(race_id=tgt, car_no=2, racer_id="R2", retrieved_at="2026-01-03T07:00:00+09:00"))
    add_entry(conn, dict(race_id=later, car_no=1, racer_id="R1", retrieved_at="2026-01-03T07:00:00+09:00"))
    # 1/1 は確定時刻不明（前日以前なので使える）、1/2 は確定時刻あり
    add_result(conn, dict(race_id=r1, car_no=1, finish_order=2, retrieved_at="2026-02-01T00:00:00+09:00"))
    add_result(conn, dict(race_id=r2, car_no=1, finish_order=1, result_confirmed_at="2026-01-02T11:10:00+09:00",
                          retrieved_at="2026-02-01T00:00:00+09:00"))
    add_result(conn, dict(race_id=tgt, car_no=1, finish_order=3, result_confirmed_at="2026-01-03T11:10:00+09:00",
                          retrieved_at="2026-01-03T12:00:00+09:00"))
    add_result(conn, dict(race_id=later, car_no=1, finish_order=1, result_confirmed_at="2026-01-03T14:10:00+09:00",
                          retrieved_at="2026-01-03T15:00:00+09:00"))
    conn.commit()
    return dict(r1=r1, r2=r2, tgt=tgt, later=later)
