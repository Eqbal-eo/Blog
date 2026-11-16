import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "./supabase";
import { excerpt, sanitize } from "./sanitize";
import { readingMinutes } from "./format";
import { normalizeArabic } from "./search";

export type PostSummary = {
  id: string;
  title: string;
  excerpt: string;
  category: string | null;
  createdAt: string;
  authorId: string;
  authorName: string;
  readingMinutes: number;
  viewCount: number;
};

export type Post = PostSummary & {
  /** Sanitized HTML, safe to render. */
  html: string;
  authorBio: string | null;
  authorAvatar: string | null;
  updatedAt: string | null;
};

export type Blogger = {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  articlesCount: number;
  categories: string[];
};

export type Author = {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  blogTitle: string | null;
  blogDescription: string | null;
  /** Sanitized HTML. */
  aboutHtml: string;
  /** Sanitized HTML. */
  contactHtml: string;
  email: string | null;
  posts: PostSummary[];
};

export type Paged<T> = { items: T[]; total: number; page: number; pageCount: number };

type UserRef = { username: string; display_name_ar: string | null; bio?: string | null } | null;

type PostRow = {
  id: string | number;
  title: string;
  content: string | null;
  category: string | null;
  created_at: string;
  updated_at?: string | null;
  user_id: string | number;
  view_count?: number | null;
  users: UserRef | UserRef[];
};

// view_count comes from supabase/migrations/20261118000000_reader_features.sql
const POST_COLUMNS =
  "id, title, content, category, created_at, updated_at, user_id, view_count, users ( username, display_name_ar, bio )";
// Fallback while that migration hasn't been run yet
const LEGACY_COLUMNS =
  "id, title, content, category, created_at, updated_at, user_id, users ( username, display_name_ar, bio )";

function author(users: PostRow["users"]) {
  return Array.isArray(users) ? users[0] : users;
}

function toSummary(row: PostRow): PostSummary {
  const user = author(row.users);
  return {
    id: String(row.id),
    title: row.title,
    excerpt: excerpt(row.content),
    category: row.category,
    createdAt: row.created_at,
    authorId: String(row.user_id),
    authorName: user?.display_name_ar || user?.username || "كاتب مجهول",
    readingMinutes: readingMinutes(row.content ?? ""),
    viewCount: row.view_count ?? 0,
  };
}

function isMissingColumn(error: { code?: string } | null) {
  // 42703 = undefined column (migration not run yet)
  return error?.code === "42703";
}

/** Published posts, newest first, optionally in one category. */
export async function getPublishedPosts({
  page = 1,
  pageSize = 12,
  category,
}: {
  page?: number;
  pageSize?: number;
  category?: string;
}): Promise<Paged<PostSummary>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");

  const from = (page - 1) * pageSize;
  const run = (columns: string) => {
    let query = supabase
      .from("posts")
      .select(columns, { count: "exact" })
      .eq("status", "published");
    if (category) query = query.eq("category", category);
    return query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  };

  let result = await run(POST_COLUMNS);
  if (isMissingColumn(result.error)) result = await run(LEGACY_COLUMNS);
  if (result.error) throw new Error(`Failed to load posts: ${result.error.message}`);

  const total = result.count ?? 0;
  return {
    items: (result.data as unknown as PostRow[]).map(toSummary),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Newest published posts, for the home page. */
export async function getLatestPosts(limit = 6): Promise<PostSummary[]> {
  return (await getPublishedPosts({ page: 1, pageSize: limit })).items;
}

/** Most viewed published posts. Empty until view counting is set up. */
export async function getMostReadPosts(limit = 5): Promise<PostSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", "views");

  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .gt("view_count", 0)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    if (!isMissingColumn(error)) console.error("Failed to load most read:", error.message);
    return [];
  }
  return (data as unknown as PostRow[]).map(toSummary);
}

/** A single published post, or null when it does not exist or is not public. */
export async function getPost(id: string): Promise<Post | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", `post-${id}`);

  if (!/^\d{1,12}$/.test(id)) return null;

  let result = await supabase.from("posts").select(POST_COLUMNS).eq("id", id).eq("status", "published").maybeSingle();
  if (isMissingColumn(result.error)) {
    result = await supabase.from("posts").select(LEGACY_COLUMNS).eq("id", id).eq("status", "published").maybeSingle();
  }
  if (result.error || !result.data) return null;

  const row = result.data as unknown as PostRow;
  const { data: settings } = await supabase
    .from("settings")
    .select("profile_image")
    .eq("user_id", row.user_id)
    .maybeSingle();

  return {
    ...toSummary(row),
    html: sanitize(row.content),
    authorBio: author(row.users)?.bio || null,
    authorAvatar: settings?.profile_image || null,
    updatedAt: row.updated_at ?? null,
  };
}

