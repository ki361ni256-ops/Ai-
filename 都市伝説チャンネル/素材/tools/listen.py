"""聞かせる型の動画を作る（背景イラスト＋章タイトル＋字幕＋ナレーション＋BGM）。
録音の当てはめ・言い直しの削除・雑音処理は narrate.py と同じ。字幕は台本の文を「。」で区切り、声の長さに合わせて出す。
"""
import re, json, subprocess, pathlib
from narrate import script_lines, align, rebuild_audio, replacement, drop_retakes
from sound import mix_track

HERE = pathlib.Path(__file__).parent
SKIP = r"公開前|原文確認|申し送り|修正履歴|チャプター|前提"

def line_sections(md):
    """台本の各ナレーション行が、どの見出し（章）に属するか"""
    out, cur, intable = [], "", False
    for l in pathlib.Path(md).read_text().splitlines():
        h = re.match(r"#{2,3} (.+)", l)
        if h:
            intable = False
            if not re.search(SKIP, h.group(1)): cur = h.group(1)
            continue
        if l.startswith("| 時間 | ナレーション"): intable = True; continue
        if intable and l.startswith("|---"): continue
        if intable and l.startswith("|"):
            c = [x.strip() for x in l.strip("|").split("|")]
            if len(c) >= 2 and c[1] and c[1] not in ("—", "―", "（無音）") and not re.fullmatch(r"（[^）]*なし[^）]*）", c[1]) and re.match(r"\d+:\d\d", c[0]):
                out.append(cur)
        elif intable and not l.strip(): intable = False
    return out

def clean_title(t):
    if re.fullmatch(r"(台本|本編|ナレーション)", t.strip()): return ""   # 見出しが「台本」だけのときは章名を出さない
    t = re.sub(r"（\d+:\d\d〜\d+:\d\d）", "", t)        # 時間の表記を外す
    t = re.sub(r"^\d+:\d\d\s*", "", t)
    return t.strip()

def split_sub(text, maxlen=46):
    """字幕用に文を区切る（「。」で区切り、長すぎれば「、」でも区切る）"""
    parts = [p for p in re.split(r"(?<=[。？！])", text) if p.strip()]
    out = []
    for p in parts:
        while len(p) > maxlen:
            cut = max((m.end() for m in re.finditer("、", p[:maxlen])), default=maxlen)
            out.append(p[:cut]); p = p[cut:]
        if p.strip(): out.append(p)
    return out

def build(ep, kind, md, audio, fixes, track, name, bg_for, size=(1920, 1080), first_title=None):
    ep = pathlib.Path(ep)
    lines = script_lines(ep / md); secs = line_sections(ep / md)
    res = align(ep / "audio" / audio, lines)
    extra = []
    for fn, nos in fixes.items():
        extra.append(ep / "audio" / fn)
        for n, rep in replacement(ep / "audio" / fn, nos, len(extra)).items():
            res[n - 1].update(rep, speech=sum(b - a for a, b in rep["chunks"]), inner_max=0.0, fixed=fn)
    drop_retakes(res)
    wav = ep / "audio" / f"{name}_ナレーション.wav"
    starts, real_end = rebuild_audio(ep / "audio" / audio, res, lines, wav, extra)
    final = ep / "audio" / f"{name}_完成音声.wav"
    mix_track(wav, final, track, [], lambda s: s)
    # 画面の並び
    outdir = ep / "listen" / name; outdir.mkdir(parents=True, exist_ok=True)
    for old in outdir.glob("*.png"): old.unlink()
    items, seq = [], []
    def add(dur, **kw):
        k = len(items); p = outdir / f"{k:04d}.png"
        items.append(dict(out=str(p), **kw)); seq.append((p, dur))
    t = 0.0
    if first_title:
        add(max(starts[0], 0.1), title=first_title, bg=bg_for(secs[0]))
        t = starts[0]
    for i, (st, x, new) in enumerate(lines):
        end = starts[i + 1] if i + 1 < len(lines) else real_end
        chap = clean_title(secs[i]); bg = bg_for(secs[i])
        if starts[i] > t + 0.05:  # 前の行との隙間（無音）は直前の画面を伸ばす
            p, d = seq[-1] if seq else (None, 0)
            if seq: seq[-1] = (p, d + starts[i] - t)
        subs = split_sub(x); total = sum(len(s) for s in subs)
        for s in subs:
            add((end - starts[i]) * len(s) / total, text=s, chapter=chap, bg=bg)
        t = end
    w, h = size
    job = outdir / "jobs.json"; job.write_text(json.dumps(dict(w=w, h=h, items=items), ensure_ascii=False))
    subprocess.run(["node", str(HERE / "listen_frames.mjs"), str(job)], check=True, stdout=subprocess.DEVNULL)
    lst = outdir / "list.txt"
    with lst.open("w") as f:
        for p, d in seq: f.write(f"file '{p}'\nduration {max(d, 0.05):.3f}\n")
        f.write(f"file '{seq[-1][0]}'\n")
    mp4 = ep / "listen" / f"{name}_聞かせる版.mp4"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-i", str(final),
                    "-vf", f"scale={w}:{h},fps=24,format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "veryfast", "-tune", "stillimage",
                    "-c:a", "aac", "-b:a", "160k", "-shortest", str(mp4)], check=True)
    m, s = divmod(real_end, 60)
    print(f"{mp4.name}: {len(lines)}行・字幕{len(seq)}枚 → {int(m)}分{int(s):02d}秒")
    return mp4
