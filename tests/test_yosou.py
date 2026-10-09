"""予想の仕組み（貼る→予想→記録→結果→振り返り→監査）のテスト。出走表は本人が貼った実際のもの。"""
import importlib.util
import tempfile
import unittest
from pathlib import Path

from keirin.card_parser import parse_card, check_card
from keirin.odds_parser import parse_trifecta
from keirin import yosou as Y

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("yosou_cli", ROOT / "scripts" / "yosou.py")
cli = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cli)
CARD8 = ROOT / "tests" / "data" / "yahiko_20261009_08R.txt"
CARD12 = ROOT / "tests" / "data" / "yahiko_20261009_12R.txt"


class TestYosou(unittest.TestCase):
    def test_parse_cards(self):
        r = parse_card(CARD8.read_text(encoding="utf-8"))
        self.assertEqual(check_card(r), [])
        self.assertEqual([x["car_no"] for x in r], list(range(1, 10)))
        self.assertEqual(r[4]["name"], "武藤龍")
        self.assertEqual(r[4]["frame_no"], 4)        # 枠番のない行は直前の枠
        self.assertEqual(r[6]["style"], "逃")
        r12 = parse_card(CARD12.read_text(encoding="utf-8"))
        self.assertEqual(r12[6]["absences"][0]["reason"], "負傷欠場")

    def test_odds_parser(self):
        o = parse_trifecta("1 1-5-2 12.3\n2位 1→2→5 15.0倍\n3 2-5-1 1,234.5\nゴミ行 5\n")
        self.assertEqual(o, {"1-5-2": 12.3, "1-2-5": 15.0, "2-5-1": 1234.5})

    def test_formation_has_no_duplicates(self):
        f = Y.formation(Y.rank(parse_card(CARD8.read_text(encoding="utf-8"))))
        allc = sum(f.values(), [])
        self.assertEqual(len(allc), len(set(allc)))
        self.assertEqual(f["厚め"], ["1-5-2"])

    def test_x_text_audit(self):
        self.assertTrue(Y.audit_text("今日は波乱必至！"))
        r = Y.rank(parse_card(CARD8.read_text(encoding="utf-8")))
        self.assertEqual(Y.audit_text(Y.render_x("弥彦", 8, r, Y.formation(r))), [])

    def test_full_loop(self):
        with tempfile.TemporaryDirectory() as d:
            conn = cli.db(Path(d) / "y.db")
            out = cli.predict(conn, "弥彦", "2026-10-09", 8, str(CARD8))
            self.assertTrue(out["ok"])
            again = cli.predict(conn, "弥彦", "2026-10-09", 8, str(CARD8))
            self.assertFalse(again["ok"])                        # 同じ予想を書き換えない
            cli.result(conn, "弥彦", "2026-10-09", 8, "1-5-2", 5000)
            rep = cli.report(conn)
            self.assertEqual(rep["厚め"]["hit_races"], 1)
            self.assertEqual(rep["厚め"]["return_yen"], 15000)   # 300円 × 50倍
            probs = cli.audit(conn)
            self.assertTrue(any("少なすぎる" in p for p in probs))  # サンプル不足を必ず指摘
            cmp = cli.compare(conn, "v1", "v1")
            self.assertFalse(cmp["adopt"])                        # 1レースでは採用しない


if __name__ == "__main__":
    unittest.main()


class TestMatrixOdds(unittest.TestCase):
    def test_parse_oddspark_matrix(self):
        from keirin.matrix_odds_parser import parse_matrix, format_lines
        o = parse_matrix((ROOT / "予想記録" / "inputs" / "弥彦_20261009_10R_odds_1着1.txt").read_text(encoding="utf-8"))
        self.assertEqual(o["problems"], [])
        self.assertEqual(o["axis"], 1)                 # 空の行と列から1着を決める
        self.assertEqual(len(o["odds"]), 56)           # 8×7通り
        self.assertEqual(o["odds"]["1-9-2"], 36.0)     # 2着9・3着2
        self.assertEqual(o["odds"]["1-2-9"], 23.5)
        self.assertEqual(o["source_timestamp"], "2026-10-09T14:58:00+09:00")
        self.assertEqual(format_lines(o["lines"]), "9-2 / 4-1 / 7-3 / 8-6 / 5")


class TestCompress(unittest.TestCase):
    def test_formation_notation(self):
        from keirin.yosou import compress, _expand_sets
        cases = {("1-2-5", "1-5-2"): "1-25-25",
                 ("4-3-7", "4-3-5", "4-1-3", "4-1-7", "4-1-5"): "4-13-357",
                 ("5-2-3", "2-5-3"): "25-25-3"}
        for combos, want in cases.items():
            self.assertEqual(compress(list(combos)), want)
        # どんな組合せでも、展開すると元と同じ点数・同じ買い目になる
        combos = ["3-1-7", "3-7-1", "1-3-7", "7-3-1", "2-1-9", "2-1-4"]
        parts = compress(combos).split(" / ")
        got = []
        for p in parts:
            a, b, c = ({int(ch) for ch in x} for x in p.split("-"))
            got += sorted(_expand_sets(a, b, c))
        self.assertEqual(sorted(got), sorted(combos))


class TestChecker(unittest.TestCase):
    def test_check_post(self):
        from keirin.checker import check_post, x_weighted_length
        good = "🚴 四日市競輪 6R\n\n◎4 山本\n\n厚め 4-3-1\n本線 4-13-357\n押さえ 3-4-17 / 1-4-3"
        self.assertEqual(check_post(good), [])
        self.assertEqual(x_weighted_length("ab"), 2)
        self.assertEqual(x_weighted_length("あい"), 4)
        bad = good + "\n【荒れた場合】\n137-137-17\n並びは7-3-1"
        p = check_post(bad, lines_known=False)
        self.assertTrue(any("3区分以外" in x for x in p))
        self.assertTrue(any("並び" in x for x in p))
        dup = "厚め 4-3-1\n本線 4-3-1\n押さえ 1-4-3"
        self.assertTrue(any("重複" in x for x in check_post(dup)))
        self.assertTrue(any("文字数" in x for x in check_post(good + "あ" * 200)))
