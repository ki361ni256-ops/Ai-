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
SFX = {
    "L": [("train", T("0:00"), 1, 0), ("pop", T("0:04"), 1, 0), ("click", T("0:09"), 9, .1), ("train", T("0:38"), 1, 0), ("pop", T("1:07"), 1, 0),
          ("rewind", T("1:33"), 1, 0), ("click", T("2:05"), 9, .1), ("tag", T("2:38"), 2, .4), ("paper", T("2:59"), 3, .7), ("drum", T("3:38"), 1, 0),
          ("wind", T("3:45"), 1, 0), ("car", T("4:12"), 1, 0), ("clockstop", T("4:55"), 1, 0), ("clockstop", T("6:43"), 1, 0), ("flip", T("6:50"), 1, 0),
          *[("pin", T(x), 1, 0) for x in ["7:00", "7:12", "7:34", "8:04", "8:16", "8:38", "8:48", "9:08"]],
          ("flip", T("11:30"), 1, 0), ("tick", T("11:52"), 16, 1.0), ("pop", T("12:09"), 1, 0), ("rewind", T("13:20"), 1, 0),
          *[("tag", T(x), 1, 0) for x in ["13:33", "13:40", "13:47", "13:59", "14:06", "14:09", "14:12", "14:16"]], ("clockstop", T("13:46"), 1, 0),
          ("train", T("15:01"), 1, 0)],
    "S": [("click", T("0:00"), 3, .8), ("click", T("0:13"), 9, .1), ("drum", T("0:23"), 1, 0), ("clockstop", T("0:30"), 1, 0), ("pin", T("0:41"), 4, 2.5)],
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
    final = EP / "audio" / f"{name}_完成音声.wav"
    if TRACK: mix_track(wav, final, TRACK, SFX[kind], f)
    else: mix(wav, final, BGM[kind], SFX[kind], f)
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
