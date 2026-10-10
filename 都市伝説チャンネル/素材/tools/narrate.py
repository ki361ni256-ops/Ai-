"""本人のナレーション録音に合わせて、画像の切り替えを合わせた動画を作る共通処理。

やること
1. 録音の無音部分を探し、台本の行（収録台本の番号）ごとの声の区間を推定する
   （音声認識は使えない環境なので、「無音の長さ」と「行の文字数から見込む長さ」で当てはめる）
2. 行と行のあいだの長い間を詰めて、ナレーション音声を作り直す（行間 GAP 秒）
3. 台本の時間 → 実際の声の時間 に対応づけて、各カットの表示時間を決め直す
4. 画像＋ナレーションの動画（mp4）を書き出す。当てはめ結果の一覧（どの行が何秒か）も出す
"""
import re, subprocess, json, pathlib, unicodedata

GAP = 0.5          # 行と行のあいだの間（秒）
CHAPTER_GAP = 1.0  # 章の変わり目の間（秒）

def sec(t):
    m, s = re.match(r"(\d+):(\d\d)", t.strip()).groups(); return int(m) * 60 + int(s)   # 「6:05〜6:25」のような範囲は頭の時刻

def script_lines(md):
    """03_台本_*.md のナレーション行を [(台本上の秒, 本文, 章の頭か)] で返す（収録台本と同じ順番）"""
    out, intable, newsec = [], False, True
    for l in pathlib.Path(md).read_text().splitlines():
        h = re.match(r"#{2,3} (.+)", l)
        if h:
            intable = False
            if not re.search(r"公開前|原文確認|申し送り|修正履歴|チャプター|前提", h.group(1)): newsec = True
            continue
        if l.startswith("| 時間 | ナレーション"): intable = True; continue
        if intable and l.startswith("|---"): continue
        if intable and l.startswith("|"):
            c = [x.strip() for x in l.strip("|").split("|")]
            if len(c) >= 2 and c[1] and c[1] not in ("—", "―", "（無音）") and not re.fullmatch(r"（[^）]*なし[^）]*）", c[1]) and re.match(r"\d+:\d\d", c[0]):
                out.append((sec(c[0]), c[1].replace("**", ""), newsec)); newsec = False
        elif intable and not l.strip(): intable = False
    return out

def weight(text):
    """読み上げにかかる長さの目安（文字数。数字は少し重く、記号は数えない）"""
    w = 0.0
    for ch in text:
        cat = unicodedata.category(ch)
        if ch.isdigit(): w += 1.6
        elif cat.startswith("P") or cat.startswith("Z") or ch in "「」『』（）・―…→": continue
        else: w += 1.0
    return max(w, 2.0)

def silences(audio, noise=-35, d=0.25):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(audio), "-af", f"silencedetect=noise={noise}dB:d={d}", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(audio)], capture_output=True, text=True).stdout)
    if len(en) < len(st): en.append(dur)
    return list(zip(st, en)), dur

def align(audio, lines, min_boundary=0.7):
    """行ごとの声の区間 [(開始, 終了)] を推定する（動的計画法）"""
    sil, total = silences(audio)
    # 声のかたまり（無音と無音のあいだ）
    chunks, t = [], 0.0
    for s, e in sil:
        if s - t > 0.05: chunks.append([t, s])
        t = e
    if total - t > 0.05: chunks.append([t, total])
    # 区切り候補：かたまりのあいだの無音の長さ
    gaps = [chunks[i + 1][0] - chunks[i][1] for i in range(len(chunks) - 1)]
    n, L = len(chunks), len(lines)
    speech = sum(b - a for a, b in chunks)
    W = [weight(x[1]) for x in lines]
    rate = speech / sum(W)
    exp = [w * rate for w in W]
    INF = float("inf")
    # dp[i][j]: 先頭 i 行を、先頭 j かたまりで作ったときの最小コスト
    import math
    dp = [[INF] * (n + 1) for _ in range(L + 1)]; bk = [[0] * (n + 1) for _ in range(L + 1)]
    dp[0][0] = 0.0
    pre = [0.0]
    for a, b in chunks: pre.append(pre[-1] + (b - a))
    for i in range(1, L + 1):
        for j in range(i, n + 1):
            best, arg = INF, 0
            for k in range(i - 1, j):
                if dp[i - 1][k] == INF: continue
                if k > 0 and k < n and gaps[k - 1] < min_boundary and not (i - 1 == 0): continue
                d = pre[j] - pre[k]
                c = (math.log((d + 0.3) / (exp[i - 1] + 0.3))) ** 2 * 4
                if k > 0: c -= min(gaps[k - 1], 4.0) * 0.6   # 長い無音で区切るほど良い
                v = dp[i - 1][k] + c
                if v < best: best, arg = v, k
            dp[i][j], bk[i][j] = best, arg
    # 末尾は全部使う
    segs, j = [], n
    for i in range(L, 0, -1):
        k = bk[i][j]; segs.append((k, j)); j = k
    segs.reverse()
    res = []
    for i, (k, j) in enumerate(segs):
        part = chunks[k:j]
        inner = [part[m + 1][0] - part[m][1] for m in range(len(part) - 1)]
        res.append(dict(no=i + 1, start=part[0][0], end=part[-1][1], speech=pre[j] - pre[k], expected=exp[i], chunks=part, inner_max=max(inner) if inner else 0.0))
    return res

