"""出走表から読む予想（ルール方式）。AIモデル（keirin/model.py）とは別物で、実データでの検証が済むまでの運用用。
ルールはバージョン管理し、変更は「予想記録の振り返り」で効果を確かめてから行う（品質改善ループ.md）。"""
import itertools
import math

RULES = {
    "v1": dict(
        # 強さ = 競走得点。前場所を病気・負傷で欠場した選手だけ少し割り引く（家事都合などは割り引かない）
        absence_penalty={"病気欠場": 1.0, "負傷欠場": 1.0},
        # 3連単の確率の目安（Plackett-Luce）。未校正なので購入判断には使わない
        pl_temperature=0.25,
    ),
}
RULES["v2"] = dict(
    RULES["v1"],
    # 並び（ライン）の位置で強さを足し引きする。値は 2026-10-09 時点の仮置き（記録がたまったら比べて見直す）
    line_bonus=dict(bante=1.5, head_of_3plus=0.5, single=-1.0),
    needs_lines=True,
)
CURRENT = "v1"

# X に書かない言葉（根拠なく断定する・オッズを見ずに荒れ／堅いを言う）
BANNED_WORDS = ["必ず", "絶対", "確実", "鉄板", "勝てる", "儲かる", "波乱", "荒れる", "堅い", "妙味", "AI予想"]


def strength(r, rule):
    pen = sum(rule["absence_penalty"].get(a["reason"], 0) for a in r.get("absences", []))
    bonus = 0.0
    lb, ln = rule.get("line_bonus"), r.get("line")
    if lb and ln:
        if ln["is_single"]:
            bonus += lb["single"]
        elif ln["line_position"] == 2:
            bonus += lb["bante"]
        elif ln["line_position"] == 1 and ln["line_size"] >= 3:
            bonus += lb["head_of_3plus"]
    return r["score"] - pen + bonus


def rank(riders, version=CURRENT, lines=None):
    """lines: keirin.lines.line_features() の結果。v2 では必須。"""
    rule = RULES[version]
    if rule.get("needs_lines"):
        if not lines:
            raise ValueError(f"ルール {version} には並び（ライン）が必要")
        riders = [dict(r, line=lines.get(r["car_no"])) for r in riders]
    return sorted(riders, key=lambda r: (-strength(r, rule), -r.get("top3_rate", 0), r["car_no"]))


def marks(ranked):
    sym = ["◎", "○", "▲", "△", "△"]
    return [(sym[k], r) for k, r in enumerate(ranked[:5])]


def _expand(first, second, third):
    out = []
    for a in first:
        for b in second:
            for c in third:
                if len({a, b, c}) == 3:
                    out.append(f"{a}-{b}-{c}")
    return out


def formation(ranked):
    """厚め・本線・押さえ。重複は上の区分を優先して除く。"""
    c = [r["car_no"] for r in ranked[:5]]
    a, b, s, d1, d2 = (c + [None] * 5)[:5]
    atsume = [f"{a}-{b}-{s}"]
    honsen = [x for x in _expand([a], [b, s], [b, s, d1, d2]) if x not in atsume]
    osae = [x for x in _expand([b], [a], [s, d1]) + _expand([s], [a], [b]) if x not in atsume + honsen]
    return dict(厚め=atsume, 本線=honsen, 押さえ=osae)


def pl_probs(ranked, version=CURRENT):
    """3連単の確率の目安（未校正）。"""
    rule = RULES[version]
    w = {r["car_no"]: math.exp(rule["pl_temperature"] * strength(r, rule)) for r in ranked}
    tot = sum(w.values())
    out = {}
    for a, b, c in itertools.permutations(w, 3):
        out[f"{a}-{b}-{c}"] = w[a] / tot * w[b] / (tot - w[a]) * w[c] / (tot - w[a] - w[b])
    return out


