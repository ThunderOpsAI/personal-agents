import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [".."],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
    testTimeout: 15000,
    include: ["**/*.test.ts", "**/*.test.tsx", "../agent/**/*.test.ts"],
  },
});
