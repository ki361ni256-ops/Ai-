"""下書き動画（音なし）を作る：python3 make_video.py
04_演出.md のカット表（3章＝長尺、4章＝ショート）の時間どおりに images/long・images/short の静止画を並べる。
この回のカット表には ID の列がないので、表の行を上から順に L01〜L50・S01〜S07 と数える。
ナレーション・BGM・動きは入っていない。編集ソフトに読み込む「並べ済みの下書き」として使う。
"""
import re, subprocess, pathlib

HERE = pathlib.Path(__file__).parent
SPEC = HERE.parent / "04_演出.md"
OUT = HERE / "video"
OUT.mkdir(exist_ok=True)

def sec(t):
    m, s = t.split(":")
    return int(m) * 60 + int(s)

text = SPEC.read_text()
sections = {"L": text.split("## 3.")[1].split("## 4.")[0], "S": text.split("## 4.")[1].split("## 5.")[0]}
cuts = {}
for k, body in sections.items():
    rows = re.findall(r"^\| (\d+:\d\d)〜(\d+:\d\d) \|", body, re.M)
    cuts[k] = [(f"{k}{i + 1:02d}", sec(a), sec(b)) for i, (a, b) in enumerate(rows)]
assert len(cuts["L"]) == 50 and len(cuts["S"]) == 7, (len(cuts["L"]), len(cuts["S"]))

CHAPTER = {"L07", "L14", "L25", "L35"}  # 先頭 2.5 秒は章タイトル（…a.png）
# 1行の中で画が変わるカット（演出書の「→ 0:00 頃」の切り替え）。None は残り全部
SPLIT = {
    "L02": [("L02", 7), ("L02b", None)], "L03": [("L03", 10), ("L03b", 6), ("L03c", None)],
    "L06": [("L06", 13), ("L06b", None)], "L09": [("L09", 10), ("L09b", None)], "L11": [("L11", 10), ("L11b", None)],
    "L13": [("L13", 9), ("L13b", None)], "L15": [("L15", 12), ("L15b", None)], "L22": [("L22", 8), ("L22b", None)],
    "L24": [("L24", 10), ("L24b", None)], "L28": [("L28", 13), ("L28b", None)], "L30": [("L30", 7), ("L30b", None)],
    "L31": [("L31", 10), ("L31b", None)], "L36": [("L36", 12), ("L36b", None)], "L37": [("L37", 7), ("L37b", None)],
    "L40": [("L40", 12), ("L40b", None)], "L43": [("L43", 6), ("L43b", 6), ("L43c", 6), ("L43d", None)],
    "L44": [("L44", 10), ("L44b", None)], "L45": [("L45", 7), ("L45b", 8), ("L45c", 6), ("L45d", None)],
    "L46": [("L46", 10), ("L46b", 6), ("L46c", None)], "L49": [("L49", 8), ("L49b", 10), ("L49c", None)],
    "S02": [("S02", 6), ("S02b", None)], "S03": [("S03a", 4), ("S03b", 4), ("S03c", None)],
    "S05": [("S05", 2), ("S05b", 2), ("S05c", None)], "S06": [("S06", 5), ("S06b", None)],
    "S07": [("S07", 5), ("S07b", 3), ("S07c", None)],
}

def seq(kind):
    items = []
    for cid, a, b in cuts[kind]:
        dur = b - a
        if cid in CHAPTER:
            items += [(f"{cid}a", 2.5), (cid, dur - 2.5)]
        elif cid in SPLIT:
            rest = dur
            for name, d in SPLIT[cid]:
                d = rest if d is None else d
                items.append((name, d)); rest -= d
            assert rest == 0, cid
        else:
            items.append((cid, dur))
    return items

def build(kind, folder, size, name):
    items = seq(kind)
    lst = OUT / f"{name}.txt"
    with lst.open("w") as f:
        for img, d in items:
            p = HERE / folder / f"{img}.png"
            assert p.exists(), p
            f.write(f"file '{p}'\nduration {d}\n")
        f.write(f"file '{HERE / folder / (items[-1][0] + '.png')}'\n")
    mp4 = OUT / f"{name}.mp4"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                    "-vf", f"scale={size},fps=24,format=yuv420p", "-c:v", "libx264", "-crf", "26", "-preset", "veryfast", str(mp4)], check=True)
    total = sum(d for _, d in items)
    print(f"{mp4.name}: {len(items)} カット / {int(total // 60)}分{int(total % 60):02d}秒")

build("L", "long", "1920:1080", "八尺様_長尺_下書き")
build("S", "short", "1080:1920", "八尺様_ショート_下書き")
