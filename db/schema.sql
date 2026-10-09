-- keirin.db スキーマ（STEP 4）
-- 時刻はすべて ISO 8601・+09:00 付きの TEXT（例: 2026-10-09T07:58:12+09:00）。
-- 書き込みは keirin/timeutil.py の to_jst_iso() を通して形式をそろえる（文字列比較で前後を判定するため）。
-- データの流れ: raw_fetches（生データ）→ 各テーブル（cleaned）→ feature_values（特徴量）→ predictions（予測）

PRAGMA foreign_keys = ON;

------------------------------------------------------------
-- 0. 提供元と取得の記録
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sources (
  source_id          INTEGER PRIMARY KEY,
  name               TEXT NOT NULL UNIQUE,
  base_url           TEXT NOT NULL,
  terms_url          TEXT,
  robots_url         TEXT,
  terms_checked_at   TEXT,
  robots_checked_at  TEXT,
  auto_fetch_allowed INTEGER CHECK (auto_fetch_allowed IN (0,1)),  -- NULL=未確認。1 以外は取得しない
  min_interval_sec   REAL NOT NULL DEFAULT 10,
  notes              TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

-- 生データ（raw_data 層）。本文はファイルに置き、ハッシュで同一内容の二重登録を防ぐ
CREATE TABLE IF NOT EXISTS raw_fetches (
  raw_id          INTEGER PRIMARY KEY,
  source_id       INTEGER NOT NULL REFERENCES data_sources(source_id),
  source_url      TEXT NOT NULL,
  kind            TEXT NOT NULL,         -- race_card / odds / result / payout / racer / velodrome / weather
  event_date      TEXT,                  -- 対象の開催日（YYYY-MM-DD）
  retrieved_at    TEXT NOT NULL,
  http_status     INTEGER,
  content_sha256  TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  UNIQUE (source_id, source_url, content_sha256)
);

-- 取得キュー（途中停止後の再開に使う）
CREATE TABLE IF NOT EXISTS fetch_queue (
  task_id      INTEGER PRIMARY KEY,
  source_id    INTEGER NOT NULL REFERENCES data_sources(source_id),
  source_url   TEXT NOT NULL,
  kind         TEXT NOT NULL,
  event_date   TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','failed','skipped')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  next_try_at  TEXT,
  last_error   TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  UNIQUE (source_id, source_url)
);

-- 取得の実行単位（件数・処理時間）
CREATE TABLE IF NOT EXISTS fetch_runs (
  run_id        INTEGER PRIMARY KEY,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  duration_sec  REAL,
  n_ok          INTEGER NOT NULL DEFAULT 0,
  n_failed      INTEGER NOT NULL DEFAULT 0,
  n_duplicate   INTEGER NOT NULL DEFAULT 0,
  n_retry       INTEGER NOT NULL DEFAULT 0,
  status        TEXT,                  -- running / finished / aborted / refused
  note          TEXT
);

-- 1回ごとのアクセス記録（失敗も残す）
CREATE TABLE IF NOT EXISTS fetch_log (
  log_id        INTEGER PRIMARY KEY,
  run_id        INTEGER REFERENCES fetch_runs(run_id),
  task_id       INTEGER REFERENCES fetch_queue(task_id),
  source_url    TEXT NOT NULL,
  requested_at  TEXT NOT NULL,
  elapsed_ms    INTEGER,
  status        TEXT NOT NULL,         -- ok / duplicate / error / gave_up / refused
  http_status   INTEGER,
  attempt       INTEGER NOT NULL,
  message       TEXT
);

------------------------------------------------------------
-- 1. cleaned 層（各行が raw_id で生データまでたどれる）
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS velodromes (
  velodrome_id     INTEGER PRIMARY KEY,
  official_code    TEXT UNIQUE,         -- 公式の場コード（確認できたものだけ）
  name             TEXT NOT NULL UNIQUE,
  track_length_m   INTEGER,
  home_straight_m  REAL,
  cant_text        TEXT,                -- 表記揺れがあるため原文
  source_id        INTEGER REFERENCES data_sources(source_id),
  source_url       TEXT,
  retrieved_at     TEXT,
  raw_id           INTEGER REFERENCES raw_fetches(raw_id),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS racers (
  racer_id     TEXT PRIMARY KEY,         -- 公式の登録番号
  name         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- 時間で変わる選手の情報（級班・競走得点など）。取得時点ごとに残す
CREATE TABLE IF NOT EXISTS racer_snapshots (
  racer_id      TEXT NOT NULL REFERENCES racers(racer_id),
  retrieved_at  TEXT NOT NULL,
  class_tier    TEXT,
  official_score REAL,                   -- 競走得点（公式項目と確認できた場合のみ）
  fields_json   TEXT,                    -- 未確認の項目は列にせず原文で保持
  source_id     INTEGER REFERENCES data_sources(source_id),
  source_url    TEXT,
  raw_id        INTEGER REFERENCES raw_fetches(raw_id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (racer_id, retrieved_at)
);

CREATE TABLE IF NOT EXISTS meets (
  meet_id          INTEGER PRIMARY KEY,
  velodrome_id     INTEGER NOT NULL REFERENCES velodromes(velodrome_id),
  first_date       TEXT NOT NULL,
  last_date        TEXT,
  grade            TEXT NOT NULL DEFAULT 'unverified',   -- GP/G1/G2/G3/F1/F2/unverified（級班とは別の軸）
  meet_name        TEXT,
  source_id        INTEGER REFERENCES data_sources(source_id),
  source_url       TEXT,
  retrieved_at     TEXT,
  raw_id           INTEGER REFERENCES raw_fetches(raw_id),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  UNIQUE (velodrome_id, first_date)
);

CREATE TABLE IF NOT EXISTS races (
  race_id          INTEGER PRIMARY KEY,
  meet_id          INTEGER NOT NULL REFERENCES meets(meet_id),
  velodrome_id     INTEGER NOT NULL REFERENCES velodromes(velodrome_id),
  event_date       TEXT NOT NULL,
  race_no          INTEGER NOT NULL,
  class_tier       TEXT,                 -- 'S' / 'A' など（級班。grade とは別）
  race_name        TEXT,
  num_riders       INTEGER,
  race_start_time  TEXT NOT NULL,        -- 最新の発走予定時刻（変更履歴は race_start_time_history）
  source_id        INTEGER REFERENCES data_sources(source_id),
  source_url       TEXT,
  retrieved_at     TEXT NOT NULL,
  raw_id           INTEGER REFERENCES raw_fetches(raw_id),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  UNIQUE (velodrome_id, event_date, race_no)
);

CREATE TABLE IF NOT EXISTS race_start_time_history (
  race_id          INTEGER NOT NULL REFERENCES races(race_id),
  race_start_time  TEXT NOT NULL,
  retrieved_at     TEXT NOT NULL,
  source_id        INTEGER REFERENCES data_sources(source_id),
  raw_id           INTEGER REFERENCES raw_fetches(raw_id),
  PRIMARY KEY (race_id, retrieved_at)
);

-- 出走表（取得時点ごと。欠車・変更を後から追える）
CREATE TABLE IF NOT EXISTS entries (
  race_id        INTEGER NOT NULL REFERENCES races(race_id),
  car_no         INTEGER NOT NULL,
  retrieved_at   TEXT NOT NULL,
  frame_no       INTEGER,
  racer_id       TEXT REFERENCES racers(racer_id),
  is_scratched   INTEGER NOT NULL DEFAULT 0,
  line_text      TEXT,                   -- 並び・ライン（公式の表記を原文のまま）
  fields_json    TEXT,
  source_id      INTEGER REFERENCES data_sources(source_id),
  source_url     TEXT,
  raw_id         INTEGER REFERENCES raw_fetches(raw_id),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  PRIMARY KEY (race_id, car_no, retrieved_at)
);

-- オッズの時系列。snapshot_kind は取得時刻と発走時刻から自動で決める（keirin/loaders.py）
CREATE TABLE IF NOT EXISTS odds_snapshots (
  race_id          INTEGER NOT NULL REFERENCES races(race_id),
  bet_type         TEXT NOT NULL CHECK (bet_type IN ('2車単','2車複','3連単','3連複','ワイド','2枠単','2枠複')),
  combination      TEXT NOT NULL,         -- '1-3'（単式は着順どおり、複式は昇順）
  odds_min         REAL,
  odds_max         REAL,                  -- ワイドなど幅がある賭式用
  retrieved_at     TEXT NOT NULL,         -- 取得時刻（不明なオッズは登録しない）
  source_timestamp TEXT,                  -- 提供元が示すオッズの時点
  race_start_time  TEXT NOT NULL,         -- 取得時点で把握していた発走予定時刻
  snapshot_kind    TEXT NOT NULL CHECK (snapshot_kind IN ('pre_0800','live','final')),
  source_id        INTEGER REFERENCES data_sources(source_id),
  source_url       TEXT,
  raw_id           INTEGER REFERENCES raw_fetches(raw_id),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  PRIMARY KEY (race_id, bet_type, combination, retrieved_at)
);

CREATE TABLE IF NOT EXISTS results (
  race_id             INTEGER NOT NULL REFERENCES races(race_id),
  car_no              INTEGER NOT NULL,
  finish_order        INTEGER,            -- 失格・落車などは NULL にして finish_status に原文
  finish_status       TEXT,
  fields_json         TEXT,               -- 上り等は定義確認後に列へ
  result_confirmed_at TEXT,               -- 不明なら NULL（特徴量では使わない）
  retrieved_at        TEXT NOT NULL,
  source_id           INTEGER REFERENCES data_sources(source_id),
  source_url          TEXT,
  raw_id              INTEGER REFERENCES raw_fetches(raw_id),
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  PRIMARY KEY (race_id, car_no)
);

CREATE TABLE IF NOT EXISTS payouts (
  race_id       INTEGER NOT NULL REFERENCES races(race_id),
  bet_type      TEXT NOT NULL,
  combination   TEXT NOT NULL,
  payout_yen    INTEGER NOT NULL,         -- 100円あたり
  popularity    INTEGER,
  retrieved_at  TEXT NOT NULL,
  source_id     INTEGER REFERENCES data_sources(source_id),
  source_url    TEXT,
  raw_id        INTEGER REFERENCES raw_fetches(raw_id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (race_id, bet_type, combination)
);

CREATE TABLE IF NOT EXISTS weather (
  velodrome_id   INTEGER NOT NULL REFERENCES velodromes(velodrome_id),
  observed_at    TEXT NOT NULL,           -- 観測（または予報の対象）時刻
  is_forecast    INTEGER NOT NULL DEFAULT 0,
  weather_text   TEXT,
  wind_dir       TEXT,
  wind_speed_ms  REAL,
  retrieved_at   TEXT NOT NULL,
  source_id      INTEGER NOT NULL REFERENCES data_sources(source_id),
  source_url     TEXT,
  raw_id         INTEGER REFERENCES raw_fetches(raw_id),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  PRIMARY KEY (velodrome_id, observed_at, is_forecast, source_id)
);

------------------------------------------------------------
-- 2. feature 層（縦持ちにして、列を増やさずに特徴量を追加できる）
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feature_definitions (
  feature_name     TEXT NOT NULL,
  feature_version  INTEGER NOT NULL,
  description      TEXT NOT NULL,
  available_at     TEXT NOT NULL,          -- 使用可能時点の説明
  leakage_risk     TEXT NOT NULL,
  source_tables    TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  PRIMARY KEY (feature_name, feature_version)
);

CREATE TABLE IF NOT EXISTS feature_values (
  race_id          INTEGER NOT NULL REFERENCES races(race_id),
  car_no           INTEGER NOT NULL,
  feature_name     TEXT NOT NULL,
  feature_version  INTEGER NOT NULL,
  as_of            TEXT NOT NULL,           -- 予測時点（通常は開催日 08:00）
  value            REAL,                    -- 計算できないときは NULL（推測で埋めない）
  max_input_time   TEXT,                    -- 計算に使った入力の中で最も新しい時刻
  leak_flags       TEXT,                    -- 許容した近似（例: backfilled_entries）。NULL なら近似なし
  computed_at      TEXT NOT NULL,
  PRIMARY KEY (race_id, car_no, feature_name, feature_version, as_of),
  FOREIGN KEY (feature_name, feature_version) REFERENCES feature_definitions(feature_name, feature_version)
);

------------------------------------------------------------
-- 3. prediction 層（結果テーブルとは別。結果は参照しない）
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
  model_id       INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  version        TEXT NOT NULL,
  train_start    TEXT NOT NULL,
  train_end      TEXT NOT NULL,             -- 学習に使ったレースの最終発走時刻
  feature_set    TEXT NOT NULL,             -- 使った特徴量名とバージョン（JSON）
  params_json    TEXT,
  trained_at     TEXT NOT NULL,
  UNIQUE (name, version)
);

CREATE TABLE IF NOT EXISTS predictions (
  model_id       INTEGER NOT NULL REFERENCES models(model_id),
  race_id        INTEGER NOT NULL REFERENCES races(race_id),
  bet_type       TEXT NOT NULL,
  combination    TEXT NOT NULL,
  prob           REAL NOT NULL,
  as_of          TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  PRIMARY KEY (model_id, race_id, bet_type, combination, as_of)
);

-- バックテストで「買った」記録。使ったオッズの取得時刻を残して監査できるようにする
CREATE TABLE IF NOT EXISTS backtest_runs (
  backtest_id    INTEGER PRIMARY KEY,
  model_id       INTEGER NOT NULL REFERENCES models(model_id),
  period_start   TEXT NOT NULL,
  period_end     TEXT NOT NULL,
  odds_basis     TEXT NOT NULL CHECK (odds_basis IN ('pre_0800','final_reference_only')),
  rule_json      TEXT,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backtest_bets (
  backtest_id       INTEGER NOT NULL REFERENCES backtest_runs(backtest_id),
  race_id           INTEGER NOT NULL REFERENCES races(race_id),
  bet_type          TEXT NOT NULL,
  combination       TEXT NOT NULL,
  stake_yen         INTEGER NOT NULL,
  as_of             TEXT NOT NULL,
  odds_retrieved_at TEXT,                  -- 判断に使ったオッズの取得時刻
  odds_used         REAL,
  PRIMARY KEY (backtest_id, race_id, bet_type, combination)
);

------------------------------------------------------------
-- 4. 監査用ビュー（行が出たら問題あり）
------------------------------------------------------------
-- 朝8時時点で使ってよいオッズ
CREATE VIEW IF NOT EXISTS v_odds_usable_0800 AS
SELECT o.* FROM odds_snapshots o
JOIN races r ON r.race_id = o.race_id
WHERE o.snapshot_kind = 'pre_0800'
  AND o.retrieved_at <= r.event_date || 'T08:00:00+09:00'
  AND o.retrieved_at <  r.race_start_time;

-- 特徴量の入力が予測時点より新しい
CREATE VIEW IF NOT EXISTS v_leak_features AS
SELECT * FROM feature_values
WHERE max_input_time IS NOT NULL AND max_input_time > as_of;

-- 近似を許した特徴量（WARNING として報告する）
CREATE VIEW IF NOT EXISTS v_warn_features AS
SELECT * FROM feature_values WHERE leak_flags IS NOT NULL;

-- 予測時点が発走時刻以降
CREATE VIEW IF NOT EXISTS v_leak_predictions AS
SELECT p.* FROM predictions p JOIN races r ON r.race_id = p.race_id
WHERE p.as_of >= r.race_start_time;

-- 学習期間と予測対象の重なり（学習に使ったレースを予測している）
CREATE VIEW IF NOT EXISTS v_leak_train_overlap AS
SELECT p.* FROM predictions p
JOIN models m ON m.model_id = p.model_id
JOIN races r ON r.race_id = p.race_id
WHERE r.race_start_time <= m.train_end;

-- バックテストで、予測時点より後のオッズや最終オッズを使った買い
CREATE VIEW IF NOT EXISTS v_leak_backtest_odds AS
SELECT b.* FROM backtest_bets b
JOIN backtest_runs t ON t.backtest_id = b.backtest_id
WHERE t.odds_basis = 'pre_0800'
  AND (b.odds_retrieved_at IS NULL
       OR b.odds_retrieved_at > b.as_of
       OR NOT EXISTS (SELECT 1 FROM odds_snapshots o
                      WHERE o.race_id = b.race_id AND o.bet_type = b.bet_type
                        AND o.combination = b.combination AND o.retrieved_at = b.odds_retrieved_at
                        AND o.snapshot_kind = 'pre_0800'));
