-- Fixed-window rate limiter used by the login, registration and blog request
-- forms. On serverless hosting an in-memory counter resets with every new
-- instance, so the counter lives in Postgres instead.
--
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

-- Same lockdown as every other table: server (service_role) only.
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Counts one hit for `p_key` and returns true while the caller is still
-- within `p_max` hits for the current window of `p_window_seconds`.
create or replace function public.hit_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_hits integer;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set
      hits = case
        when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
        else rl.hits + 1
      end,
      window_start = case
        when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
        else rl.window_start
      end
  returning hits into current_hits;

  return current_hits <= p_max;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- Old windows are useless; keep the table small.
delete from public.rate_limits where window_start < now() - interval '1 day';
