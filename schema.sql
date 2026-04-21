-- EXTENSIONS
create extension if not exists "pgcrypto";

-- ==============================
-- CLEANUP (Run to avoid "already exists" errors)
-- ==============================
drop view if exists public.workers_with_age;
drop table if exists public.visit_logs cascade;
drop table if exists public.health_scores cascade;
drop table if exists public.lab_reports cascade;
drop table if exists public.prescriptions cascade;
drop table if exists public.health_records cascade;
drop table if exists public.doctors cascade;
drop table if exists public.nfc_tokens cascade;
drop table if exists public.workers cascade;
drop table if exists public.users cascade;

-- ==============================
-- USERS (extends Supabase Auth)
-- ==============================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('worker', 'doctor', 'admin')),
  full_name text,
  phone text,
  preferred_language text default 'en',
  created_at timestamptz default now()
);

-- ==============================
-- WORKERS
-- ==============================
create table public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,

  health_id text unique not null,
  date_of_birth date, Redesign the homepage content to make it more impactful, problem-focused, and easy to understand for real-world users.

Update content as follows:

1. Hero Section:
Heading:
"Healthcare that travels with every worker."

Subheading:
"Migrant workers often lose access to their medical history when they move. Our NFC-based system ensures their health records stay with them—anywhere, anytime."

Top Tagline:
"Built for real-world healthcare challenges"

Buttons:
- Get Started
- Explore Demo

2. Right Panel Content:
Title:
"Real-time care, wherever they go"

Points:
- Instant patient identification using NFC
- Access full medical history in seconds
- Update records from any location
- Track health risks and trends centrally

3. Problem Section (Add new section):
"Millions of migrant workers lose access to their medical history every time they relocate. This leads to repeated tests, delayed treatment, and poor healthcare outcomes."

4. Features Section:
NFC-first identity:
"One tap is all it takes. Instantly access a worker’s complete health record without manual entry or delays."

Role-based access:
"Workers, doctors, and administrators each get a tailored view—ensuring the right data reaches the right person."

Seamless workflow:
"From diagnosis to follow-ups, everything stays organized and accessible across locations."

Multilingual support:
"Designed for real users—supporting multiple languages for better understanding and usability."

5. User Roles Section:
Workers:
"View your health records, prescriptions, and updates anytime—no documents required."

Doctors:
"Tap, access, and update patient data instantly—no paperwork, no delays."

Administrators:
"Monitor health trends, risks, and system usage to make better decisions at scale."

6. Impact Line:
"One system. Continuous care. Better decisions."

Ensure clean spacing, proper padding, and responsive layout.
  gender text,
  blood_type text,

  bmi numeric(4,1),
  region text,
  occupation text,

  created_at timestamptz default now()
);

-- ==============================
-- NFC TOKENS
-- ==============================
create table public.nfc_tokens (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid unique references public.workers(id) on delete cascade,

  token text unique not null,
  is_active boolean default true,

  issued_at timestamptz default now(),
  last_used timestamptz
);

-- ==============================
-- DOCTORS
-- ==============================
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,

  license_number text unique not null,
  specialization text,
  hospital_name text,
  region text
);

-- ==============================
-- HEALTH RECORDS
-- ==============================
create table public.health_records (
  id uuid primary key default gen_random_uuid(),

  worker_id uuid references public.workers(id) on delete cascade,
  doctor_id uuid references public.doctors(id),

  visit_date timestamptz default now(),

  diagnosis text,
  icd10_code text,
  notes text,

  blood_pressure text,
  temperature numeric(4,1),
  weight numeric(5,1),

  created_at timestamptz default now()
);

-- ==============================
-- PRESCRIPTIONS
-- ==============================
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),

  record_id uuid references public.health_records(id) on delete cascade,
  worker_id uuid references public.workers(id),

  drug_name text not null,
  dosage text,
  frequency text,
  duration_days int,

  issued_at timestamptz default now(),
  is_active boolean default true
);

-- ==============================
-- LAB REPORTS
-- ==============================
create table public.lab_reports (
  id uuid primary key default gen_random_uuid(),

  worker_id uuid references public.workers(id),
  record_id uuid references public.health_records(id),

  report_type text,
  file_url text,

  uploaded_at timestamptz default now()
);

-- ==============================
-- HEALTH SCORES (AI READY)
-- ==============================
create table public.health_scores (
  id uuid primary key default gen_random_uuid(),

  worker_id uuid references public.workers(id) on delete cascade,

  score numeric(5,2),
  risk_level text check (risk_level in ('low', 'moderate', 'high', 'critical')),

  model_version text,
  features jsonb,
  recommendations text,

  computed_at timestamptz default now()
);

-- ==============================
-- VISIT LOGS (ANALYTICS)
-- ==============================
create table public.visit_logs (
  id uuid primary key default gen_random_uuid(),

  worker_id uuid references public.workers(id),
  doctor_id uuid references public.doctors(id),

  hospital_name text,
  region text,

  visited_at timestamptz default now(),
  nfc_used boolean default false
);

-- ==============================
-- VIEW (DYNAMIC AGE)
-- ==============================
create view public.workers_with_age as
select *,
  date_part('year', age(date_of_birth))::int as age
from public.workers;

-- ==============================
-- INDEXES (PERFORMANCE)
-- ==============================
create index idx_workers_user_id on public.workers(user_id);
create index idx_health_records_worker on public.health_records(worker_id);
create index idx_health_scores_worker on public.health_scores(worker_id);
create index idx_visit_logs_worker on public.visit_logs(worker_id);
create index idx_nfc_token on public.nfc_tokens(token);

-- ==============================
-- RLS ENABLE
-- ==============================
alter table public.users enable row level security;
alter table public.workers enable row level security;
alter table public.health_records enable row level security;
alter table public.prescriptions enable row level security;
alter table public.lab_reports enable row level security;
alter table public.health_scores enable row level security;
alter table public.visit_logs enable row level security;