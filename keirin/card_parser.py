"""貼り付けられた出走表テキスト（KEIRIN.JP 形式をコピーしたもの）を読み取る。
表が崩れていても、選手の行（車番・名前・競走得点・着順）を手がかりに読む。
読めない項目は空にする（推測で埋めない）。"""
import re
import unicodedata

ROW = re.compile(r"^(?:(\d)\t)?(\d)\t([^\t\d][^\t]*)\t(\d+(?:\.\d+)?)\t(\d+)-(\d+)-(\d+)-(\d+)\s*$")
STATS = re.compile(r"^([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\t(\d+)\t(\d+)\t(\d+)\t(\d+)\t(\d+)\t(\d+)\t(\d+)\t([\d.]+)\t(\S+)")
MEET = re.compile(r"^(\S)[GF]\d$")      # 例: 弥G1, 松G3, 川F1（全角は正規化してから見る）
RESULT = re.compile(r"^(\d)(?:\s+([SHB]+))?$")


def _norm(s):
    return unicodedata.normalize("NFKC", s).strip()


def parse_card(text):
    """戻り値: 選手ごとの dict のリスト（車番順）"""
    riders, cur, frame = [], None, None
    for raw in text.splitlines():
        line = raw.rstrip("\n")
        m = ROW.match(line.strip("\r"))
        if m:
            if m.group(1):
                frame = int(m.group(1))
            cur = dict(frame_no=frame, car_no=int(m.group(2)), name=m.group(3).strip(),
                       score=float(m.group(4)), record=[int(m.group(i)) for i in range(5, 9)],
                       meets=[], absences=[])
            riders.append(cur)
            continue
        if cur is None:
            continue
        m = STATS.match(line)
        if m:
            g = m.groups()
            cur.update(win_rate=float(g[0]) / 100, top2_rate=float(g[1]) / 100, top3_rate=float(g[2]) / 100,
                       nige=int(g[3]), makuri=int(g[4]), sashi=int(g[5]), mark=int(g[6]),
                       s=int(g[7]), h=int(g[8]), b=int(g[9]), gear=float(g[10]), style=g[11])
            continue
        t = _norm(line)
        if not t or t.startswith("誘導"):
            continue
        if MEET.match(t):
            cur["meets"].append(dict(meet=t, results=[]))
        elif t.endswith("欠場"):
            cur["absences"].append(dict(meet=cur["meets"][-1]["meet"] if cur["meets"] else None, reason=t))
        else:
            r = RESULT.match(t)
            if r and cur["meets"]:
                cur["meets"][-1]["results"].append(dict(order=int(r.group(1)), marks=r.group(2) or ""))
    riders.sort(key=lambda r: r["car_no"])
    return riders


def check_card(riders):
    """読み取りの監査。問題があれば文の一覧を返す。"""
    probs = []
    cars = [r["car_no"] for r in riders]
    if not riders:
        return ["選手の行を1つも読み取れなかった"]
    if cars != list(range(1, len(cars) + 1)):
        probs.append(f"車番が連番になっていない: {cars}")
    for r in riders:
        if "win_rate" not in r:
            probs.append(f"{r['car_no']}番 {r['name']}: 勝率・決まり手の行を読めなかった")
    return probs
