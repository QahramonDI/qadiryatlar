-- Qadriyatlar Kaledaskopi production storage schema.
-- Run this once in Supabase SQL Editor before deploying Render env variables.

create table if not exists public.app_data (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.works (
  id text primary key,
  title text,
  author text,
  grade integer,
  genre text,
  part integer,
  value_main text,
  summary text,
  moral text,
  full_text text,
  image_url text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audio_stories (
  id text primary key,
  title text not null,
  description text,
  audio_url text not null,
  work_id text,
  story_id text,
  duration integer not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_data_set_updated_at on public.app_data;
create trigger app_data_set_updated_at
before update on public.app_data
for each row execute function public.set_updated_at();

drop trigger if exists works_set_updated_at on public.works;
create trigger works_set_updated_at
before update on public.works
for each row execute function public.set_updated_at();

drop trigger if exists audio_stories_set_updated_at on public.audio_stories;
create trigger audio_stories_set_updated_at
before update on public.audio_stories
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'works',
  'works',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/wave', 'audio/ogg', 'audio/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
