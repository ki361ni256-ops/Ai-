"""正規化などの前処理。統計量は学習期間のデータだけで計算する（テスト期間を混ぜない）。"""
import statistics


def fit_standardizer(train_rows, columns):
    """train_rows: 学習期間の行（dict）だけを渡す。戻り値は列ごとの (平均, 標準偏差)。"""
    params = {}
    for c in columns:
        vals = [r[c] for r in train_rows if r.get(c) is not None]
        if len(vals) < 2:
            params[c] = None
            continue
        sd = statistics.pstdev(vals)
        params[c] = (statistics.mean(vals), sd if sd > 0 else None)
    return params


def apply_standardizer(rows, params):
    """学習期間で求めた (平均, 標準偏差) で変換する。統計量が無い列や欠損値は None にする。"""
    out = []
    for r in rows:
        r2 = dict(r)
        for c, p in params.items():
            v = r2.get(c)
            r2[c] = None if (p is None or p[1] is None or v is None) else (v - p[0]) / p[1]
        out.append(r2)
    return out


def time_split(rows, split_time, key="race_start_time"):
    """時系列で分割。split_time 以前を学習、より後をテスト。ランダム分割はしない。"""
    train = [r for r in rows if r[key] <= split_time]
    test = [r for r in rows if r[key] > split_time]
    return train, test