DENOISE = "highpass=f=100:poles=2,highpass=f=100:poles=2,afftdn=nr=12:nf=-55:tn=1,agate=threshold=0.008:ratio=3:range=0.2:attack=10:release=200,lowpass=f=12000"   # 低い唸り（話している間のゴーッという音）を強めに切り、言葉の合間の部屋の音を下げる

def denoise(src):
    """録音全体の雑音を抑えた wav を作る（同じ名前の _雑音除去.wav があれば使い回す）"""
    src = pathlib.Path(src); out = src.with_name(src.stem + "_雑音除去.wav")
    if not out.exists() or out.stat().st_mtime < src.stat().st_mtime:
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-af", DENOISE, "-ac", "1", "-ar", "48000", str(out)], check=True)
    return out

INNER_MAX = 1.2   # 行の途中の間がこれより長ければ INNER_GAP 秒に詰める（言いよどみ・言い直しの間）
INNER_GAP = 0.45

def rebuild_audio(audio, res, lines, out_wav, extra=()):
    """extra: 差し替え用の録音ファイルの一覧。res の要素に src=1,2… があればその録音から切り出す"""
    """行のあいだの間（と行の途中の長すぎる間）を詰めたナレーション音声を作り、各行の新しい開始時刻を返す"""
    pieces, starts, t = [], [], 0.0   # pieces: (種類, 値) 種類 'gap'=秒 / 'seg'=(a,b)
    for i, r in enumerate(res):
        g = 0.25 if i == 0 else (CHAPTER_GAP if lines[i][2] else GAP)
        pieces.append(("gap", g)); t += g
        starts.append(t)
        # 行の中を、長い間で分ける
        groups, cur = [], [r["chunks"][0]]
        for c in r["chunks"][1:]:
            if c[0] - cur[-1][1] > INNER_MAX: groups.append(cur); cur = [c]
            else: cur.append(c)
        groups.append(cur)
        for gi, gr in enumerate(groups):
            if gi: pieces.append(("gap", INNER_GAP)); t += INNER_GAP
            a, b = max(gr[0][0] - 0.06, 0), gr[-1][1] + 0.12
            pieces.append(("seg", (a, b, r.get("src", 0)))); t += b - a
    filt, labels = [], []
    for k, (kind, v) in enumerate(pieces):
        if kind == "gap": filt.append(f"anullsrc=r=48000:cl=mono,atrim=0:{v}[p{k}]")
        else: filt.append(f"[{v[2]}:a]atrim={v[0]:.3f}:{v[1]:.3f},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=mono[p{k}]")
        labels.append(f"[p{k}]")
    fc = ";".join(filt) + ";" + "".join(labels) + f"concat=n={len(labels)}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11[out]"
    script = pathlib.Path(out_wav).with_suffix(".filter.txt"); script.write_text(fc)
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *sum([["-i", str(denoise(x))] for x in [audio, *extra]], []), "-filter_complex_script", str(script), "-map", "[out]", "-ar", "48000", "-ac", "1", str(out_wav)], check=True)
    script.unlink()
    return starts, t + 1.2

