-- Reader and writer features: image storage, view counts, search, comments
-- and newsletter subscriptions.
--
-- Requires 20261117000000_rate_limits.sql (record_post_view uses it).
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.

begin;

-- ------------------------------------------------------------ image storage
-- Public bucket: anyone can read files by URL. Only the server (service
-- role) uploads, so no storage policies are needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -------------------------------------------------------------- view counts
alter table public.posts add column if not exists view_count integer not null default 0;
create index if not exists posts_view_count_idx on public.posts (view_count desc) where status = 'published';

-- Counts a view at most once per visitor per post every 6 hours.
-- p_visitor is a hash computed by the app; no IP address is stored.
create or replace function public.record_post_view(p_post_id bigint, p_visitor text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.hit_rate_limit('view:' || p_visitor || ':' || p_post_id, 21600, 1) then
    update public.posts
      set view_count = view_count + 1
      where id = p_post_id and status = 'published';
  end if;

  -- Occasional cleanup of expired rate-limit windows
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
end;
$$;

revoke execute on function public.record_post_view(bigint, text) from public, anon, authenticated;
grant execute on function public.record_post_view(bigint, text) to service_role;

-- ------------------------------------------------------------------ search
-- Arabic normalization so that "صلابة", "صلابةٌ" and "صلابه" all match:
-- strips diacritics and tatweel, unifies alef/yaa/taa marbuta forms.
-- The app applies the same rules to the query (src/lib/search.ts).
create or replace function public.normalize_ar(input text)
returns text
language sql
immutable
parallel safe
as $$
  select translate(
    regexp_replace(coalesce(input, ''), '[ً-ٰٟـ]', '', 'g'),
    'أإآٱىة',
    'اااايه'
  );
$$;

alter table public.posts drop column if exists search;
alter table public.posts add column search tsvector generated always as (
  setweight(to_tsvector('simple', public.normalize_ar(title)), 'A') ||
  setweight(
    to_tsvector(
      'simple',
      public.normalize_ar(
        regexp_replace(
          regexp_replace(coalesce(content, ''), 'data:[^"'' ]+', ' ', 'g'), -- embedded images
          '<[^>]+>|&[a-z]+;', ' ', 'g'                                       -- tags and entities
        )
      )
    ),
    'B'
  )
) stored;

create index if not exists posts_search_idx on public.posts using gin (search);

-- ---------------------------------------------------------------- comments
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 80),
  author_email text check (author_email is null or char_length(author_email) <= 200),
  body text not null check (char_length(body) between 2 and 3000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, status, created_at);
create index if not exists comments_pending_idx on public.comments (created_at) where status = 'pending';

alter table public.comments enable row level security;
revoke all on public.comments from anon, authenticated;

-- -------------------------------------------------------------- newsletter
-- author_id null = subscribed to every new post on the site;
-- otherwise only to that writer's posts.
create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  email text not null check (char_length(email) <= 200),
  author_id bigint references public.users (id) on delete cascade,
  token text not null unique,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists subscribers_email_author_idx
  on public.subscribers (lower(email), coalesce(author_id, 0));
create index if not exists subscribers_author_idx on public.subscribers (author_id) where confirmed_at is not null;

alter table public.subscribers enable row level security;
revoke all on public.subscribers from anon, authenticated;

commit;
