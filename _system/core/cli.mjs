// The commands behind `os`. bin/os.mjs hands over here once the packages are installed.

import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { OS_ROOT, STATE_DIR, LOGS_DIR, localDate, log, rotateLogs } from "./root.mjs";
import { loadEnv } from "./env.mjs";
import { appPort, areas, isSetUp, journalDir, modules, osName, provider, rhythm } from "./map.mjs";
import { callsToday, readMachine, updateMachine } from "./state.mjs";
import { appendToDock, dockCount, recentEntries, sortDock } from "./inbox.mjs";
import { appendWin } from "./journal.mjs";
import { slice as portraitSlice } from "./portrait.mjs";
import { doctor, format as formatDoctor } from "./doctor.mjs";
import { STATUS, fileEntry, providerModule, readDue, runRead } from "./read.mjs";
import { apply } from "./setup.mjs";
import * as schedule from "./schedule.mjs";

const APP = path.join(OS_ROOT, "app");
const PID = path.join(STATE_DIR, "app.pid");
const B = process.stdout.isTTY ? "\x1b[1m" : "";
const D = process.stdout.isTTY ? "\x1b[2m" : "";
const R = process.stdout.isTTY ? "\x1b[0m" : "";
const say = (s = "") => console.log(s);
const good = (s) => say(`  ✓ ${s}`);
const bad = (s) => say(`  ✗ ${s}`);
const step = (s) => say(`  ${D}·${R} ${s}`);

const NOT_SET_UP = `
${B}Personal OS${R} is not set up yet.

  1. Open your AI in this folder.
       Claude Code:   run ${B}claude${R} here, then type ${B}/setup${R}
       another tool:  tell it "open SETUP.md and follow it"
  2. Answer the questions, one at a time. About ten minutes.

The page starts on its own when setup ends.
`;

// ---- the page ----------------------------------------------------------------------------------

function portUp(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host: "127.0.0.1" });
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
  });
}

const npm = (args, cwd) => spawnSync("npm", args, { cwd, stdio: "inherit", shell: process.platform === "win32" });

function ensureAppDeps() {
  if (fs.existsSync(path.join(APP, "node_modules", "next", "package.json"))) return true;
  step("installing the page's packages (first run, one to two minutes)…");
  const r = npm(["install", "--no-audit", "--no-fund", "--loglevel=error"], APP);
  if (r.status !== 0) { bad("npm install failed in app/. See the error above."); return false; }
  good("page packages installed");
  return true;
}

const newest = (dir) => {
  let m = 0;
  const walk = (d) => {
    for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else m = Math.max(m, fs.statSync(p).mtimeMs);
    }
  };
  walk(dir);
  return m;
};

function buildApp() {
  const buildId = path.join(APP, ".next", "BUILD_ID");
  // The page bundles the machine's modules, so a change under _system/core needs a rebuild too.
  const sources = [...["app", "components", "lib"].map((d) => path.join(APP, d)), path.join(OS_ROOT, "_system", "core")];
  const stale = !fs.existsSync(buildId) || sources.some((d) => newest(d) > fs.statSync(buildId).mtimeMs);
  if (!stale) return true;
  step("building the page (about a minute)…");
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const out = fs.openSync(path.join(LOGS_DIR, "app.log"), "a");
  const r = spawnSync(process.execPath, [path.join(APP, "node_modules", "next", "dist", "bin", "next"), "build"], {
    cwd: APP, stdio: ["ignore", out, out], env: { ...process.env, OS_ROOT },
  });
  fs.closeSync(out);
  if (r.status !== 0) { bad(`the page failed to build. See ${path.relative(OS_ROOT, path.join(LOGS_DIR, "app.log"))}.`); return false; }
  good("page built");
  return true;
}

async function startApp() {
  const port = appPort();
  if (await portUp(port)) { step(`page already running on :${port}`); return true; }
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const out = fs.openSync(path.join(LOGS_DIR, "app.log"), "a");
  // Bound to localhost on purpose: the page can edit your files. Your phone reaches the journal
  // through Obsidian, not through this page.
  const child = spawn(process.execPath, [path.join(APP, "node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: APP, detached: true, stdio: ["ignore", out, out], env: { ...process.env, OS_ROOT },
  });
  child.unref();
  fs.writeFileSync(PID, String(child.pid));
  for (let i = 0; i < 60; i++) {
    if (await portUp(port)) { good(`page on http://localhost:${port}`); return true; }
    await new Promise((r) => setTimeout(r, 500));
  }
  bad(`the page did not come up on :${port} within 30s. See _system/logs/app.log`);
  return false;
}

function openBrowser(url) {
  const cmd = process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  try { spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).unref(); } catch { /* fine */ }
}

