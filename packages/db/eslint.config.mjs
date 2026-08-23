import { config } from "@campaign-lens/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["dist/**", "drizzle/**"],
  },
  ...config,
];
