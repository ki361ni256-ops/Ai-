"""予想の仕組み（貼る → 予想 → 記録 → 結果 → 振り返り）。

  予想: python3 scripts/yosou.py predict 弥彦 2026-10-09 8 予想記録/inputs/弥彦_20261009_08R_card.txt [オッズ.txt]
  結果: python3 scripts/yosou.py result 弥彦 2026-10-09 8 1-5-2 12340
  振り返り: python3 scripts/yosou.py report
DB は yosou.db（小さいので Git で残す）。入力テキストは 予想記録/inputs/ に保存して Git で残す。
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from keirin.card_parser import parse_card, check_card  # noqa: E402
from keirin.db import connect, init_db  # noqa: E402
from keirin.odds_parser import parse_trifecta, diagnose  # noqa: E402
from keirin.matrix_odds_parser import parse_matrix  # noqa: E402
from keirin.timeutil import now_jst  # noqa: E402
from keirin import yosou as Y  # noqa: E402

STAKE = {"厚め": 300, "本線": 100, "押さえ": 100}


def db(path=None):
    conn = connect(str(path or ROOT / "yosou.db"))
    init_db(conn)
    return conn


def predict(conn, venue, date, race_no, card_path, odds_path=None, version=Y.CURRENT):
    text = Path(card_path).read_text(encoding="utf-8")
    riders = parse_card(text)
    probs = check_card(riders)
    if probs:
        return dict(ok=False, problems=probs)
    odds, odds_warning, odds_stamp = None, None, None
    if odds_path:
        odds = {}
        for op in str(odds_path).split(","):
            ot = Path(op).read_text(encoding="utf-8")
            if "2着" in ot and "3着" in ot:          # 1着固定の表（オッズパークの形）
                mx = parse_matrix(ot)
                if mx["problems"]:
                    odds_warning = "; ".join(mx["problems"])
                    continue
                odds.update(mx["odds"])
                odds_stamp = mx["source_timestamp"] or odds_stamp
            else:
                got = parse_trifecta(ot)
                if not got:
                    odds_warning = diagnose(ot)
                odds.update(got)
        if not odds:
            odds_path, odds = None, None  # 組合せの分からないオッズは記録に使わない
    ranked = Y.rank(riders, version)
    form = Y.formation(ranked)
    x = Y.render_x(venue, race_no, ranked, form, odds)
    audit = Y.audit_text(x)
    marks = [dict(mark=s, car_no=r["car_no"], name=r["name"], score=r["score"]) for s, r in Y.marks(ranked)]
    cur = conn.execute(
        "INSERT OR IGNORE INTO pick_runs(venue,event_date,race_no,rule_version,created_at,card_sha256,card_path,odds_path,"
        "odds_retrieved_at,marks_json,x_text,x_audit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (venue, date, int(race_no), version, now_jst(), hashlib.sha256(text.encode()).hexdigest(), str(card_path),
         str(odds_path) if odds_path else None, (odds_stamp or now_jst()) if odds_path else None,
         json.dumps(marks, ensure_ascii=False), x, json.dumps(audit, ensure_ascii=False)))
    if cur.rowcount == 0:
        return dict(ok=False, problems=["同じレース・同じルールの予想が既にある（あとから書き換えない）"])
    pid = cur.lastrowid
    for tier, combos in form.items():
        for c in combos:
            conn.execute("INSERT INTO pick_bets(pick_id,tier,combination,stake_yen,odds_at_pick) VALUES (?,?,?,?,?)",
                         (pid, tier, c, STAKE[tier], (odds or {}).get(c)))
    conn.commit()
    return dict(ok=True, pick_id=pid, x_text=x, x_audit=audit, formation=form, odds_warning=odds_warning)


def result(conn, venue, date, race_no, trifecta, payout=None):
    conn.execute("INSERT OR REPLACE INTO pick_results(venue,event_date,race_no,trifecta,payout_yen,entered_at) VALUES (?,?,?,?,?,?)",
                 (venue, date, int(race_no), trifecta, int(payout) if payout else None, now_jst()))
    conn.commit()


def report(conn, version=None):
    """区分ごと・全体の的中率と回収率（払戻が分かるレースだけで回収率を出す）。"""
    q = """SELECT p.pick_id, p.venue, p.event_date, p.race_no, p.rule_version, b.tier, b.combination, b.stake_yen,
                  r.trifecta, r.payout_yen
           FROM pick_runs p JOIN pick_bets b ON b.pick_id = p.pick_id
           JOIN pick_results r ON r.venue = p.venue AND r.event_date = p.event_date AND r.race_no = p.race_no"""
    rows = conn.execute(q + (" WHERE p.rule_version = ?" if version else ""), (version,) if version else ()).fetchall()
    out, races = {}, {}
    for row in rows:
        hit = row["combination"] == row["trifecta"]
        for key in (row["tier"], "合計"):
            t = out.setdefault(key, dict(points=0, hits=0, stake=0, ret=0, races=set(), hit_races=set(), unknown_payout=0))
            t["points"] += 1
            t["races"].add(row["pick_id"])
            if hit:
                t["hits"] += 1
                t["hit_races"].add(row["pick_id"])
            if row["payout_yen"] is None:
                t["unknown_payout"] += 1
                continue
            t["stake"] += row["stake_yen"]
            t["ret"] += row["payout_yen"] * row["stake_yen"] // 100 if hit else 0
        r = races.setdefault(row["pick_id"], [row["event_date"], row["race_no"], 0, 0])
        if row["payout_yen"] is not None:
            r[2] += row["stake_yen"]
            r[3] += row["payout_yen"] * row["stake_yen"] // 100 if hit else 0
    summary = {}
    for k, t in out.items():
        summary[k] = dict(races=len(t["races"]), points=t["points"], hit_races=len(t["hit_races"]),
                          race_hit_rate=len(t["hit_races"]) / len(t["races"]), stake_yen=t["stake"], return_yen=t["ret"],
                          roi=(t["ret"] / t["stake"] if t["stake"] else None), payout_unknown_points=t["unknown_payout"])
    streak = max_streak = cum = peak = dd = 0
    for _, _, s, r in sorted(races.values()):
        if s == 0:
            continue
        streak = 0 if r > 0 else streak + 1
        max_streak = max(max_streak, streak)
        cum += r - s
        peak = max(peak, cum)
        dd = max(dd, peak - cum)
    summary["連敗・ドローダウン"] = dict(max_losing_streak=max_streak, max_drawdown_yen=dd)
    return summary


def audit(conn):
    """記録の監査。問題のリスト（空なら合格）。"""
    probs = []
    for r in conn.execute("SELECT p.*, r.entered_at FROM pick_runs p LEFT JOIN pick_results r ON r.venue=p.venue AND"
                          " r.event_date=p.event_date AND r.race_no=p.race_no"):
        tag = f"{r['venue']} {r['event_date']} {r['race_no']}R"
        if r["entered_at"] and r["entered_at"] <= r["created_at"]:
            probs.append(f"{tag}: 結果の登録より後に予想が作られている")
        if r["race_start_time"] and r["created_at"] >= r["race_start_time"]:
            probs.append(f"{tag}: 発走後に予想が作られている")
        if json.loads(r["x_audit"] or "[]"):
            probs.append(f"{tag}: 投稿文の監査で指摘あり {r['x_audit']}")
        p = Path(r["card_path"])
        if not p.is_absolute():
            p = ROOT / p
        if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest() != r["card_sha256"]:
            probs.append(f"{tag}: 入力した出走表が見つからない／内容が変わっている")
    n = conn.execute("SELECT COUNT(*) FROM pick_results").fetchone()[0]
    if n < 100:
        probs.append(f"結果が登録されたレースが {n} 件。ルールの良し悪しを判断するには少なすぎる（目安100件以上）")
    return probs


def replay(conn, version):
    """保存してある出走表に、指定したルールをもう一度当てはめて成績を出す（ルール比較用。DB は書き換えない）。
    使うのは結果と払戻が登録済みのレースだけ。発走順に並べる。"""
    rows = conn.execute("""SELECT DISTINCT p.venue, p.event_date, p.race_no, p.card_path, r.trifecta, r.payout_yen
                           FROM pick_runs p JOIN pick_results r ON r.venue=p.venue AND r.event_date=p.event_date
                           AND r.race_no=p.race_no WHERE r.payout_yen IS NOT NULL
                           ORDER BY p.event_date, p.race_no""").fetchall()
    stake = ret = hits = 0
    for row in rows:
        p = Path(row["card_path"])
        p = p if p.is_absolute() else ROOT / p
        form = Y.formation(Y.rank(parse_card(p.read_text(encoding="utf-8")), version))
        hit_any = False
        for tier, combos in form.items():
            for c in combos:
                stake += STAKE[tier]
                if c == row["trifecta"]:
                    ret += row["payout_yen"] * STAKE[tier] // 100
                    hit_any = True
        hits += hit_any
    n = len(rows)
    return dict(version=version, races=n, race_hit_rate=(hits / n if n else None), stake_yen=stake, return_yen=ret,
                roi=(ret / stake if stake else None))


def compare(conn, old, new, min_races=100):
    """新ルールを採用してよいか。サンプル数が足りなければ採用しない。"""
    a, b = replay(conn, old), replay(conn, new)
    ok = b["races"] >= min_races and (b["roi"] or 0) > (a["roi"] or 0)
    return dict(old=a, new=b, adopt=ok,
                note=("採用候補" if ok else f"採用しない（レース数 {b['races']} < {min_races}、または回収率が上がらない）"))


if __name__ == "__main__":
    cmd, *a = sys.argv[1:]
    conn = db()
    if cmd == "predict":
        print(json.dumps(predict(conn, *a), ensure_ascii=False, indent=1))
    elif cmd == "result":
        result(conn, *a)
        print("記録しました")
    elif cmd == "report":
        print(json.dumps(report(conn), ensure_ascii=False, indent=1, default=str))
        print("監査:", json.dumps(audit(conn), ensure_ascii=False, indent=1))
    elif cmd == "compare":
        print(json.dumps(compare(conn, *a), ensure_ascii=False, indent=1))
