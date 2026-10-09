"""期待値・Skip・資金配分（STEP 9）。

E = p × O。p はモデルの校正済み確率、O は「100円あたりの払戻金 ÷ 100」（賭け金を含む総払戻倍率）。
※ 競輪のオッズ表示がこの意味であることは、公式仕様で確認するまで odds_spec_confirmed=False とし、
  確認できていない間は購入判断を出さない（Skip）。
"""
import math
import random

DEFAULTS = dict(
    ev_threshold=1.10,        # 控除率を考えて 1.0 より高めに置く。値は検証期間で決め直す
    max_entropy=0.85,         # 正規化エントロピーがこれを超えたら混戦として Skip
    max_ece=0.02,             # 校正誤差の上限
    min_train_races=500,      # 学習に使ったレース数の下限
    min_past_races=3,         # 出走選手の過去走数（中央値）の下限
)


def normalized_entropy(dist):
    ps = [p for p in dist.values() if p > 0]
    if len(ps) < 2:
        return 0.0
    return -sum(p * math.log(p) for p in ps) / math.log(len(dist))


def decide(race_id, dist, odds, odds_retrieved_at, *, calib, n_train_races, median_past_races,
           leak_ok, odds_spec_confirmed, cfg=None):
    """1レースの購入判断。戻り値 dict（skip=True なら reasons に理由）。"""
    cfg = dict(DEFAULTS, **(cfg or {}))
    reasons = []
    if not odds_spec_confirmed:
        reasons.append("オッズの意味（払戻倍率）を公式仕様でまだ確認していない")
    if not odds or not odds_retrieved_at:
        reasons.append("朝8時以前に取得したオッズがない／取得時刻が不明")
    if not leak_ok:
        reasons.append("未来情報が混入している可能性がある（監査で検出）")
    if calib is None or calib.get("ece") is None or calib["ece"] > cfg["max_ece"]:
        reasons.append("確率校正が不十分")
    if n_train_races < cfg["min_train_races"]:
        reasons.append(f"学習レース数が少なすぎる（{n_train_races} < {cfg['min_train_races']}）")
    if median_past_races is None or median_past_races < cfg["min_past_races"]:
        reasons.append("出走選手の過去走が少なく、予測の信頼性が低い")
    h = normalized_entropy(dist) if dist else 1.0
    if h > cfg["max_entropy"]:
        reasons.append(f"混戦度が高い（正規化エントロピー {h:.2f} > {cfg['max_entropy']}）")
    cands = []
    for c, p in (dist or {}).items():
        o = (odds or {}).get(c)
        if o:
            cands.append(dict(combination=c, p=p, odds=o, ev=p * o))
    good = sorted([x for x in cands if x["ev"] >= cfg["ev_threshold"]], key=lambda x: -x["ev"])
    if not good:
        reasons.append(f"期待値が基準（{cfg['ev_threshold']}）以上の買い目がない")
    if reasons:
        return dict(race_id=race_id, skip=True, reasons=reasons, entropy=h)
    top = good[0]
    rank = "S" if top["ev"] >= 1.30 and h <= 0.6 else "A" if top["ev"] >= 1.20 else "B" if top["ev"] >= 1.15 else "C"
    labels = ["厚め", "本命", "押さえ"]
    picks = [dict(x, label=labels[k]) for k, x in enumerate(good[:3])]
    return dict(race_id=race_id, skip=False, confidence=rank, entropy=h, picks=picks)


def render(decision):
    """表示用テキスト。"""
    if decision["skip"]:
        return "今回はSkip\n理由:\n" + "\n".join(f"・{r}" for r in decision["reasons"])
    p = decision["picks"]
    top = p[0]
    lines = [f"自信度 {decision['confidence']}", "", "AI見解",
             f"最有力の期待値は {top['ev']:.2f}（推定確率 {top['p']:.1%} × オッズ {top['odds']}）。",
             f"混戦度（正規化エントロピー）は {decision['entropy']:.2f}。",
             "過去データの検証にもとづく推定で、的中や利益を保証するものではありません。", "", "買い目"]
    lines += [f"{x['label']} 2車単 {x['combination']}（期待値 {x['ev']:.2f}）" for x in p]
    return "\n".join(lines)


def kelly_fraction(p, o, safety=0.5):
    """f = (pO - 1) / (O - 1) に安全係数を掛けたもの（上限 0.5 倍）。負なら 0。"""
    if o <= 1:
        return 0.0
    f = (p * o - 1) / (o - 1)
    return max(0.0, f) * min(safety, 0.5)


def kelly_allowed(report):
    """Kelly を検討してよいか。満たさない間は固定100円の仮想購入だけ。"""
    checks = {
        "校正誤差が小さい": report.get("ece") is not None and report["ece"] <= DEFAULTS["max_ece"],
        "購入レース数が1000以上": report.get("purchased_races", 0) >= 1000,
        "回収率の95%信頼区間の下限が1.0超": (report.get("roi_ci95") or (0, 0))[0] > 1.0,
        "朝8時オッズ基準のバックテスト": report.get("odds_basis") == "pre_0800",
        "データリーク監査が0件": report.get("leak_count", 1) == 0,
    }
    return all(checks.values()), checks


def bootstrap_roi(race_returns, n=2000, seed=0):
    """レース単位の (投資, 払戻) を復元抽出し、回収率の95%区間を出す。"""
    if not race_returns:
        return None
    rnd = random.Random(seed)
    vals = []
    for _ in range(n):
        s = [rnd.choice(race_returns) for _ in race_returns]
        st = sum(a for a, _ in s)
        vals.append(sum(b for _, b in s) / st if st else 0)
    vals.sort()
    return vals[int(0.025 * n)], vals[int(0.975 * n) - 1]


def ruin_probability(race_returns, bankroll, n_paths=2000, horizon=None, seed=0):
    """固定額購入で、資金が尽きる（次の購入額を下回る）確率をシミュレーションで推定する。"""
    if not race_returns:
        return None
    rnd = random.Random(seed)
    horizon = horizon or len(race_returns)
    ruined = 0
    for _ in range(n_paths):
        b = bankroll
        for _ in range(horizon):
            stake, ret = rnd.choice(race_returns)
            if b < stake:
                ruined += 1
                break
            b += ret - stake
    return ruined / n_paths


def equity_curve(race_returns, bankroll):
    out, b = [], bankroll
    for stake, ret in race_returns:
        b += ret - stake
        out.append(b)
    return out
