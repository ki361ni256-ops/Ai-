# CLAUDE.md

このリポジトリは「楽天アフィリエイト」の運営ワークスペースです。全体像は `README.md`、最初にやることは `00_start-here/next-steps.md` を参照。

## 作業ルール

- 作業前に `02_plan/strategy.md`（媒体・ジャンル・読者）と `guidelines/` を読む
- 新しい投稿は `03_posts/_template/` をコピーして `03_posts/YYYY-MM-DD_slug/` を作る
- リサーチ結果には必ず出典（URL・取得日）を残す。出典のない数字は書かない
- **使用感・体験談を作らない**。本人が使っていない商品は「使ってみた」と書かない。必要な箇所は `【要記入: 自分の使用感】` にする
- すべての投稿・プロフィールに PR 表記を入れる（`guidelines/compliance.md`）
- 化粧品・健康食品・サプリなどは効果効能をうたわない（薬機法）
- 報酬率・規約・価格は変わりやすいので、公式ページで確認し確認日を記録する
- 他人の投稿文・商品レビューを転載しない

## 専門エージェント

運営は `.claude/agents/` の専門エージェントに任せる。各担当は自分の担当ファイル以外を書き換えない。

1. `rakuten-researcher` — リサーチ担当 → `01_research/`、`02_plan/product-list.md`（候補の追加）
2. `rakuten-planner` — 企画担当 → `02_plan/calendar.md`、`03_posts/<投稿>/00_plan.md`
3. `rakuten-writer` — 紹介文担当 → `03_posts/<投稿>/01_draft.md`
4. `rakuten-checker` — チェック担当 → `03_posts/<投稿>/02_check.md`（原稿は書き換えない）
5. `rakuten-analyst` — 分析担当 → `05_analytics/`

チェックで 🔴 必須修正が出たら、レポートの「担当」欄のエージェントに差し戻して直し、再度チェックする。

## 作業順序

1. リサーチ（商品候補を `product-list.md` へ）
2. 企画（`00_plan.md` とカレンダー）
3. 紹介文（`01_draft.md`）
4. チェック（`02_check.md`）→ 人間が使用感を書き足して投稿
5. 投稿済みフォルダを `04_published/` へ移動
6. 週1回、分析担当で振り返り → 次の企画へ