async function stopApp() {
  const port = appPort();
  let pid = null;
  try { pid = Number(fs.readFileSync(PID, "utf8")); } catch { /* none */ }
  if (pid) {
    try { process.kill(process.platform === "win32" ? pid : -pid); } catch { try { process.kill(pid); } catch { /* gone */ } }
    fs.rmSync(PID, { force: true });
  }
  if (process.platform !== "win32") {
    const r = spawnSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
    for (const p of (r.stdout || "").split("\n").filter(Boolean)) { try { process.kill(Number(p)); } catch { /* gone */ } }
  }
  await new Promise((r) => setTimeout(r, 500));
  if (await portUp(port)) bad(`something still listens on :${port}`); else good("page stopped");
}

// ---- commands ----------------------------------------------------------------------------------

async function cmdStart(flags) {
  say(`\n${B}${isSetUp() ? osName() : "Personal OS"}${R} ${D}— ${OS_ROOT}${R}\n`);
  if (!ensureAppDeps()) process.exit(1);
  if (!isSetUp()) { say(NOT_SET_UP); return; }
  if (!buildApp()) process.exit(1);
  const up = await startApp();
  const d = await doctor();
  say(formatDoctor(d));
  if (up && !flags.has("--no-open")) openBrowser(`http://localhost:${appPort()}`);
  say("");
  say(`  page      ${B}http://localhost:${appPort()}${R}`);
  say(`  your AI   run ${B}claude${R} in this folder (or your own tool) and type /coach-<area>, /capture, /brief`);
  say(`  stop      ${B}os stop${R}\n`);
}

async function cmdStatus(flags) {
  if (flags.has("--brief")) return cmdBrief();
  say(`\n${B}${isSetUp() ? osName() : "Personal OS"}${R} ${D}— ${OS_ROOT}${R}\n`);
  if (!isSetUp()) { say(NOT_SET_UP); return; }
  const port = appPort();
  (await portUp(port)) ? good(`page on http://localhost:${port}`) : bad(`page down.  fix: os`);
  const s = schedule.status();
  s.installed ? good(`schedule: ${s.note}`) : bad(`schedule: ${s.note}`);
  const prov = provider();
  try {
    const mod = await providerModule(prov.kind);
    mod.ready() ? good(`read via ${mod.label}${prov.model ? ` (${prov.model})` : ""}`) : bad(`read via ${mod.label}: ${mod.readiness()}`);
  } catch (e) { bad(e.message); }
  const m = readMachine();
  const last = m.last_read_at ? new Date(m.last_read_at).toLocaleString() : "never";
  step(`last read: ${last} · calls today: ${callsToday(m)} of ${prov.max_calls_per_day} · next: ${rhythm().read_at} daily${m.paused ? " · PAUSED" : ""}`);
  step(`journal: ${journalDir()}${dockCount() ? ` · ${dockCount()} in the dock` : ""}`);
  say(`\n${B}doctor${R}`);
  say(formatDoctor(await doctor()));
  say(`\n${B}your setup${R}`);
  for (const a of areas()) step(`${a.label.padEnd(18)} /coach-${a.key}${a.moving ? `   ${D}${a.moving}${R}` : ""}`);
  const mods = modules();
  step(`modules: ${Object.keys(mods).filter((k) => mods[k]).join(", ") || "none"}`);
  step(`commands: /setup /capture /triage /brief ${areas().map((a) => `/coach-${a.key}`).join(" ")} /coach-off${mods.weekly ? " /weekly" : ""}`);
  say("");
}

/** For the session-start hook: STATUS.md's body, short. */
function cmdBrief() {
  if (!isSetUp()) { say("Personal OS: not set up yet. Run /setup (it reads SETUP.md), one question at a time."); return; }
  if (!fs.existsSync(STATUS)) { say(`${osName()}: no read yet. \`node bin/os.mjs read\` runs it.`); return; }
  const body = fs.readFileSync(STATUS, "utf8").replace(/^---[\s\S]*?---\n/, "").trim().split("\n").slice(0, 40).join("\n");
  say(body);
  const n = dockCount();
  if (n) say(`\n${n} entr${n === 1 ? "y" : "ies"} in the dock, not yet read.`);
}

async function cmdDoctor(flags) {
  const d = await doctor();
  say(formatDoctor(d));
  if (d.fails.length && !flags.has("--warn")) process.exit(1);
}

async function cmdRead(flags) {
  try {
    const r = await runRead({ manual: true, force: flags.has("--force"), dryRun: flags.has("--dry-run") });
    if (r.dryRun) {
      say(`--- system prompt (MANAGER.md, ${r.system.length} chars) ---\n${r.system}\n--- prompt (${r.prompt.length} chars) ---\n${r.prompt}`);
      say(`\n(dry run: nothing was sent, nothing was written)`);
      return;
    }
    say(`read written: STATUS.md and the journal's reads/ · ${r.read.cost_usd != null ? `$${r.read.cost_usd.toFixed(3)}` : "cost unknown"}${r.filed.length ? ` · filed ${r.filed.map((f) => f.to).join(", ")}` : ""}`);
  } catch (e) {
    if (e.soft) { say(e.message); return; }
    throw e;
  }
}

