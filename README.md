# 楽天アフィリエイト 運営ワークスペース

楽天の商品をリサーチし、紹介文を作って発信し、成果を振り返るためのフォルダです。
note のワークスペースと同じように、役割ごとに専門エージェント（担当）を分けています。

👉 **登録したばかりで何をすればいいか分からない場合は、まず [`00_start-here/next-steps.md`](00_start-here/next-steps.md) を開いてください。**

## 制作チーム（専門エージェント）

| # | エージェント | 役割 | 書くファイル | やらないこと |
|---|---|---|---|---|
| 1 | `rakuten-researcher` | リサーチ担当: ジャンル・売れ筋・報酬率・競合・セール時期を調べる | `01_research/`、`02_plan/product-list.md`（候補追加） | 企画・紹介文 |
| 2 | `rakuten-planner` | 企画担当: 何を・どこで・いつ・どんな切り口で紹介するか決める | `02_plan/calendar.md`、`00_plan.md` | リサーチ・文章 |
| 3 | `rakuten-writer` | 紹介文担当: ROOM・SNS・ブログ用の紹介文とハッシュタグ | `01_draft.md` | 企画変更・体験談の創作 |
| 4 | `rakuten-checker` | チェック担当: PR表記・誇大表現・薬機法・価格の食い違い | `02_check.md`（原稿は書き換えない） | 原稿の書き換え |
| 5 | `rakuten-analyst` | 分析担当: 成果レポートを記録し、次の企画を提案 | `05_analytics/` | 数字の推測・企画作成 |

### ROOMの商品さがし（いちばん手軽）
「おしゃれな上着を探して」のように言うだけで、楽天市場から商品を3つ探し、レビューを読んでまとめ、
**ROOMで検索する商品名・紹介文・ハッシュタグ** をコピペできる形で返します（`.claude/skills/room-search/`）。
結果は `03_posts/_search/` に保存されます。
※楽天の公式API（楽天ウェブサービス）を使います。環境変数 `RAKUTEN_APP_ID`（と `RAKUTEN_ACCESS_KEY`）と、ネットワーク設定で `app.rakuten.co.jp` の許可が必要です（`tools/rakuten_search.py`）。

使い方の例（Claude Code で）:
```
rakuten-researcher で「キッチン収納」ジャンルの売れ筋と報酬率を調べて
rakuten-planner で来週分（5投稿）の企画を作って
rakuten-writer で 03_posts/2026-10-05_kitchen-storage の紹介文を書いて
rakuten-checker でチェックして
rakuten-analyst で今週を振り返って
```
「この商品の投稿を最初から最後まで作って」と頼むと、Claude が 1 → 2 → 3 → 4 の順に担当を呼びます。

```
リサーチ担当 → 企画担当 → 紹介文担当 → チェック担当 → (自分で使用感を足して投稿) → 分析担当
     ↑                                                                                │
     └──────────────────────── 振り返りを次の企画へ ────────────────────────────┘
```

## フォルダ構成

```
Ai-/
├── README.md              … このファイル
├── CLAUDE.md              … Claude に作業を頼むときのルール
├── .claude/agents/        … 専門エージェント5人
├── 00_start-here/
│   └── next-steps.md      … 登録後にやることチェックリスト（最初に読む）
├── guidelines/
│   ├── compliance.md      … PR表記・ステマ規制・薬機法・規約チェック
│   ├── post-style.md      … 媒体別の紹介文の型・文体
│   ├── review-summary.md  … 楽天のレビューを参考にROOMの紹介文を作るしくみ
│   └── room-ai-prompts.md … Gemini・ChatGPT用のプロンプト（悩み→商品さがし→紹介文）
├── 01_research/           … リサーチメモ
│   ├── _template.md
│   ├── sources.md         … 情報源リスト
│   ├── genre/             … ジャンル調査
│   ├── products/          … 商品調査
│   └── competitors/       … 競合アカウント調査
├── 02_plan/
│   ├── strategy.md        … 媒体・ジャンル・読者・目標（最初に自分で決める）
│   ├── product-list.md    … 紹介候補の商品リスト
│   └── calendar.md        … 投稿カレンダー（セール時期つき）
├── 03_posts/              … 制作中の投稿（1投稿 = 1フォルダ）
│   └── _template/
│       ├── 00_plan.md     … 企画（商品・切り口・使用経験）
│       ├── 01_draft.md    … 紹介文（媒体別）
│       └── 02_check.md    … チェックレポート
├── 04_published/          … 投稿済み（03_posts から移動）
├── スレッズ投稿/          … Threads（@takurou_kurashi）の投稿文
│   ├── _template.md
│   └── 投稿済み/
└── 05_analytics/
    ├── report-log.md      … 成果レポートの記録
    └── weekly/            … 週次の振り返り
```

## 命名ルール

- リサーチメモ: `YYYY-MM-DD_テーマ.md`
- 投稿フォルダ: `YYYY-MM-DD_英数字スラッグ/`（日付は投稿予定日）
