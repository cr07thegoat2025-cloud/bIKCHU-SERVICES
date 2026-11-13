-- Run this once in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text not null,
  email text not null,
  package text not null check (package in ('Basic','Advanced','Pro')),
  idea text not null,
  status text not null default 'New' check (status in ('New','Reviewing','Approved','In Progress','Completed','Declined')),
  ai_brief text,
  ai_quote text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.project_requests enable row level security;
-- No public policies: only server-side service-role API routes may access this table.
create index if not exists project_requests_created_at_idx on public.project_requests(created_at desc);