def odds_view(form, odds):
    """買い目ごとのオッズと人気順。オッズがなければ空。"""
    if not odds:
        return {}
    pop = {c: k for k, c in enumerate(sorted(odds, key=odds.get), 1)}
    return {c: (odds.get(c), pop.get(c)) for t in form.values() for c in t}


def _fmt(a, b, c):
    j = lambda xs: "".join(map(str, sorted(xs)))  # noqa: E731
    return f"{j(a)}-{j(b)}-{j(c)}"


def _expand_sets(a, b, c):
    return {f"{x}-{y}-{z}" for x in a for y in b for z in c if len({x, y, z}) == 3}


def compress(combos):
    """買い目をフォーメーション表記にまとめる（例: 1-2-5 と 1-5-2 → 1-25-25）。
    まとめた結果を展開して、元の買い目と完全に一致するときだけまとめる（点数が変わらない）。"""
    combos = list(dict.fromkeys(combos))
    want = set(combos)
    parts = []
    by_first = {}
    for c in combos:
        a, b, d = (int(x) for x in c.split("-"))
        by_first.setdefault(a, []).append((b, d))
    for a, pairs in by_first.items():
        s2, s3 = {b for b, _ in pairs}, {d for _, d in pairs}
        mine = {f"{a}-{b}-{d}" for b, d in pairs}
        if _expand_sets({a}, s2, s3) == mine:
            parts.append(({a}, s2, s3))
            continue
        by_second = {}
        for b, d in pairs:
            by_second.setdefault(b, set()).add(d)
        groups = []
        for b, ds in by_second.items():
            for g in groups:
                if g[2] == ds and _expand_sets({a}, g[1] | {b}, ds) == {f"{a}-{y}-{z}" for y in g[1] | {b} for z in ds if len({a, y, z}) == 3} and all(
                        f"{a}-{y}-{z}" in mine for y in g[1] | {b} for z in ds if len({a, y, z}) == 3):
                    g[1].add(b)
                    break
            else:
                groups.append(({a}, {b}, set(ds)))
        parts += groups
    # 2つのまとまりを合わせても、展開した買い目が2つの和とちょうど同じならまとめる（重複買いを作らない）
    merged = [tuple(set(x) for x in p) for p in parts]
    changed = True
    while changed:
        changed = False
        for i in range(len(merged)):
            for j in range(i + 1, len(merged)):
                p, q = merged[i], merged[j]
                cand = (p[0] | q[0], p[1] | q[1], p[2] | q[2])
                ep, eq = _expand_sets(*p), _expand_sets(*q)
                if not (ep & eq) and _expand_sets(*cand) == ep | eq:
                    merged[i] = cand
                    del merged[j]
                    changed = True
                    break
            if changed:
                break
    assert set().union(*[_expand_sets(*m) for m in merged]) == want if merged else True
    return " / ".join(_fmt(*m) for m in merged)


def render_x(venue, race_no, ranked, form, odds=None, tenkai=None):
    m = marks(ranked)
    lines = [f"🚴 {venue}競輪 {race_no}R 3連単 無料予想", ""]
    if tenkai:
        lines += [tenkai, ""]
    lines += [f"{s}{r['car_no']} {r['name']}" for s, r in m[:3]]
    lines.append("△" + " △".join(f"{r['car_no']} {r['name']}" for _, r in m[3:]))
    lines += ["", f"厚め {compress(form['厚め'])}", f"本線 {compress(form['本線'])}", f"押さえ {compress(form['押さえ'])}"]
    ov = odds_view(form, odds)
    if ov:
        low = [c for c, (o, p) in ov.items() if o is not None and o < 10]
        if low:
            lines.append(f"（10倍未満の組合せ: {', '.join(low)}）")
    return "\n".join(lines)


def audit_text(text):
    """X 投稿文の監査。問題点のリスト（空なら合格）。"""
    # 注意書きは 2026-10-09 本人の指示で入れない（代わりに展開を書く）
    return [f"使わない言葉「{w}」が入っている" for w in BANNED_WORDS if w in text]
