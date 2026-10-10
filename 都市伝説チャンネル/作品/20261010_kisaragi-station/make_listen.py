"""きさらぎ駅：聞かせる型の動画（背景＋章タイトル＋字幕）を作る：python3 make_listen.py [L|S]"""
import sys, pathlib
EP = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(EP.parents[1] / "素材" / "tools"))
from listen import build

TRACK = EP.parents[1] / "素材" / "bgm" / "Whole_Tone_Limbo_-_Godmode.mp3"
FIXES = {"L": {"修正_1.m4a": [63, 64], "修正_2.m4a": [26, 93, 111]}, "S": {}}
BG = [("冒頭", "G01"), ("導入", "G01"), ("第1章", "G02"), ("第2章", "G03"), ("再フック", "G08"), ("第3章", "G08"),
      ("第4章", "G09"), ("第5章", "G04"), ("第6章", "G01"), ("整理", "G02"), ("結び", "G09")]

def bg(vertical):
    def f(sec):
        for key, g in BG:
            if sec.startswith(key):
                p = EP / "images" / "bg" / f"{g}{'_vertical' if vertical else ''}.png"
                return str(p if p.exists() else EP / "images" / "bg" / f"{g}.png")
        return str(EP / "images" / "bg" / "G01.png")
    return f

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "LS"
    if "L" in which:
        build(EP, "L", "03_台本_長尺.md", "長尺_収録.m4a", FIXES["L"], TRACK, "きさらぎ駅_長尺", bg(False), (1920, 1080),
              first_title="きさらぎ駅\n時刻順にたどる実況ログ")
    if "S" in which:
        build(EP, "S", "03_台本_ショート.md", "ショート_収録.m4a", FIXES["S"], TRACK, "きさらぎ駅_ショート", lambda s: str(EP / "images" / "bg" / "G01_vertical.png"), (1080, 1920))
