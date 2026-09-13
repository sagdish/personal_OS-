// Doctor: the pollution check. Ten questions about the shape of the OS. A fault names the file and
// the fix; a warning is something to know, never a reason to stop.

import fs from "node:fs";
import path from "node:path";
import { OS_ROOT } from "./root.mjs";
import { OS_YAML, areas, areaDir, challenge, isSetUp, journalDir, journalFile, map, modules, practiceItems, provider } from "./map.mjs";
import { MANAGER, emptySections, missingHeadings, readPortrait } from "./portrait.mjs";
import { readRead } from "./state.mjs";
import * as schedule from "./schedule.mjs";
import { providerModule } from "./read.mjs";
import { loadEnv } from "./env.mjs";

export const FIXED_SKILLS = ["setup", "capture", "triage", "brief", "coach-off", "weekly"];

const ROOT_FILES = new Set([
  "README.md", "AGENTS.md", "CLAUDE.md", "SETUP.md", "BLUEPRINT.md", "LICENSE", "install.sh", "os.yaml", "MANAGER.md", "STATUS.md",
  "package.json", "package-lock.json", ".gitignore", ".env.local", ".DS_Store", ".gitattributes",
]);
const ROOT_DIRS = new Set(["areas", "journal", "app", "bin", "_system", ".claude", ".git", "node_modules", ".github"]);

