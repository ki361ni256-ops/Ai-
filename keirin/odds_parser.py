"""貼り付けられた3連単オッズのテキストを読む。
「1-2-3 12.5」「1→2→3 12.5倍」「1 2 3 12.5」など、組合せの後ろにオッズがある行を拾う。
提供元の正式な形式は、実際に貼ってもらったもので確認して調整する。"""
import re
import unicodedata

LINE = re.compile(r"(?<!\d)([1-9])\s*[-→ー－>=]\s*([1-9])\s*[-→ー－>=]\s*([1-9])(?!\d)\s*[^\d\n]*?(\d+(?:\.\d+)?)")


def parse_trifecta(text):
    out = {}
    for raw in text.splitlines():
        t = unicodedata.normalize("NFKC", raw).replace(",", "")
        m = LINE.search(t)
        if m:
            a, b, c, o = m.groups()
            if len({a, b, c}) == 3:
                out[f"{a}-{b}-{c}"] = float(o)
    return out


def diagnose(text):
    """組合せが読めなかったときの理由。数字だけ（人気順とオッズ）で組合せがないなら、その旨を返す。"""
    if parse_trifecta(text):
        return None
    nums = re.findall(r"\d+\.\d", unicodedata.normalize("NFKC", text))
    if nums:
        return (f"オッズの数値（{len(nums)}個）はあるが、組合せ（例 1-2-3）が入っていない。"
                "組合せが画像や色付きの枠で表示されていて、コピーで抜けている可能性がある")
    return "オッズを読み取れなかった"
