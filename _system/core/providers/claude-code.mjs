// Provider: Claude Code with your subscription. The default, nothing to set up.
//
// `claude -p` with the prompt on stdin, the portrait as an appended system prompt, JSON out, one
// turn, no tools. It runs from an empty folder on purpose: from the OS folder, Claude Code would
// load CLAUDE.md and AGENTS.md into the read, which are instructions for a session, not for this.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { STATE_DIR } from "../root.mjs";

export const label = "Claude Code (subscription)";

export function findClaude() {
  const names = process.platform === "win32" ? ["claude.cmd", "claude.exe", "claude"] : ["claude"];
  const dirs = [
    ...(process.env.PATH ?? "").split(path.delimiter),
    path.join(os.homedir(), ".local", "bin"),
    path.join(os.homedir(), ".claude", "local"),
    "/opt/homebrew/bin",
    "/usr/local/bin",
  ];
  for (const d of dirs) for (const n of names) {
    if (!d) continue;
    const p = path.join(/* turbopackIgnore: true */ d, n);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export const ready = () => Boolean(findClaude());
export const readiness = () => (ready() ? "claude found" : "`claude` is not on your PATH. Install Claude Code, or pick another provider in os.yaml.");

function run(bin, args, { cwd, timeoutMs, input }) {
  return new Promise((resolve, reject) => {
    const wrap = process.platform === "darwin" && fs.existsSync("/usr/bin/caffeinate");
    const child = wrap
      ? spawn("/usr/bin/caffeinate", ["-ims", bin, ...args], { cwd, stdio: ["pipe", "pipe", "pipe"], detached: process.platform !== "win32" })
      : spawn(bin, args, { cwd, stdio: ["pipe", "pipe", "pipe"], detached: process.platform !== "win32", shell: process.platform === "win32" });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => {
      try {
        if (process.platform === "win32") child.kill();
        else process.kill(-child.pid, "SIGKILL");
      } catch { /* already gone */ }
      reject(new Error(`the call ran longer than ${Math.round(timeoutMs / 1000)}s and was stopped`));
    }, timeoutMs);
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`claude exited ${code}: ${(err || out).trim().slice(0, 300)}`));
      else resolve({ stdout: out });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

export async function call({ system, prompt, model, timeoutMs = 300000 }) {
  const bin = findClaude();
  if (!bin) throw new Error("Claude Code is not installed (no `claude` on PATH).");
  const cwd = path.join(STATE_DIR, "readcwd");
  fs.mkdirSync(cwd, { recursive: true });
  const args = ["-p", "--output-format", "json", "--max-turns", "1"];
  if (model) args.push("--model", model);
  args.push("--append-system-prompt", system);
  args.push("--disallowedTools", "Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch", "WebSearch", "Task", "Agent");
  const { stdout } = await run(bin, args, { cwd, timeoutMs, input: prompt });
  let res;
  try {
    res = JSON.parse(stdout);
  } catch {
    throw new Error(`claude did not return JSON: ${stdout.trim().slice(0, 200)}`);
  }
  if (res.is_error) throw new Error(`Claude Code returned an error: ${String(res.result ?? "").slice(0, 300)}`);
  return {
    text: String(res.result ?? ""),
    cost_usd: typeof res.total_cost_usd === "number" ? res.total_cost_usd : null,
    usage: null,
    meta: { turns: res.num_turns ?? null },
  };
}
