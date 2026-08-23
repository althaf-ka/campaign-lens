import { config } from "@campaign-lens/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["dist/**", "src/routeTree.gen.ts"],
  },
  ...config,
];
