import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "./supabase";
import { excerpt, sanitize } from "./sanitize";

export type PostSummary = {
  id: string;
  title: string;
  excerpt: string;
  category: string | null;
  createdAt: string;
  authorId: string;
  authorName: string;
};

export type Post = PostSummary & {
  /** Sanitized HTML, safe to render. */
  html: string;
};

export type Blogger = {
  id: string;
  name: string;
  bio: string | null;
  articlesCount: number;
  categories: string[];
};

export type Author = {
  id: string;
  name: string;
  bio: string | null;
  blogTitle: string | null;
  blogDescription: string | null;
  /** Sanitized HTML. */
  aboutHtml: string;
  /** Sanitized HTML. */
  contactHtml: string;
  email: string | null;
  posts: PostSummary[];
};

type UserRef = { username: string; display_name_ar: string | null } | null;

type PostRow = {
  id: string | number;
  title: string;
  content: string | null;
  category: string | null;
  created_at: string;
  user_id: string | number;
  users: UserRef | UserRef[];
};

const POST_COLUMNS =
  "id, title, content, category, created_at, user_id, users ( username, display_name_ar )";

function authorName(users: PostRow["users"]): string {
  const user = Array.isArray(users) ? users[0] : users;
  return user?.display_name_ar || user?.username || "كاتب مجهول";
}

function toSummary(row: PostRow): PostSummary {
  return {
    id: String(row.id),
    title: row.title,
    excerpt: excerpt(row.content),
    category: row.category,
    createdAt: row.created_at,
    authorId: String(row.user_id),
    authorName: authorName(row.users),
  };
}

/** Newest published posts, for the home page. */
export async function getLatestPosts(limit = 6): Promise<PostSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");

  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  return (data as PostRow[]).map(toSummary);
}

/** A single published post, or null when it does not exist or is not public. */
export async function getPost(id: string): Promise<Post | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", `post-${id}`);

  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  // An id of the wrong type (e.g. text for an integer column) is a 404, not a crash
  if (error || !data) return null;

  const row = data as PostRow;
  return { ...toSummary(row), html: sanitize(row.content) };
}

/** Every writer with their published post count and categories. */
export async function getBloggers(): Promise<Blogger[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", "users");

  const [users, posts] = await Promise.all([
    supabase.from("users").select("id, username, bio, display_name_ar"),
    supabase.from("posts").select("user_id, category").eq("status", "published"),
  ]);

  if (users.error) throw new Error(`Failed to load writers: ${users.error.message}`);
  if (posts.error) throw new Error(`Failed to load posts: ${posts.error.message}`);

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

  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, bio, display_name_ar")
    .eq("id", id)
    .maybeSingle();

  if (error || !user) return null;

  const [posts, settings] = await Promise.all([
    supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("user_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("settings")
      .select("blog_title, blog_description, about_text, contact_info, email")
      .eq("user_id", id)
      .maybeSingle(),
  ]);

  if (posts.error) throw new Error(`Failed to load posts: ${posts.error.message}`);

  return {
    id: String(user.id),
    name: user.display_name_ar || user.username,
    bio: user.bio || null,
    blogTitle: settings.data?.blog_title || null,
    blogDescription: settings.data?.blog_description || null,
    aboutHtml: sanitize(settings.data?.about_text),
    contactHtml: sanitize(settings.data?.contact_info),
    email: settings.data?.email || null,
    posts: (posts.data as PostRow[]).map(toSummary),
  };
}
