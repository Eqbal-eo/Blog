-- Optional one-sentence summary per post, written by the author (or picked
-- from the writing assistant's suggestion). Used for search engine
-- descriptions, link previews and the RSS feed; falls back to the opening
-- of the post when empty.
--
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.

alter table public.posts
  add column if not exists summary text
  check (summary is null or char_length(summary) <= 300);
