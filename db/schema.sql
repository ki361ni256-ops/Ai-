-- 競輪予想AI SQLite スキーマ（STEP 3 設計。データ取得は未実施）
-- 時刻はすべて ISO 8601・タイムゾーン付き（例: 2026-10-09T07:58:12+09:00）の TEXT で保存する

PRAGMA foreign_keys = ON;

-- データ提供元と、規約・robots.txt の確認記録
CREATE TABLE IF NOT EXISTS sources (
  source_id        INTEGER PRIMARY KEY,
  name             TEXT NOT NULL UNIQUE,
  base_url         TEXT NOT NULL,
  terms_checked_at TEXT,            -- 利用規約を確認した日時（未確認なら NULL）
  robots_checked_at TEXT,           -- robots.txt を確認した日時
  auto_fetch_allowed INTEGER,       -- 1=許可を確認 / 0=禁止 / NULL=未確認（NULL の間は取得しない）
  notes            TEXT
);

-- 競輪場（静的情報。値ごとに出典を持つ）
CREATE TABLE IF NOT EXISTS velodromes (
  velodrome_id     INTEGER PRIMARY KEY,
  name             TEXT NOT NULL UNIQUE,
  track_length_m   INTEGER,          -- 周長
  home_straight_m  REAL,             -- みなし直線距離
  cant_text        TEXT,             -- カント（表記揺れがあるため原文のまま）
  source_url       TEXT,
  confirmed_at     TEXT
);

-- 開催（グレードは級班とは別の軸）
CREATE TABLE IF NOT EXISTS meets (
  meet_id          INTEGER PRIMARY KEY,
  velodrome_id     INTEGER NOT NULL REFERENCES velodromes(velodrome_id),
  start_date       TEXT NOT NULL,
  end_date         TEXT,
  grade            TEXT,             -- GP/G1/G2/G3/F1/F2 など。公式で確認できない間は 'unverified'
  grade_source_url TEXT
);

-- レース（S級かどうかは grade とは別カラム）
CREATE TABLE IF NOT EXISTS races (
  race_id          INTEGER PRIMARY KEY,
  meet_id          INTEGER NOT NULL REFERENCES meets(meet_id),
  race_date        TEXT NOT NULL,
  race_no          INTEGER NOT NULL,
  class_tier       TEXT,             -- 'S' / 'A' など級班の区分（公式表記を確認して入れる）
  race_name        TEXT,
  num_riders       INTEGER,
  UNIQUE (meet_id, race_date, race_no)
);

-- 発走時刻（変更履歴を残す）
CREATE TABLE IF NOT EXISTS race_start_times (
  race_id          INTEGER NOT NULL REFERENCES races(race_id),
  race_start_time  TEXT NOT NULL,    -- 発走予定時刻
  fetched_at       TEXT NOT NULL,    -- この発走時刻を取得した時刻
  source_id        INTEGER REFERENCES sources(source_id),
  PRIMARY KEY (race_id, fetched_at)
);

-- 出走表（取得時点ごとのスナップショット）
CREATE TABLE IF NOT EXISTS entries (
  race_id          INTEGER NOT NULL REFERENCES races(race_id),
  car_no           INTEGER NOT NULL,
  frame_no         INTEGER,
  rider_id         TEXT,             -- 公式の登録番号など。推測で作らない
  rider_name       TEXT,
  raw_json         TEXT,             -- 公式項目は原文のまま保持し、確認済みの項目だけ列にする
  fetched_at       TEXT NOT NULL,
  source_timestamp TEXT,             -- 提供元が示す更新時刻（なければ NULL）
  source_id        INTEGER REFERENCES sources(source_id),
  PRIMARY KEY (race_id, car_no, fetched_at)
);

-- オッズ（値・賭式・取得時刻・発走時刻を必ずセットで保存）
CREATE TABLE IF NOT EXISTS odds (
  race_id          INTEGER NOT NULL REFERENCES races(race_id),
  odds_type        TEXT NOT NULL CHECK (odds_type IN
                     ('2車単','2車複','3連単','3連複','ワイド','2枠単','2枠複')),  -- 単勝は存在しないので入れない
  combination      TEXT NOT NULL,    -- 例: '1-3', '1-3-5'
  odds_value       REAL,             -- ワイドの幅は odds_value_max と組で持つ
  odds_value_max   REAL,
  odds_timestamp   TEXT NOT NULL,    -- オッズを取得した時刻
  source_timestamp TEXT,             -- 提供元が示すオッズの時点（なければ NULL）
  race_start_time  TEXT NOT NULL,    -- 取得時点で把握していた発走予定時刻
  source_id        INTEGER REFERENCES sources(source_id),
  PRIMARY KEY (race_id, odds_type, combination, odds_timestamp)
);

-- 結果と払戻
CREATE TABLE IF NOT EXISTS results (
  race_id          INTEGER NOT NULL REFERENCES races(race_id),
  car_no           INTEGER NOT NULL,
  finish_pos       INTEGER,
  raw_json         TEXT,             -- 上り等は定義確認後に列へ
  result_confirmed_at TEXT,          -- 結果確定時刻（不明なら NULL）
  fetched_at       TEXT NOT NULL,
  PRIMARY KEY (race_id, car_no)
);

CREATE TABLE IF NOT EXISTS payouts (
  race_id          INTEGER NOT NULL REFERENCES races(race_id),
  odds_type        TEXT NOT NULL,
  combination      TEXT NOT NULL,
  payout_yen       INTEGER NOT NULL, -- 100円あたり
  fetched_at       TEXT NOT NULL,
  PRIMARY KEY (race_id, odds_type, combination)
);

-- 取得ログ（失敗も残す）
CREATE TABLE IF NOT EXISTS fetch_log (
  log_id           INTEGER PRIMARY KEY,
  url              TEXT NOT NULL,
  requested_at     TEXT NOT NULL,
  status           TEXT NOT NULL,    -- ok / http_error / blocked / skipped_duplicate など
  http_code        INTEGER,
  attempt          INTEGER NOT NULL DEFAULT 1,
  message          TEXT
);

-- 朝8時時点で使ってよいオッズだけを返すビュー
-- 取得時刻が当日 08:00 JST 以前、かつ発走前のものだけ。取得時刻のない行はここに出ない
CREATE VIEW IF NOT EXISTS odds_as_of_0800 AS
SELECT o.*
FROM odds o
JOIN races r ON r.race_id = o.race_id
WHERE o.odds_timestamp IS NOT NULL
  AND o.odds_timestamp <= r.race_date || 'T08:00:00+09:00'
  AND o.odds_timestamp <  o.race_start_time;
