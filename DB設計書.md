# DB設計書（STEP 4）

- 作成日: 2026-10-09
- DB: SQLite `keirin.db`（`python3 scripts/init_db.py` で作成。DB ファイル自体は Git 管理外）
- スキーマ: `db/schema.sql`／操作: `keirin/`（db.py・loaders.py・collector.py・features.py・preprocess.py）
- **前提の注意**: STEP 3 は FAIL（実データ未取得）。この設計は**テスト用の架空データでのみ検証**しており、実データの項目名・形式に合わせた調整が後で必要になる。

## データの流れ（どの行も元をたどれる）

```
raw_fetches（生データ：URL・取得時刻・内容ハッシュ・保存先）
   │ raw_id
   ▼
cleaned 層（races / entries / racers / racer_snapshots / odds_snapshots / results / payouts / velodromes / weather / meets）
   │ race_id, car_no
   ▼
feature_values（縦持ち：特徴量名・バージョン・予測時点 as_of・入力の最新時刻 max_input_time）
   │
   ▼
models → predictions（予測）  ／  backtest_runs → backtest_bets（使ったオッズの取得時刻つき）
```
- cleaned 層の各行は `raw_id`・`source_id`・`source_url`・`retrieved_at` を持つ。
- 予測（predictions）と結果（results）は別テーブル。predictions は結果の列を持たない。

## テーブル一覧

| 区分 | テーブル | 役割 | 一意キー（二重登録防止） |
|---|---|---|---|
| 取得 | data_sources | 提供元と規約・robots.txt の確認記録。`auto_fetch_allowed` が 1 でないと取得しない | name |
| 取得 | raw_fetches | 生データ | (source_id, source_url, content_sha256) |
| 取得 | fetch_queue | 取得予定（再開用） | (source_id, source_url) |
| 取得 | fetch_runs | 実行ごとの件数・処理時間 | run_id |
| 取得 | fetch_log | 1回ごとのアクセス記録（失敗も） | log_id |
| 場 | velodromes | 周長・みなし直線・カント（原文） | name, official_code |
| 選手 | racers | 選手（登録番号） | racer_id |
| 選手 | racer_snapshots | 級班・競走得点など時間で変わる情報 | (racer_id, retrieved_at) |
| 開催 | meets | 開催とグレード（GP/G1/G2/G3/F1/F2/unverified） | (velodrome_id, first_date) |
| レース | races | レース（級班 class_tier はグレードと別カラム） | (velodrome_id, event_date, race_no) |
| レース | race_start_time_history | 発走時刻の変更履歴 | (race_id, retrieved_at) |
| 出走 | entries | 出走表の取得時点ごとのスナップショット（欠車・並び原文） | (race_id, car_no, retrieved_at) |
| オッズ | odds_snapshots | オッズの時系列 | (race_id, bet_type, combination, retrieved_at) |
| 結果 | results | 着順・確定時刻 | (race_id, car_no) |
| 結果 | payouts | 払戻 | (race_id, bet_type, combination) |
| 天候 | weather | 天候・風向・風速（観測か予報かを区別） | (velodrome_id, observed_at, is_forecast, source_id) |
| 特徴量 | feature_definitions | 特徴量の定義・使用可能時点・リスク | (feature_name, feature_version) |
| 特徴量 | feature_values | 特徴量の値 | (race_id, car_no, feature_name, feature_version, as_of) |
| 予測 | models / predictions | モデルと予測 | (name, version) / (model_id, race_id, bet_type, combination, as_of) |
| 検証 | backtest_runs / backtest_bets | バックテストと買い目（判断に使ったオッズ取得時刻） | backtest_id / (backtest_id, race_id, bet_type, combination) |

すべての cleaned テーブルに `created_at`・`updated_at` を持つ。登録は `upsert()`（同じキーなら更新、変化がなければ何もしない）。

## 時点管理

- 時刻はすべて `YYYY-MM-DDTHH:MM:SS+09:00`。`to_jst_iso()` を通さないと登録できず、**タイムゾーンのない時刻はエラー**にする（推測で補わない）。
- 4区分：オッズ取得時刻＝`odds_snapshots.retrieved_at`（提供元の時点は `source_timestamp`）／データ取得時刻＝各表の `retrieved_at`／発走時刻＝`races.race_start_time`（履歴あり）／結果確定時刻＝`results.result_confirmed_at`。
- `odds_snapshots.snapshot_kind` は登録時に自動判定：**当日 08:00 以前かつ発走前＝`pre_0800`**、08:00 より後で発走前＝`live`、発走以降に取得＝`final`。取得時刻のないオッズは登録できない。
- 朝8時に使ってよいオッズはビュー `v_odds_usable_0800` だけから読む。

## 監査用ビュー（行が出たら問題）

| ビュー | 検出するもの |
|---|---|
| v_leak_features | 特徴量の入力に、予測時点より新しいデータが入っている |
| v_warn_features | 近似（過去レースの出走表を後から取得したもの等）を許した特徴量。WARNING として報告 |
| v_leak_predictions | 予測時点が発走時刻以降 |
| v_leak_train_overlap | 学習期間に含まれるレースを予測している |
| v_leak_backtest_odds | 朝8時基準のバックテストで、予測時点より後のオッズ・最終オッズ・取得時刻不明のオッズを使った |

## 監査（監査役チェック）

| # | 確認項目 | 結果 | 根拠（テスト） |
|---|---|---|---|
| 1 | 将来的に特徴量を追加できるか | PASS | feature_values は縦持ち。列追加なしで新しい特徴量・バージョンを追加できる |
| 2 | オッズの時系列保存ができるか | PASS | 同じ組合せを 07:30・09:00・11:05 に保存し3行・種類 pre_0800/live/final を確認（test_odds_time_series_and_0800_view） |
| 3 | 未来情報の混入を検出できるか | PASS | 4つの監査ビューが、わざと入れた混入をそれぞれ検出（test_leak_views_detect_problems） |
| 4 | 同じデータを二重登録しないか | PASS | レース再登録は unchanged、同時刻オッズ再登録で行が増えない、取得キューと生データも一意 |
| 5 | 取得時刻を追跡できるか | PASS | 全 cleaned 行が retrieved_at・raw_id を持ち、生データの取得時刻・URL までたどれる |
| 6 | 結果と予測を分離できているか | PASS | predictions に結果の列がない（test_predictions_do_not_contain_results） |

**判定: PASS（設計として）**。ただし実データでの検証は未実施（STEP 3 が FAIL のため）。
