// Where the OS is. One answer for the CLI, the read and the page.
//
// Order: $OS_ROOT if set · this file's own location · the parent of the working directory · the
// working directory. Every candidate is checked for bin/os.mjs before it is accepted, because a
// bundler can move this file and a wrong root would make every surface read nothing.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const looksLikeRoot = (dir) =>
  fs.existsSync(path.join(dir, "bin", "os.mjs")) && fs.existsSync(path.join(dir, "_system", "core"));

function resolveRoot() {
  const candidates = [];
  if (process.env.OS_ROOT) candidates.push(path.resolve(process.env.OS_ROOT));
  try {
    candidates.push(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."));
  } catch {
    /* bundled: fall through */
  }
  candidates.push(path.resolve(process.cwd(), ".."), process.cwd());
  for (const c of candidates) if (looksLikeRoot(c)) return c;
  throw new Error(
    `Personal OS root not found. Tried:\n  ${candidates.join("\n  ")}\nSet OS_ROOT to the folder that holds bin/os.mjs.`,
  );
}

export const OS_ROOT = resolveRoot();

export const expandHome = (p) =>
  typeof p === "string" && p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;

/** OS-relative or absolute path -> absolute. */
export const abs = (p) => (path.isAbsolute(p) ? p : path.resolve(OS_ROOT, expandHome(p)));

export const STATE_DIR = abs("_system/state");
export const LOGS_DIR = abs("_system/logs");

/** Calendar decisions are machine-local: YYYY-MM-DD and HH:MM. Instants stay UTC. */
export const localDate = (d = new Date()) => d.toLocaleDateString("en-CA");
export const localTime = (d = new Date()) => d.toTimeString().slice(0, 5);

export function log(line) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.appendFileSync(path.join(LOGS_DIR, "os.log"), `${new Date().toISOString()} ${line}\n`);
}

/** Any log over 1 MB keeps one older generation. The tick calls this. */
export function rotateLogs(max = 1024 * 1024) {
  for (const name of fs.existsSync(LOGS_DIR) ? fs.readdirSync(LOGS_DIR) : []) {
    if (!name.endsWith(".log")) continue;
    const file = path.join(LOGS_DIR, name);
    try {
      if (fs.statSync(file).size > max) fs.renameSync(file, `${file}.1`);
    } catch {
      /* best effort */
    }
  }
}
