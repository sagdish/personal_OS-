#!/usr/bin/env node
// os — the one command.
//
//   os                 start the page and open it (installs and builds on first run)
//   os stop            stop the page
//   os status          what is up, what is down, your areas and commands. --brief prints STATUS.md
//   os doctor          the pollution check. Red is a real fault. --warn never fails
//   os read            the read, now. --dry-run shows what it would send, free. --force skips the cooldown
//   os tick            what the schedule runs every 30 minutes
//   os apply           build the structure from the setup answers (_system/state/setup.yaml)
//   os install         the schedule and the `os` alias. --uninstall removes both
//   os inbox sort      move the dock into the inbox tree now. `os inbox list [days]` prints entries
//   os portrait <key>  who the user is, for one voice: an area key, or `all`
//   os win "<text>"    append one line to wins.md, verbatim
//   os file <id> <to>  copy one inbox entry to wins | goals | challenge (goals: add the area key)
//
// This file only makes sure the one dependency is installed, then hands over to _system/core/cli.mjs.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  console.error(`Personal OS needs Node 20 or newer. This is ${process.versions.node}.`);
  process.exit(1);
}

if (!fs.existsSync(path.join(ROOT, "node_modules", "yaml"))) {
  console.log("first run: installing the machine's packages (a few seconds)…");
  const r = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error("npm install failed. Fix the error above and run this again.");
    process.exit(1);
  }
}

const { main } = await import("../_system/core/cli.mjs");
main(process.argv.slice(2)).catch((e) => {
  console.error(`os: ${e.message}`);
  process.exit(1);
});
