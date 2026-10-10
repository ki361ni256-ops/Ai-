"""下書き動画（音なし）を作る：python3 make_video.py
04_演出.md の 2章（長尺）・4章（ショート）のカット表を上から順に読み、L001〜・S01〜 と番号を付けて
images/long・images/short の静止画をその時間どおりに並べる。最後のカットの終わりはチャプター表の終わり（長尺 13:30、ショート 1:00）。
ナレーション・BGM・動きは入っていない。編集ソフトに読み込む「並べ済みの下書き」として使う。
"""
import re, subprocess, pathlib

HERE = pathlib.Path(__file__).parent
SPEC = HERE.parent / "04_演出.md"
OUT = HERE / "video"
OUT.mkdir(exist_ok=True)
END = {"L": 13 * 60 + 30, "S": 60}


def sec(t):
    m, s = t.split(":")
    return int(m) * 60 + int(s)


starts = {"L": [], "S": []}
kind = None
for line in SPEC.read_text().splitlines():
    if line.startswith("## "):
        kind = "L" if line.startswith("## 2.") else "S" if line.startswith("## 4.") else None
        continue
    m = re.match(r"\| (\d+:\d\d) \|", line)
    if kind and m:
        starts[kind].append(sec(m.group(1)))

cuts = {}
for k, ss in starts.items():
    w = 3 if k == "L" else 2
    cuts[k] = [(f"{k}{i + 1:0{w}d}", a, (ss[i + 1] if i + 1 < len(ss) else END[k])) for i, a in enumerate(ss)]

CHAPTER = {"L014", "L027", "L048", "L078", "L089"}  # 先頭 2.5 秒は章タイトル（…a.png）
SPLIT = {"L004": [("L004", 3), ("L004b", None)]}    # 0:28 でタイトル


def seq(k):
    items = []
    for cid, a, b in cuts[k]:
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


def build(k, folder, size, name):
    items = seq(k)
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
    print(f"{mp4.name}: {len(cuts[k])} カット（画像 {len(items)} 枚） / {int(total // 60)}分{int(total % 60):02d}秒")


build("L", "long", "1920:1080", "かごめかごめ_長尺_下書き")
build("S", "short", "1080:1920", "かごめかごめ_ショート_下書き")
