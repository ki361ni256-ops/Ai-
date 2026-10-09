"""投稿前チェック（チェック担当が毎回使う）。問題のリストを返す。空なら合格。"""
import re

from .yosou import BANNED_WORDS, _expand_sets

X_LIMIT = 280  # X の文字数上限（重み付き。日本語・絵文字は1文字2、英数字は1）


def x_weighted_length(text):
    n = 0
    for ch in text:
        cp = ord(ch)
        light = cp <= 0x10FF or 0x2000 <= cp <= 0x200D or 0x2010 <= cp <= 0x201F or 0x2032 <= cp <= 0x2037
        n += 1 if light else 2
    return n


def expand_notation(s):
    """'4-13-357 / 1-4-3' を展開する。"""
    out = []
    for m in re.finditer(r"(\d+)-(\d+)-(\d+)", s):
        a, b, c = ({int(ch) for ch in x} for x in m.groups())
        out += sorted(_expand_sets(a, b, c))
    return out


def check_post(text, formation=None, lines_known=False, created_at=None, deadline=None):
    probs = []
    for w in BANNED_WORDS:
        if w in text:
            probs.append(f"使わない言葉「{w}」がある")
    n = x_weighted_length(text)
    if n > X_LIMIT:
        probs.append(f"Xの文字数オーバー（{n}/{X_LIMIT}。日本語は1文字2で数える）")
    tiers = re.findall(r"^(厚め|本線|押さえ)\s+(.+)$", text, flags=re.M)
    names = [t for t, _ in tiers]
    if names != ["厚め", "本線", "押さえ"]:
        probs.append(f"買い目の区分が「厚め・本線・押さえ」の3つになっていない（{names}）")
    extra = [l for l in text.splitlines() if re.match(r"^【", l)]
    if extra:
        probs.append(f"3区分以外の買い目の見出しがある（{extra}）")
    seen = []
    for t, s in tiers:
        got = expand_notation(s)
        seen += got
        if formation is not None and sorted(got) != sorted(formation.get(t, [])):
            probs.append(f"{t} の表記と記録した買い目が一致しない")
    if len(seen) != len(set(seen)):
        probs.append("同じ組合せが複数の区分に入っている（重複買い）")
    if "並び" in text and not lines_known:
        probs.append("並びが確認できていないのに展開・並びを書いている")
    if created_at and deadline and created_at >= deadline:
        probs.append("締切後に作った予想になっている")
    return probs
