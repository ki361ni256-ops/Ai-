"""時刻の扱い。DB には必ず +09:00 付き ISO 8601（秒まで）で入れる。"""
from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))


def to_jst_iso(value):
    """datetime または ISO 文字列を 'YYYY-MM-DDTHH:MM:SS+09:00' にそろえる。
    タイムゾーンのない値は推測で補わず、エラーにする。"""
    if value is None:
        return None
    if isinstance(value, str):
        value = datetime.fromisoformat(value)
    if value.tzinfo is None:
        raise ValueError(f"タイムゾーンのない時刻は受け付けない: {value!r}")
    return value.astimezone(JST).replace(microsecond=0).isoformat()


def now_jst():
    return to_jst_iso(datetime.now(JST))


def cutoff_0800(event_date):
    """開催日の朝8時（予測時点）。"""
    return f"{event_date}T08:00:00+09:00"