export async function doctor() {
  const fails = [];
  const warns = [];
  const fail = (rule, msg, fix) => fails.push({ rule, msg, fix });
  const warn = (rule, msg, fix) => warns.push({ rule, msg, fix });
  const exists = (p) => fs.existsSync(p);
  loadEnv();

  // 6 · the root, checked even before setup: pollution is pollution.
  for (const e of fs.readdirSync(OS_ROOT, { withFileTypes: true })) {
    if (e.isDirectory() ? !ROOT_DIRS.has(e.name) : !ROOT_FILES.has(e.name)) {
      fail("root", `${e.name} does not belong at the root`, "move it into an area, the journal, or delete it. The root is the same for every OS.");
    }
  }

  if (!isSetUp()) {
    warn("setup", "os.yaml is missing: this OS is not set up yet", "run /setup in your AI, or `os apply` if _system/state/setup.yaml is already answered.");
    return { fails, warns };
  }

  // 1 · the map
  let m;
  try {
    m = map();
  } catch (e) {
    fail("map", `os.yaml does not parse: ${e.message}`, "fix the YAML, or re-run `os apply`.");
    return { fails, warns };
  }
  const list = areas();
  if (list.length < 1 || list.length > 5) fail("map", `${list.length} areas declared; the range is 1 to 5`, "edit os.yaml `areas:`. Adding a sixth means removing one.");
  const keys = new Set();
  for (const a of list) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(String(a.key ?? ""))) fail("map", `area key "${a.key}" is not a slug`, "lower-case letters, digits and hyphens.");
    if (keys.has(a.key)) fail("map", `area key "${a.key}" appears twice`, "keys must be unique.");
    keys.add(a.key);
    if (!String(a.label ?? "").trim()) fail("map", `area "${a.key}" has no label`, "give it a label in os.yaml.");
  }

  // 2 · the areas on disk
  for (const a of list) {
    const dir = areaDir(a);
    if (!exists(dir)) fail("areas", `areas/${a.key}/ is missing`, "`os apply` creates it.");
    else {
      if (!exists(path.join(dir, "index.yaml"))) fail("areas", `areas/${a.key}/index.yaml is missing`, "`os apply` writes it.");
      if (!exists(path.join(dir, "README.md"))) fail("areas", `areas/${a.key}/README.md is missing`, "`os apply` writes a skeleton; the words are yours.");
    }
  }
  const areasRoot = path.join(OS_ROOT, "areas");
  for (const e of exists(areasRoot) ? fs.readdirSync(areasRoot, { withFileTypes: true }) : []) {
    if (e.isDirectory() && !keys.has(e.name)) fail("areas", `areas/${e.name}/ is not declared in os.yaml`, "declare it (max 5), or move it out.");
  }

  // 3 · the portrait
  const portrait = readPortrait();
  if (portrait === null) fail("portrait", "MANAGER.md is missing", "run /setup, or `os apply` for the skeleton, then write it.");
  else {
    for (const h of missingHeadings(portrait)) fail("portrait", `MANAGER.md has no "${h}" section`, "add the heading exactly as written; the read and the coaches cut on it. `os apply` adds missing ones.");
    const empty = emptySections(portrait);
    if (empty.length) warn("portrait", `MANAGER.md sections still empty: ${empty.join(", ")}`, "write them, or finish /setup. Every voice speaks from them.");
  }

  // 4 · modules and the journal
  const mods = modules();
  if (!exists(journalDir())) warn("journal", `the journal folder is not reachable: ${journalDir()}`, "mount the disk, or fix `journal.path` in os.yaml. Nothing runs against it until then.");
  else {
    if (!exists(journalFile("inbox.md"))) warn("journal", "inbox.md is missing in the journal", "`os apply` creates it.");
    if (mods.wins && !exists(journalFile("wins.md"))) fail("modules", "wins is on but wins.md is missing", "`os apply` creates it, or turn the module off.");
    if (mods.goals && !exists(journalFile("goals.md"))) fail("modules", "goals is on but goals.md is missing", "`os apply` creates it, or turn the module off.");
    if (mods.challenge) {
      if (!exists(journalFile("challenge.md"))) fail("modules", "challenge is on but challenge.md is missing", "`os apply` creates it.");
      if (!String(challenge()?.name ?? "").trim()) fail("modules", "challenge is on but has no name in os.yaml", "give it a name, or turn it off.");
    }
    if (mods.weekly && !exists(journalFile("weeks"))) fail("modules", "weekly is on but journal/weeks/ is missing", "`os apply` creates it.");
  }
  if (mods.practice && !practiceItems().length) fail("modules", "practice is on but the list is empty", "add items under `practice:` in os.yaml, or turn it off.");

  // 5 · the commands
  const skills = path.join(OS_ROOT, ".claude", "skills");
  for (const s of FIXED_SKILLS) if (!exists(path.join(skills, s, "SKILL.md"))) fail("skills", `.claude/skills/${s}/SKILL.md is missing`, "restore it from the repo.");
  for (const a of list) if (!exists(path.join(skills, `coach-${a.key}`, "SKILL.md"))) fail("skills", `no coach for ${a.label} (.claude/skills/coach-${a.key}/SKILL.md)`, "`os apply` generates it.");
  for (const e of exists(skills) ? fs.readdirSync(skills) : []) {
    if (e.startsWith("coach-") && e !== "coach-off" && !keys.has(e.slice(6))) fail("skills", `.claude/skills/${e} belongs to no declared area`, "`os apply` removes it.");
  }
  if (!exists(path.join(OS_ROOT, "AGENTS.md"))) fail("agents", "AGENTS.md is missing", "`os apply` writes it. Every AI session reads it first.");

  // 7 · the read's surfaces
  const status = path.join(OS_ROOT, "STATUS.md");
  if (exists(status) && fs.statSync(status).size > 6000) fail("status", "STATUS.md is over 6 KB", "it is rendered from read.json; something is appending to it. Delete it; the next read rewrites it.");
  const read = readRead();
  if (read && typeof read?.judgment?.where !== "string") fail("read", "_system/state/read.json has no judgment", "delete it; the next read rewrites it.");

  // 9 · the provider
  try {
    const mod = await providerModule(provider().kind);
    if (!mod.ready()) warn("provider", `${mod.label}: ${mod.readiness()}`, "the read cannot run until this is fixed.");
  } catch (e) {
    fail("provider", e.message, "set `provider.kind` in os.yaml to claude-code, anthropic or openai-compatible.");
  }

  // 10 · the schedule
  const s = schedule.status();
  if (!s.installed) warn("schedule", s.note, "`os install`. Until then the read runs only when you run it.");

  return { fails, warns };
}

export function format({ fails, warns }) {
  const out = [];
  for (const f of fails) out.push(`  ✗ [${f.rule}] ${f.msg}\n      fix: ${f.fix}`);
  for (const w of warns) out.push(`  ! [${w.rule}] ${w.msg}\n      ${w.fix}`);
  if (!fails.length && !warns.length) out.push("  ✓ clean");
  else if (!fails.length) out.push(`  ✓ no faults (${warns.length} note${warns.length === 1 ? "" : "s"})`);
  return out.join("\n");
}
