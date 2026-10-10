"""下書き動画（音なし）を作る：python3 make_video.py
04_演出.md のカット表の時間どおりに images/long・images/short の静止画を並べる。
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

cuts = {"L": [], "S": []}
for line in SPEC.read_text().splitlines():
    m = re.match(r"\| ([LS])(\d+) \| ([\d:]+)〜([\d:]+) \|", line)
    if m:
        k, n, a, b = m.groups()
        cuts[k].append((f"{k}{int(n):02d}", sec(a), sec(b)))

CHAPTER = {"L14", "L24", "L39", "L48", "L59", "L68"}  # 先頭 2.5 秒は章タイトル（…a.png）
SPLIT = {"L11": [("L11", 8), ("L11b", None)], "S05": [("S05a", 3), ("S05b", 3), ("S05c", None)]}

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

build("L", "long", "1920:1080", "きさらぎ駅_長尺_下書き")
build("S", "short", "1080:1920", "きさらぎ駅_ショート_下書き")
