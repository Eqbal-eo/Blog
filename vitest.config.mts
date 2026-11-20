import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@/": `${root}src/`,
      // "server-only" throws outside the React Server environment; the
      // functions under test are plain server code, so stub the marker out
      "server-only": `${root}tests/stubs/server-only.ts`,
    },
  },
});
