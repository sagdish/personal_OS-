// .env.local -> process.env. Keys only ever live here, never in os.yaml. Never overrides a
// variable that is already set.

import fs from "node:fs";
import path from "node:path";
import { OS_ROOT } from "./root.mjs";

export const ENV_FILE = path.join(OS_ROOT, ".env.local");

export function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  const out = {};
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
  return out;
}

/** Is a key present, without ever printing it. */
export const hasEnv = (name) => Boolean(process.env[name] ?? loadEnv()[name]);
