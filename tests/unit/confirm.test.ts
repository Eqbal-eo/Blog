import { beforeEach, describe, expect, it, vi } from "vitest";

// One subscriber row, enough of the query builder for confirmSubscription
let row: { token: string; confirmed_at: string | null } | null = null;

function table() {
  let change: { confirmed_at: string } | null = null;
  let token = "";
  const query = {
    update: (values: { confirmed_at: string }) => ((change = values), query),
    eq: (_column: string, value: string) => ((token = value), query),
    is: () => query,
    select: () => {
      if (!change) return query;
      if (row?.token !== token || row.confirmed_at) return Promise.resolve({ data: [] });
      row.confirmed_at = change.confirmed_at;
      return Promise.resolve({ data: [{ id: 1 }] });
    },
    maybeSingle: async () => ({ data: row?.token === token ? row : null }),
  };
  return query;
}

vi.mock("@/lib/supabase", () => ({ supabase: { from: table } }));
vi.mock("@/lib/newsletter", () => ({ subscribe: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/visitor", () => ({ visitorKey: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));

const { confirmSubscription } = await import("@/app/newsletter/actions");

const TOKEN = "t".repeat(32);

beforeEach(() => {
  row = { token: TOKEN, confirmed_at: null };
});

describe("confirmSubscription", () => {
  it("confirms a subscription", async () => {
    await expect(confirmSubscription(TOKEN)).rejects.toThrow("done=1");
    expect(row?.confirmed_at).toBeTruthy();
  });

  it("is still a success when pressed again", async () => {
    await expect(confirmSubscription(TOKEN)).rejects.toThrow("done=1");
    const first = row?.confirmed_at;

    await expect(confirmSubscription(TOKEN)).rejects.toThrow("done=1");
    expect(row?.confirmed_at).toBe(first);
  });

  it("rejects a link that matches no subscription", async () => {
    await expect(confirmSubscription("x".repeat(32))).rejects.toThrow("done=0");
  });
});
