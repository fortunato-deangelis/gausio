import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // Il marker "server-only" e next/headers non esistono fuori dal
      // runtime Next: nei test si usano stub equivalenti.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
      "next/headers": path.resolve(__dirname, "tests/stubs/next-headers.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
