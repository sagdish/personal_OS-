import path from "node:path";
import type { NextConfig } from "next";

// The workspace root is the OS folder, one level up: the page imports the machine's modules from
// `_system/core/` (the `@core/*` alias in tsconfig), and that is only allowed inside the root.
const root = path.resolve(process.cwd(), "..");

const config: NextConfig = {
  devIndicators: false,
  turbopack: { root },
  outputFileTracingRoot: root,
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default config;
