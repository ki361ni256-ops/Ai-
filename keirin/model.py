"""LightGBM による買い目確率の推定（STEP 8）。

予測対象：2車単（1着・2着の車番を着順どおり）。
選手単体の勝率を掛け合わせる方法（Harville 等）は、2着以下の確率がゆがむことが知られているため使わない。
代わりに、**組合せ (i, j) そのものを1行**とし「この組合せが的中したか」を目的変数にして学習し、
レースごとに合計が1になるよう正規化する（1レースで的中する組合せはちょうど1つなので、整合する確率分布になる）。
3連単は組合せが多くサンプルが足りなくなるため、十分なデータが貯まるまで対象外。
"""
import math

import numpy as np

from .backtest import latest_usable_odds
from .features import VERSION, DEFINITIONS

BET_TYPE = "2車単"
RIDER_FEATURES = [d[0] for d in DEFINITIONS if d[0] != "odds_2tan_min_as_first"]


def _rider_features(conn, race_id, as_of):
    rows = conn.execute("SELECT car_no, feature_name, value FROM feature_values WHERE race_id=? AND as_of=?"
                        " AND feature_version=?", (race_id, as_of, VERSION)).fetchall()
    out = {}
    for car, name, val in rows:
        out.setdefault(car, {})[name] = val
    return out


def combo_rows(conn, race_id, as_of):
    """予測に使う行（結果は読まない）。戻り値: [(combination, 特徴量ベクトル)]"""
    feats = _rider_features(conn, race_id, as_of)
    _, odds = latest_usable_odds(conn, race_id, BET_TYPE, as_of)
    cars = sorted(feats)
    rows = []
    for i in cars:
        for j in cars:
            if i == j:
                continue
            combo = f"{i}-{j}"
            vec = [feats[i].get(f) for f in RIDER_FEATURES] + [feats[j].get(f) for f in RIDER_FEATURES]
            o = odds.get(combo)
            vec += [math.log(o) if o else None, len(cars)]
            rows.append((combo, [np.nan if v is None else float(v) for v in vec]))
    return rows


def feature_names():
    return [f"a_{f}" for f in RIDER_FEATURES] + [f"b_{f}" for f in RIDER_FEATURES] + ["combo_log_odds_0800", "n_riders"]


def winning_combo(conn, race_id):
    """結果から的中した2車単を作る（学習・評価用。予測の入力には使わない）。"""
    r = conn.execute("SELECT car_no, finish_order FROM results WHERE race_id=? AND finish_order IN (1,2)", (race_id,)).fetchall()
    d = {fo: c for c, fo in r}
    return f"{d[1]}-{d[2]}" if 1 in d and 2 in d else None


def build(conn, race_ids, as_of_fn, with_labels):
    X, y, groups, combos = [], [], [], []
    for rid in race_ids:
        rows = combo_rows(conn, rid, as_of_fn(rid))
        if not rows:
            continue
        win = winning_combo(conn, rid) if with_labels else None
        if with_labels and win is None:
            continue
        for combo, vec in rows:
            X.append(vec)
            y.append(1 if combo == win else 0)
            groups.append(rid)
            combos.append(combo)
    return np.array(X, dtype=float), np.array(y), groups, combos


def normalize(raw, groups, power=1.0):
    """レースごとに合計1にする。power は校正用（p^a を正規化）。"""
    raw = np.clip(np.asarray(raw, dtype=float), 1e-12, 1)
    out = np.empty_like(raw)
    idx = {}
    for k, g in enumerate(groups):
        idx.setdefault(g, []).append(k)
    for ks in idx.values():
        v = raw[ks] ** power
        out[ks] = v / v.sum()
    return out


def train(conn, train_ids, as_of_fn, params=None):
    import lightgbm as lgb
    X, y, _, _ = build(conn, train_ids, as_of_fn, with_labels=True)
    if len(set(y)) < 2:
        raise ValueError("学習データが足りない（的中・不的中の両方が必要）")
    m = lgb.LGBMClassifier(**(params or dict(n_estimators=300, learning_rate=0.02, num_leaves=4,
                                              min_child_samples=100, reg_lambda=5.0, subsample=0.8, subsample_freq=1,
                                              colsample_bytree=0.8, random_state=0, verbose=-1)))
    m.fit(X, y)
    return m


def predict(model, conn, race_ids, as_of_fn, power=1.0):
    X, _, groups, combos = build(conn, race_ids, as_of_fn, with_labels=False)
    if len(X) == 0:
        return {}
    p = normalize(model.predict_proba(X)[:, 1], groups, power)
    out = {}
    for g, c, v in zip(groups, combos, p):
        out.setdefault(g, {})[c] = float(v)
    return out


def evaluate(preds, conn):
    """Log Loss・Brier・的中率（最有力の組合せ）・校正表・ECE。"""
    ll, br, hit, n = 0.0, 0.0, 0, 0
    pairs = []
    for rid, dist in preds.items():
        win = winning_combo(conn, rid)
        if win is None:
            continue
        n += 1
        ll += -math.log(max(dist.get(win, 0.0), 1e-12))
        br += sum((p - (c == win)) ** 2 for c, p in dist.items())
        hit += max(dist, key=dist.get) == win
        pairs += [(p, int(c == win)) for c, p in dist.items()]
    if n == 0:
        return None
    bins = [0, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 1.01]
    table, ece = [], 0.0
    for a, b in zip(bins, bins[1:]):
        sel = [(p, y) for p, y in pairs if a <= p < b]
        if sel:
            mp = sum(p for p, _ in sel) / len(sel)
            mo = sum(y for _, y in sel) / len(sel)
            table.append(dict(bin=f"{a:.2f}-{b:.2f}", n=len(sel), mean_pred=mp, observed=mo))
            ece += len(sel) / len(pairs) * abs(mp - mo)
    return dict(races=n, log_loss=ll / n, brier=br / n, top1_hit_rate=hit / n, calibration=table, ece=ece)


def fit_power(model, conn, calib_ids, as_of_fn, grid=None):
    """校正：校正期間（学習より後・検証より前）の Log Loss が最小になる指数 a を探す。"""
    grid = grid or [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.35, 1.5, 1.75, 2.0]
    best = (None, 1.0)
    for a in grid:
        e = evaluate(predict(model, conn, calib_ids, as_of_fn, power=a), conn)
        if e and (best[0] is None or e["log_loss"] < best[0]):
            best = (e["log_loss"], a)
    return best[1]


def uniform_log_loss(preds):
    """何も学習しない場合（全組合せ同確率）の Log Loss。比較の基準。"""
    vals = [math.log(len(d)) for d in preds.values() if d]
    return sum(vals) / len(vals) if vals else None


def market_probs(conn, race_ids, as_of_fn):
    """比較の基準：朝8時オッズの逆数を正規化した「市場の確率」（人気順と同じ情報）。"""
    out = {}
    for rid in race_ids:
        _, odds = latest_usable_odds(conn, rid, BET_TYPE, as_of_fn(rid))
        if odds:
            inv = {c: 1 / o for c, o in odds.items() if o}
            s = sum(inv.values())
            out[rid] = {c: v / s for c, v in inv.items()}
    return out
