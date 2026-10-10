"""本人のナレーション録音に合わせた動画を作る：python3 make_narrated.py
入力：../audio/長尺_収録.m4a・../audio/ショート_収録.m4a（収録台本の番号順に読んだもの）
出力：video/きさらぎ駅_長尺_ナレーション入り.mp4 ほか、../audio/当てはめ結果_*.md（行ごとの時刻。言い直しの疑いも表示）
"""
import sys, pathlib
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parents[2] / "素材" / "tools"))
from narrate import script_lines, align, rebuild_audio, warp, render
from make_video import seq, cuts

EP = HERE.parent
def run(kind, md, audio, folder, size, name):
    lines = script_lines(EP / md)
    res = align(EP / "audio" / audio, lines)
    wav = EP / "audio" / f"{name}_ナレーション.wav"
    starts, real_end = rebuild_audio(EP / "audio" / audio, res, lines, wav)
    items, t, out = [], 0.0, []
    for img, d in seq(kind):
        items.append((img, t, d)); t += d
    f = warp(lines, starts, t, real_end)
    rows = render(items, HERE / folder, size, wav, HERE / "video" / f"{name}_ナレーション入り.mp4", f)
    rep = [f"# 当てはめ結果：{name}\n", "| 番号 | 録音内の位置 | 声の長さ（秒） | 見込み（秒） | 動画内の位置 | 気になる点 | 本文 |\n|---|---|---|---|---|---|---|\n"]
    for r, s in zip(res, starts):
        note = []
        if r["inner_max"] > 1.2: note.append(f"行の途中に{r['inner_max']:.1f}秒の間（言い直し？）")
        if r["speech"] > r["expected"] * 1.5: note.append("見込みより長い")
        if r["speech"] < r["expected"] * 0.6: note.append("見込みより短い")
        m, sec_ = divmod(r["start"], 60); m2, s2 = divmod(s, 60)
        rep.append(f"| {r['no']:03d} | {int(m)}:{sec_:04.1f} | {r['speech']:.1f} | {r['expected']:.1f} | {int(m2)}:{s2:04.1f} | {'／'.join(note)} | {lines[r['no']-1][1][:40]} |\n")
    (EP / "audio" / f"当てはめ結果_{name}.md").write_text("".join(rep))
    m, s = divmod(real_end, 60)
    print(f"{name}: {len(lines)}行 → {int(m)}分{int(s):02d}秒、カット {len(rows)}")

if __name__ == "__main__":
    run("L", "03_台本_長尺.md", "長尺_収録.m4a", "long", "1920:1080", "きさらぎ駅_長尺")
    run("S", "03_台本_ショート.md", "ショート_収録.m4a", "short", "1080:1920", "きさらぎ駅_ショート")
