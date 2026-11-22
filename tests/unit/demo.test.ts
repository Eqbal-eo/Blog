import { afterEach, describe, expect, it, vi } from "vitest";
import { isClosedDemoAccount } from "@/lib/demo";

afterEach(() => vi.unstubAllEnvs());

describe("isClosedDemoAccount", () => {
  it("closes the demo account unless it is configured", () => {
    vi.stubEnv("DEMO_PASSWORD", "");
    expect(isClosedDemoAccount({ username: "demo" })).toBe(true);
  });

  it("opens the demo account once it is configured", () => {
    vi.stubEnv("DEMO_PASSWORD", "configured-for-this-test");
    expect(isClosedDemoAccount({ username: "demo" })).toBe(false);
  });

  it("never affects other accounts or visitors", () => {
    vi.stubEnv("DEMO_PASSWORD", "");
    expect(isClosedDemoAccount({ username: "writer" })).toBe(false);
    expect(isClosedDemoAccount(null)).toBe(false);
  });
});
