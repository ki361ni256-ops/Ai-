"""本人のナレーション録音に合わせた動画を作る：python3 make_narrated.py
入力：../audio/長尺_収録.m4a・../audio/ショート_収録.m4a（収録台本の番号順に読んだもの）
出力：video/きさらぎ駅_長尺_ナレーション入り.mp4 ほか、../audio/当てはめ結果_*.md（行ごとの時刻。言い直しの疑いも表示）
"""
import sys, pathlib
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parents[2] / "素材" / "tools"))
from narrate import script_lines, align, rebuild_audio, warp, render, replacement, drop_retakes
from make_video import seq, cuts
from sound import mix, mix_track
TRACK = HERE.parents[2] / "素材" / "bgm" / "Whole_Tone_Limbo_-_Godmode.mp3"   # 本人が選んだ曲（YouTube オーディオライブラリ）。None なら自作BGM

EP = HERE.parent
def T(m): a, b = m.split(":"); return int(a) * 60 + float(b)
# BGM と効果音（04_演出.md 6章。時間は台本上の時刻で書き、録音の長さに合わせて自動でずらす）
BGM = {
    "L": [("A", T("0:21"), T("3:51")), ("A", T("4:01"), T("4:41")), ("B", T("4:41"), T("4:52")), ("C", T("5:18"), T("6:50")),
          ("D", T("6:50"), T("9:44")), ("E", T("9:44"), T("11:35")), ("F", T("11:35"), T("14:38")), ("A", T("14:38"), T("15:01"))],
    "S": [("A", T("0:00"), T("0:36")), ("D", T("0:41"), T("1:00"))],
}
# 効果音は「どのカットの、頭から何秒後か」で指定する（カットの表示時間が録音に合わせて伸び縮みしても、画と音がずれない）
# (音, カット, カットの頭からの秒〈台本上〉, 回数, 間隔〈実秒〉)
SFX = {
    "L": [("train", "L01", 0, 1, 0), ("pop", "L02", .2, 1, 0), ("click", "L03", .3, 9, .1), ("train", "L08", 0, 1, 0), ("pop", "L11", .4, 1, 0),
          ("rewind", "L13", 0, 1, 0), ("click", "L17", .5, 9, .1), ("tag", "L20", .3, 2, .4), ("paper", "L22", 0, 3, .7), ("drum", "L27", 0, 1, 0),
          ("wind", "L28", 0, 1, 0), ("car", "L31", 0, 1, 0), ("clockstop", "L35", .2, 1, 0), ("clockstop", "L47", .3, 1, 0), ("flip", "L47", 7, 1, 0),
          ("pin", "L48", 1, 1, 0), *[("pin", c, .3, 1, 0) for c in ["L49", "L50", "L52", "L53", "L54", "L55", "L56"]],
          ("flip", "L67", .3, 1, 0), ("tick", "L69", .3, 16, 1.0), ("pop", "L70", .4, 1, 0), ("rewind", "L75", .3, 1, 0),
          ("tag", "L76", 7, 2, .3), ("tag", "L77", .4, 1, 0), ("clockstop", "L78", .2, 1, 0), ("tag", "L78", .8, 2, .4), ("tag", "L79", 3, 1, 0),
          ("tag", "L80", .3, 5, .9), ("tag", "L81", .4, 1, 0), ("train", "L86", .5, 1, 0)],
    "S": [("click", "S01", 0, 3, .8), ("click", "S04", .3, 9, .1), ("drum", "S05b", 0, 1, 0), ("clockstop", "S06", .3, 1, 0), ("pin", "S08", .3, 4, 2.0)],
}

# 録り直し：{録音ファイル: [差し替える行の番号（録音の中の順）]}
FIXES = {"L": {"修正_1.m4a": [63, 64]}, "S": {}}

def run(kind, md, audio, folder, size, name):
    lines = script_lines(EP / md)
    res = align(EP / "audio" / audio, lines)
    extra = []
    for fn, nos in FIXES[kind].items():
        extra.append(EP / "audio" / fn)
        for n, rep in replacement(EP / "audio" / fn, nos, len(extra)).items():
            res[n - 1].update(rep, speech=sum(b - a for a, b in rep["chunks"]), inner_max=0.0, fixed=fn)
    drop_retakes(res)   # 間をあけて読み直した行は、前の言いかけを捨てる
    wav = EP / "audio" / f"{name}_ナレーション.wav"
    starts, real_end = rebuild_audio(EP / "audio" / audio, res, lines, wav, extra)
    items, t, out = [], 0.0, []
    for img, d in seq(kind):
        items.append((img, t, d)); t += d
    f = warp(lines, starts, t, real_end)
    first = {}
    for img, st, d in items: first.setdefault(img, st)
    hits = [(snd, first[c] + off, n, step) for snd, c, off, n, step in SFX[kind] if c in first]
    missing = [c for _, c, *_ in SFX[kind] if c not in first]
    if missing: print("効果音のカットが見つからない:", missing)
    final = EP / "audio" / f"{name}_完成音声.wav"
    if TRACK: mix_track(wav, final, TRACK, hits, f)
    else: mix(wav, final, BGM[kind], hits, f)
    rows = render(items, HERE / folder, size, final, HERE / "video" / f"{name}_完成版.mp4", f)
    rep = [f"# 当てはめ結果：{name}\n", "| 番号 | 録音内の位置 | 声の長さ（秒） | 見込み（秒） | 動画内の位置 | 気になる点 | 本文 |\n|---|---|---|---|---|---|---|\n"]
    for r, s in zip(res, starts):
        note = [f"録り直し（{r['fixed']}）"] if r.get("fixed") else []
        if r.get("dropped"): note.append(f"言い直しとみて前の{r['dropped']}秒を削除")
        elif r["inner_max"] > 1.2: note.append(f"行の途中に{r['inner_max']:.1f}秒の間（言い直し？）")
        if r["speech"] > r["expected"] * 1.5: note.append("見込みより長い")
        if r["speech"] < r["expected"] * 0.6: note.append("見込みより短い")
        m, sec_ = divmod(r["start"], 60); m2, s2 = divmod(s, 60)
        rep.append(f"| {r['no']:03d} | {int(m)}:{sec_:04.1f} | {r['speech']:.1f} | {r['expected']:.1f} | {int(m2)}:{s2:04.1f} | {'／'.join(note)} | {lines[r['no']-1][1][:40]} |\n")
    (EP / "audio" / f"当てはめ結果_{name}.md").write_text("".join(rep))
    m, s = divmod(real_end, 60)
    print(f"{name}: {len(lines)}行 → {int(m)}分{int(s):02d}秒、カット {len(rows)}")

if __name__ == "__main__":
    run("L", "03_台本_長尺.md", "長尺_収録.m4a", "long", "1920:1080", "きさらぎ駅_長尺")
    if len(sys.argv) < 2 or sys.argv[1] != "L": run("S", "03_台本_ショート.md", "ショート_収録.m4a", "short", "1080:1920", "きさらぎ駅_ショート")