async function cmdTick() {
  rotateLogs();
  if (!isSetUp()) return;
  try { const { moved } = sortDock(); if (moved) log(`tick: sorted ${moved} inbox entr${moved === 1 ? "y" : "ies"}`); } catch (e) { log(`tick: inbox sort failed: ${e.message}`); }
  updateMachine((m) => ({ ...m, last_tick_at: new Date().toISOString() }));
  if (!readDue()) return;
  try {
    const r = await runRead({ manual: false });
    say(`tick: read done${r.read.cost_usd != null ? ` $${r.read.cost_usd.toFixed(3)}` : ""}`);
  } catch (e) {
    if (!e.soft) log(`tick: ${e.message}`);
    say(`tick: ${e.message}`);
  }
}

function cmdApply() {
  const { answers, done } = apply();
  say(`applied for ${answers.os_name}:\n  ${done.join("\n  ")}`);
  say(`\nnext: write the words into MANAGER.md and each area's README.md, then \`os doctor\`, \`os read\`, \`os install\`, \`os\`.`);
}

/** The install: the packages, the `os` alias, and, once the OS is set up, the schedule. */
function cmdInstall(flags) {
  if (flags.has("--uninstall")) {
    say(schedule.uninstall());
    const a = schedule.uninstallAlias();
    if (a) say(a);
    return;
  }
  say(`\n${B}Personal OS${R} ${D}— ${OS_ROOT}${R}\n`);
  if (!ensureAppDeps()) process.exit(1);
  good("packages installed");
  if (!flags.has("--no-alias")) good(schedule.installAlias());
  if (!isSetUp()) {
    step("the schedule is installed at the end of setup");
    say(NOT_SET_UP);
    return;
  }
  good(schedule.install({ yes: flags.has("--yes") }));
  say("");
}

function cmdInbox(args) {
  const [sub = "list", n] = args;
  if (sub === "sort") { const { moved } = sortDock(); say(`sorted ${moved} entr${moved === 1 ? "y" : "ies"} into the inbox tree.`); return; }
  const days = Number(n || 14);
  const entries = recentEntries(days);
  if (!entries.length) say(`nothing in the inbox tree for the last ${days} days.`);
  for (const e of entries) say(`${e.id}  ${e.date} ${e.time}  ${e.filed ? `[${e.filed.to}] ` : ""}${e.text.replace(/\n/g, " / ")}`);
  const d = dockCount();
  if (d) say(`\n${d} still in the dock: \`os inbox sort\` moves them.`);
}

const HELP = `os — the one command

  os                  start the page and open it (installs and builds on first run; --no-open skips the browser)
  os stop             stop the page
  os status           what is up, what is down, your areas and commands  (--brief: STATUS.md)
  os doctor           the pollution check. Red is a real fault  (--warn never fails)
  os read             the read, now  (--dry-run shows what it would send, free · --force skips the cooldown)
  os tick             what the schedule runs every 30 minutes
  os apply            build the structure from the setup answers
  os install          the packages, the os alias and, once set up, the schedule  (--uninstall · --yes adds the cron line on Linux · --no-alias)
  os inbox sort       move the dock into the inbox tree now.  os inbox list [days] prints entries with ids
  os capture "text"   append to the dock, verbatim, stamped
  os portrait <key>   who the user is, for one voice: an area key, or all
  os win "text"       append one line to wins.md, verbatim
  os file <id> <to>   copy one inbox entry to wins | goals | challenge  (goals: add the area key)
`;

export async function main(argv) {
  loadEnv();
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const cmd = argv.find((a) => !a.startsWith("--")) ?? "start";
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const args = argv.filter((a) => !a.startsWith("--")).slice(1);
  switch (cmd) {
    case "start": return cmdStart(flags);
    case "stop": return stopApp();
    case "status": return cmdStatus(flags);
    case "doctor": return cmdDoctor(flags);
    case "read": return cmdRead(flags);
    case "tick": return cmdTick();
    case "apply": return cmdApply();
    case "install": return cmdInstall(flags);
    case "inbox": return cmdInbox(args);
    case "capture": {
      const e = appendToDock(args.join(" "));
      say(e ? `captured (${e.id}): ${e.lines[0]}${e.lines.length > 1 ? " …" : ""}` : "nothing to capture.");
      return;
    }
    case "portrait": return process.stdout.write(portraitSlice(args[0] ?? "all"));
    case "win": {
      const text = args.join(" ").trim();
      if (!text) throw new Error('give the line: os win "what got done"');
      if (!modules().wins) throw new Error("the wins module is off in os.yaml.");
      appendWin(text, localDate());
      say(`win: ${text}`);
      return;
    }
    case "file": {
      const [id, to, area] = args;
      if (!id || !to) throw new Error("os file <id> <wins|goals|challenge> [area]");
      const r = fileEntry(id, to, area ?? null);
      say(r.skipped ? `${id}: ${r.skipped}` : `${id} -> ${to}${r.area ? ` (${r.area})` : ""}: ${r.text.split("\n")[0]}`);
      return;
    }
    case "help": case "-h": case "--help": return say(HELP);
    default:
      say(`unknown command: ${cmd}\n`);
      say(HELP);
      process.exit(1);
  }
}
