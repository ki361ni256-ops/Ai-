"""八尺様：聞かせる型の動画（背景＋章タイトル＋字幕）を作る：python3 make_listen.py [L|S]"""
import sys, pathlib
EP = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(EP.parents[1] / "素材" / "tools"))
from listen import build

TRACK = EP.parents[1] / "素材" / "bgm" / "Whole_Tone_Limbo_-_Godmode.mp3"
FIXES = {"L": {}, "S": {}}
BG = [("あなたの八尺様チェック", "G01"), ("昔話の顔をした怪談", "G02"), ("第1章", "G05"), ("第2章", "G07"),
      ("第3章", "G08b"), ("第4章", "G09"), ("答え合わせ", "G11")]

def bg(sec):
    for key, g in BG:
        if key in sec: return str(EP / "images" / "bg" / f"{g}.png")
    return str(EP / "images" / "bg" / "G01.png")

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "LS"
    if "L" in which:
        build(EP, "L", "03_台本_長尺.md", "長尺_収録.m4a", FIXES["L"], TRACK, "八尺様_長尺", bg, (1920, 1080))
    if "S" in which:
        build(EP, "S", "03_台本_ショート.md", "ショート_収録.m4a", FIXES["S"], TRACK, "八尺様_ショート", lambda s: str(EP / "images" / "bg" / "G08b_vertical_1.png"), (1080, 1920))
