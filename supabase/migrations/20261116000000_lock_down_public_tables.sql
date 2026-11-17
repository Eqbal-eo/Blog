-- Lock down every table in the public schema.
--
-- Both apps talk to the database only from the server, with the secret
-- service_role key, which bypasses row level security. Nothing legitimate
-- uses the public anon key. Before this migration, anyone holding the anon
-- key could read every table, including the bcrypt hashes in the users table.
--
-- After this migration:
--   * RLS is on for every public table, with no policies, so anon and
--     authenticated get nothing.
--   * Any existing policies on those tables are dropped (an old "allow all"
--     policy would otherwise keep the hole open).
--   * anon and authenticated lose their table and sequence privileges, as a
--     second layer in case RLS is ever switched off on a table.
--   * Tables created later get the same treatment by default.
--
-- PREREQUISITE: deploy the code that uses SUPABASE_SERVICE_ROLE_KEY, and set
-- that variable everywhere the apps run (local .env files AND Vercel),
-- BEFORE running this. Otherwise the live site stops reading and writing data.
--
-- Run it in the Supabase dashboard: SQL Editor > New query > paste > Run.

begin;

do $$
declare
  t record;
  p record;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t.tablename
    loop
      execute format('drop policy %I on public.%I', p.policyname, t.tablename);
    end loop;

    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end
$$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

commit;

-- Check: every row should show rls_enabled = true and policies = 0.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;
