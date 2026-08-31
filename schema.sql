CREATE TABLE IF NOT EXISTS officers (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  kattis_username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  kattis_rank INTEGER,
  kattis_score NUMERIC,
  verified BOOLEAN NOT NULL DEFAULT false,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS point_entries (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  awarded_by INTEGER REFERENCES officers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
