CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  work_mode TEXT NOT NULL DEFAULT 'Onsite',
  experience TEXT NOT NULL DEFAULT 'Fresher',
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  application_deadline DATE,
  -- random 6-digit reference code, allotted when a recruiter posts a job
  job_code TEXT,
  -- auth_sub of the recruiter who posted it
  posted_by TEXT
);

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_by TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_code TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT NOT NULL DEFAULT 'Full-time';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'Onsite';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience TEXT NOT NULL DEFAULT 'Fresher';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline DATE;
-- Superseded by salary_min/salary_max — a single free-text range can't be
-- filtered or sorted on.
ALTER TABLE jobs DROP COLUMN IF EXISTS salary;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('Applied', 'Interviewing', 'Offer', 'Rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- One row per candidate application to a specific job — job details and
-- applicant identity are looked up via job_id/candidate_sub rather than
-- duplicated here.
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_sub TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'Applied',
  applied_on DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_sub TEXT;
ALTER TABLE applications DROP COLUMN IF EXISTS company;
ALTER TABLE applications DROP COLUMN IF EXISTS role;
-- The table predates this file's CREATE TABLE ... DEFAULT clauses, so those
-- defaults never applied to the existing status/applied_on columns.
ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'Applied';
ALTER TABLE applications ALTER COLUMN applied_on SET DEFAULT CURRENT_DATE;

-- Enforced in the DB, not just checked in the route, so two near-simultaneous
-- "Apply" submissions can't race past a check-then-insert into two rows.
CREATE UNIQUE INDEX IF NOT EXISTS applications_job_candidate_unique
  ON applications (job_id, candidate_sub);

-- One row per logged-in person, keyed by their auth identity's `sub` — a
-- Cognito user pool sub, or "firebase:<uid>" for Google/GitHub sign-ins.
-- Candidate and recruiter fields share one table (nullable columns) since
-- a person is only ever one role and the two field sets never overlap.
DO $$ BEGIN
  CREATE TYPE profile_role AS ENUM ('candidate', 'recruiter');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  auth_sub TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role profile_role NOT NULL,

  -- candidate fields
  desired_role TEXT,
  location TEXT,
  experience TEXT,
  portfolio_url TEXT,
  skills TEXT,
  bio TEXT,
  resume_filename TEXT,

  -- recruiter fields
  company_name TEXT,
  job_title TEXT,
  company_website TEXT,
  company_size TEXT,
  industry TEXT,
  company_bio TEXT,
  company_logo_filename TEXT,

  -- profile picture, stored as a data: URL (no S3/object storage wired up
  -- yet) — fine at this scale, worth moving to real object storage later
  avatar_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Re-running this file against a database created before avatar_url existed
-- (CREATE TABLE IF NOT EXISTS won't retroactively add columns) should still
-- pick it up.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
