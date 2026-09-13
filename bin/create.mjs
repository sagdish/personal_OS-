#!/usr/bin/env node
// npx personal-os [folder] — put a fresh Personal OS in a folder and install its packages.
// The same files as the git repo and the zip; this copies them out of the npm package.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2];
if (arg === "-h" || arg === "--help") {
  console.log("usage: npx personal-os [folder]    default folder: ./personal-os");
  process.exit(0);
}
const target = path.resolve(arg ?? "personal-os");

const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  console.error(`Personal OS needs Node 20 or newer. This is ${process.versions.node}.`);
  process.exit(1);
}
if (fs.existsSync(target) && fs.readdirSync(target).length) {
  console.error(`${target} exists and is not empty. Pick another folder.`);
  process.exit(1);
}

const SKIP = new Set(["node_modules", ".git", ".next", "BLUEPRINT.md", ".DS_Store", "package-lock.json"]);
const EMPTY = new Set([path.join("_system", "state"), path.join("_system", "logs")]);

function copy(from, to, rel = "") {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const r = rel ? path.join(rel, e.name) : e.name;
    const src = path.join(from, e.name);
    // npm renames .gitignore to .npmignore inside a package; put it back.
    const dst = path.join(to, e.name === ".npmignore" && !fs.existsSync(path.join(from, ".gitignore")) ? ".gitignore" : e.name);
    if (e.isDirectory()) {
      if (EMPTY.has(r)) {
        fs.mkdirSync(dst, { recursive: true });
        fs.writeFileSync(path.join(dst, ".gitkeep"), "");
        continue;
      }
      copy(src, dst, r);
    } else {
      fs.copyFileSync(src, dst);
    }
  }
}

copy(PKG, target);
for (const f of ["os", "os.mjs", "create.mjs"]) {
  try {
    fs.chmodSync(path.join(target, "bin", f), 0o755);
  } catch {
    /* windows */
  }
}

console.log(`\nPersonal OS copied to ${target}\ninstalling the machine's packages (a few seconds)…`);
const r = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], {
  cwd: target,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (r.status !== 0) console.error("npm install failed. Run `npm install` inside the folder, then continue.");

console.log(`
Done. Next:

  cd "${target}"
  node bin/os.mjs install

then open your AI in that folder and type /setup (Claude Code), or tell it
"open SETUP.md and follow it". One question at a time, about ten minutes.
`);