def warp(lines, starts, script_end, real_end):
    """台本の時間 → 新しい音声の時間（行の頭どうしを結ぶ折れ線）"""
    xs = [l[0] for l in lines] + [script_end]; ys = list(starts) + [real_end]
    def f(s):
        if s <= xs[0]: return ys[0] * (s / xs[0]) if xs[0] else 0.0
        for i in range(len(xs) - 1):
            if xs[i] <= s <= xs[i + 1]:
                if xs[i + 1] == xs[i]: return ys[i]
                return ys[i] + (ys[i + 1] - ys[i]) * (s - xs[i]) / (xs[i + 1] - xs[i])
        return ys[-1]
    return f

def render(items, folder, size, wav, out_mp4, f):
    """items: [(画像名, 台本上の開始秒, 台本上の長さ)] を新しい時間に直して書き出す"""
    lst = pathlib.Path(out_mp4).with_suffix(".txt")
    rows = []
    with lst.open("w") as fh:
        for img, s, d in items:
            a, b = f(s), f(s + d)
            dur = max(b - a, 0.3)
            rows.append((img, round(a, 2), round(dur, 2)))
            fh.write(f"file '{pathlib.Path(folder) / (img + '.png')}'\nduration {dur:.3f}\n")
        fh.write(f"file '{pathlib.Path(folder) / (items[-1][0] + '.png')}'\n")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-i", str(wav),
                    "-vf", f"scale={size},fps=24,format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "veryfast", "-c:a", "aac", "-b:a", "160k", "-shortest", str(out_mp4)], check=True)
    lst.unlink()
    return rows


def replacement(audio, lines_nos, src):
    """差し替え用の録音を、長い間（1.5秒以上）で区切って lines_nos の順に割り当てる"""
    sil, total = silences(audio)
    chunks, t = [], 0.0
    for s, e in sil:
        if s - t > 0.05: chunks.append([t, s])
        t = e
    if total - t > 0.05: chunks.append([t, total])
    groups, cur = [], [chunks[0]]
    for c in chunks[1:]:
        if c[0] - cur[-1][1] >= 1.5: groups.append(cur); cur = [c]
        else: cur.append(c)
    groups.append(cur)
    if len(groups) != len(lines_nos):
        raise SystemExit(f"差し替え録音の区切りが {len(groups)} 個で、指定の行数 {len(lines_nos)} と合いません")
    return {n: dict(chunks=g, start=g[0][0], end=g[-1][1], src=src) for n, g in zip(lines_nos, groups)}


RETAKE_GAP = 1.5   # 行の中でこれ以上の間があれば「言い直し」の区切りの候補

def drop_retakes(res, gap=RETAKE_GAP):
    """言い直し（間をあけて行の頭から読み直し）の、前の言いかけを捨てる。
    行の中を長い間で分け、後ろだけ残したほうが見込みの長さにはっきり近づく場合だけ、前を捨てる。捨てた行の一覧を返す"""
    import math
    dropped = []
    for r in res:
        if r.get("fixed"): continue
        ch = r["chunks"]
        cuts = [i + 1 for i in range(len(ch) - 1) if ch[i + 1][0] - ch[i][1] >= gap]
        if not cuts: continue
        e = r["expected"]
        score = lambda part: abs(math.log((sum(b - a for a, b in part) + 0.3) / (e + 0.3)))
        best, keep = score(ch), (0, len(ch))
        for c in cuts:
            for rng in [(c, len(ch))]:   # 後ろだけ残す（読み直しは行の頭から、の決まり）
                part = ch[rng[0]:rng[1]]
                sc = score(part)
                if sc < best - 0.2 and 0.65 <= (sum(b - a for a, b in part) / e) <= 1.45:
                    best, keep = sc, rng
        if keep != (0, len(ch)):
            lost = ch[:keep[0]] + ch[keep[1]:]
            r["chunks"] = ch[keep[0]:keep[1]]
            r["start"], r["end"] = r["chunks"][0][0], r["chunks"][-1][1]
            r["speech"] = sum(b - a for a, b in r["chunks"])
            r["dropped"] = round(sum(b - a for a, b in lost), 1)
            r["dropped_where"] = "前" if keep[0] > 0 else "後ろ"
            dropped.append(r["no"])
    return dropped
