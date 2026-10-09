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
