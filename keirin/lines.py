"""並び（ライン）から、選手ごとのライン情報を作る。
入力は matrix_odds_parser.parse_matrix() の lines（[[{car_no, style}, ...], ...]）か、
「7-3-1 / 4 / 5-2-6」のような文字列。並びは予想紙などの「予想の並び」で、実際のレースの並びとは違うことがある。"""


def parse_lines_text(s):
    return [[dict(car_no=int(x), style=None) for x in g.strip().split("-") if x.strip()]
            for g in s.split("/") if g.strip()]


def line_features(groups):
    """戻り値: {car_no: dict(line_no, line_position, line_size, line_head, is_single, style)}"""
    if isinstance(groups, str):
        groups = parse_lines_text(groups)
    out = {}
    for k, g in enumerate(groups, 1):
        for pos, r in enumerate(g, 1):
            out[r["car_no"]] = dict(line_no=k, line_position=pos, line_size=len(g),
                                    line_head=g[0]["car_no"], is_single=len(g) == 1, style=r.get("style"))
    return out
