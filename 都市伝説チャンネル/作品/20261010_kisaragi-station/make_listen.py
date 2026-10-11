"""きさらぎ駅：聞かせる型の動画（背景＋章タイトル＋字幕）を作る：python3 make_listen.py [L|S]"""
import sys, pathlib
EP = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(EP.parents[1] / "素材" / "tools"))
from listen import build

TRACK = EP.parents[1] / "素材" / "bgm" / "Whole_Tone_Limbo_-_Godmode.mp3"
FIXES = {"L": {"修正_1.m4a": [63, 64], "修正_2.m4a": [26, 93, 111]}, "S": {}}
BG = [("冒頭", "G01"), ("導入", "G01"), ("第1章", "G02"), ("第2章", "G03"), ("再フック", "G08"), ("第3章", "G08"),
      ("第4章", "G09"), ("第5章", "G04"), ("第6章", "G01"), ("整理", "G02"), ("結び", "G09")]

# 画面左上の章名（公開用資料のチャプター名と同じ）
CHAPTERS = [("冒頭", "存在しない駅に、分単位の時刻が残っている"), ("導入", "舞台は「実況スレ」"), ("第1章", "第1章【23:14→23:23】最初の9分"),
            ("第2章", "第2章【23:23→？】時刻が消える夜"), ("再フック", "【3:44】最後の書き込み"), ("第3章", "第3章【3:44のあと】書かれていなかったこと"),
            ("第4章", "第4章【2004→2025】年で進むカウンター"), ("第5章", "第5章 さぎの宮駅は「説」として"), ("第6章", "第6章 なぜ「実況」は本当に見えたのか（考察）"),
            ("整理", "3:44で止まった記録と、その後の年"), ("結び", "あなたの「最初のきさらぎ駅」は？")]

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
              chapter_names=CHAPTERS)
    if "S" in which:
        build(EP, "S", "03_台本_ショート.md", "ショート_収録.m4a", FIXES["S"], TRACK, "きさらぎ駅_ショート", lambda s: str(EP / "images" / "bg" / "G01_vertical.png"), (1080, 1920))
