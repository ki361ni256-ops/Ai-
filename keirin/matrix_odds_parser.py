"""オッズの「表（1着を1つ固定し、横＝2着・縦＝3着）」をコピーしたテキストを読む。
オッズパークの3連単オッズ表をコピーした形で確認（2026-10-09）。

- 1着（軸）の車番はテキストに書かれていないため、「全部空欄の行と列」から決める
  （軸の車番は2着にも3着にも来ないので、その行と列だけが空になる）。決められなければ None
- 「2026/10/09 14:58現在」をオッズの時点として読む（提供元が示す時刻 source_timestamp）
- ページ下の並び（ライン）も読む
"""
import re
import unicodedata

STAMP = re.compile(r"(\d{4})/(\d{2})/(\d{2})\s+(\d{1,2}):(\d{2})現在")
START = re.compile(r"発走時間\s*(\d{1,2}):(\d{2})")
STYLES = {"先行", "追込", "叩先", "自在", "逃", "両", "追", "単騎"}


def _n(s):
    return unicodedata.normalize("NFKC", s)


def parse_matrix(text):
    t = _n(text)
    out = dict(axis=None, odds={}, source_timestamp=None, race_start_hm=None, lines=[], problems=[])
    m = STAMP.search(t)
    if m:
        y, mo, d, h, mi = m.groups()
        out["source_timestamp"] = f"{y}-{mo}-{d}T{int(h):02d}:{mi}:00+09:00"
    m = START.search(t)
    if m:
        out["race_start_hm"] = f"{int(m.group(1)):02d}:{m.group(2)}"
    rows = {}
    started = False
    for raw in t.splitlines():
        if raw.startswith("3着"):
            started = True
            raw = raw[len("3着"):].lstrip("\t")
        elif not started:
            continue
        if raw.startswith("発売票数"):
            break
        f = raw.split("\t")
        if not f or not f[0].strip().isdigit():
            continue
        r = int(f[0])
        vals = [x.strip() for x in f[1:10]]
        vals += [""] * (9 - len(vals))
        rows[r] = [float(v.replace(",", "")) if v else None for v in vals]
    if len(rows) < 2:
        out["problems"].append("表を読み取れなかった")
        return out
    n = max(rows)
    empty_rows = [r for r in rows if all(v is None for v in rows[r])]
    empty_cols = [c for c in range(1, n + 1) if all(rows[r][c - 1] is None for r in rows)]
    common = sorted(set(empty_rows) & set(empty_cols))
    if len(common) != 1:
        out["problems"].append(f"1着（軸）の車番を決められなかった（空の行 {empty_rows}・空の列 {empty_cols}）")
        return out
    axis = common[0]
    out["axis"] = axis
    for third, vals in rows.items():
        for second, v in enumerate(vals, 1):
            if v is not None and len({axis, second, third}) == 3:
                out["odds"][f"{axis}-{second}-{third}"] = v
    # 並び：「←」の後ろの、車番と脚質の並び。半角スペースだけの行がラインの区切り
    if "←" in t:
        tail = t.split("←", 1)[1].splitlines()
        group, groups = [], []
        for line in tail:
            s = line.strip()
            if s == "" and line != "":
                if group:
                    groups.append(group)
                group = []
            elif s.isdigit():
                group.append(dict(car_no=int(s), style=None))
            elif s in STYLES and group:
                group[-1]["style"] = s
            elif s and not s.isdigit() and s not in STYLES:
                break
        if group:
            groups.append(group)
        out["lines"] = groups
    return out


def format_lines(groups):
    return " / ".join("-".join(str(x["car_no"]) for x in g) for g in groups)