/** Every writer with their published post count and categories. */
export async function getBloggers(): Promise<Blogger[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", "users");

  const [users, posts, settings] = await Promise.all([
    supabase.from("users").select("id, username, bio, display_name_ar"),
    supabase.from("posts").select("user_id, category").eq("status", "published"),
    supabase.from("settings").select("user_id, profile_image"),
  ]);

  if (users.error) throw new Error(`Failed to load writers: ${users.error.message}`);
  if (posts.error) throw new Error(`Failed to load posts: ${posts.error.message}`);

  const avatars = new Map((settings.data ?? []).map((s) => [String(s.user_id), s.profile_image as string | null]));
  const byUser = new Map<string, { count: number; categories: Set<string> }>();
  for (const post of posts.data) {
    const key = String(post.user_id);
    const entry = byUser.get(key) ?? { count: 0, categories: new Set<string>() };
    entry.count += 1;
    if (post.category) entry.categories.add(post.category);
    byUser.set(key, entry);
  }

  return users.data
    .map((user) => {
      const stats = byUser.get(String(user.id));
      return {
        id: String(user.id),
        name: user.display_name_ar || user.username,
        bio: user.bio || null,
        avatar: avatars.get(String(user.id)) || null,
        articlesCount: stats?.count ?? 0,
        categories: stats ? [...stats.categories] : [],
      };
    })
    .sort((a, b) => b.articlesCount - a.articlesCount);
}

/** A writer's public profile and published posts. */
export async function getAuthor(id: string): Promise<Author | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", "users", `author-${id}`);

  if (!/^\d{1,12}$/.test(id)) return null;

  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, bio, display_name_ar")
    .eq("id", id)
    .maybeSingle();

  if (error || !user) return null;

  const postsQuery = (columns: string) =>
    supabase
      .from("posts")
      .select(columns)
      .eq("user_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false });

  const [postsResult, settings] = await Promise.all([
    postsQuery(POST_COLUMNS),
    supabase
      .from("settings")
      .select("blog_title, blog_description, about_text, contact_info, email, profile_image")
      .eq("user_id", id)
      .maybeSingle(),
  ]);

  let posts = postsResult;
  if (isMissingColumn(posts.error)) posts = await postsQuery(LEGACY_COLUMNS);
  if (posts.error) throw new Error(`Failed to load posts: ${posts.error.message}`);

  return {
    id: String(user.id),
    name: user.display_name_ar || user.username,
    bio: user.bio || null,
    avatar: settings.data?.profile_image || null,
    blogTitle: settings.data?.blog_title || null,
    blogDescription: settings.data?.blog_description || null,
    aboutHtml: sanitize(settings.data?.about_text),
    contactHtml: sanitize(settings.data?.contact_info),
    email: settings.data?.email || null,
    posts: (posts.data as unknown as PostRow[]).map(toSummary),
  };
}

/**
 * Full-text search over published posts (title weighted above content).
 * Uses the `search` column from the reader features migration.
 */
export async function searchPosts(
  query: string,
  page = 1,
  pageSize = 12,
): Promise<Paged<PostSummary> & { unavailable?: boolean }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");

  const terms = normalizeArabic(query);
  if (!terms) return { items: [], total: 0, page, pageCount: 1 };

  const from = (page - 1) * pageSize;
  const { data, count, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .textSearch("search", terms, { config: "simple", type: "websearch" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("Search failed:", error.message);
    return { items: [], total: 0, page, pageCount: 1, unavailable: true };
  }

  const total = count ?? 0;
  return {
    items: (data as unknown as PostRow[]).map(toSummary),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Published post ids and dates, for the sitemap and RSS feed. */
export async function getPostIndex(limit = 5000) {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, content, category, created_at, updated_at, user_id, users ( username, display_name_ar )")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load post index: ${error.message}`);

  return (data as unknown as PostRow[]).map((row) => ({
    ...toSummary(row),
    updatedAt: row.updated_at ?? row.created_at,
  }));
}
