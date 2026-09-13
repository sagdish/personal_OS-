// The schedule: one job every 30 minutes that runs `os tick`. The tick decides whether the read is
// due. macOS installs it (launchd). Linux and Windows get the exact line to add; `--yes` adds the
// cron line on Linux.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { OS_ROOT, LOGS_DIR } from "./root.mjs";

const hash = createHash("sha1").update(OS_ROOT).digest("hex").slice(0, 6);
export const LABEL = `com.personal-os.tick.${hash}`;
const LAUNCH_DIR = process.env.OS_LAUNCH_DIR || path.join(os.homedir(), "Library", "LaunchAgents");
export const PLIST = path.join(LAUNCH_DIR, `${LABEL}.plist`);
const script = path.join(OS_ROOT, "bin", "os.mjs");
// OS_NO_LAUNCHCTL=1 writes the job file without loading it (tests). Never set it by hand.
const launchctl = (verb) => {
  if (process.env.OS_NO_LAUNCHCTL) return;
  execFileSync("launchctl", [verb, PLIST], { stdio: "ignore" });
};

const plist = (node) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${node}</string>
    <string>${script}</string>
    <string>tick</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>${path.dirname(node)}:${os.homedir()}/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>WorkingDirectory</key><string>${OS_ROOT}</string>
  <key>StandardOutPath</key><string>${path.join(LOGS_DIR, "tick.log")}</string>
  <key>StandardErrorPath</key><string>${path.join(LOGS_DIR, "tick.log")}</string>
  <key>RunAtLoad</key><true/>
  <key>StartInterval</key><integer>1800</integer>
</dict>
</plist>
`;

export const cronLine = () =>
  `*/30 * * * * cd "${OS_ROOT}" && "${process.execPath}" bin/os.mjs tick >> "${path.join(LOGS_DIR, "tick.log")}" 2>&1`;

export const schtasksLine = () =>
  `schtasks /Create /SC MINUTE /MO 30 /TN "Personal OS tick" /TR "\\"${process.execPath}\\" \\"${script}\\" tick"`;

/** {installed, how, note} without touching anything. */
export function status() {
  if (process.platform === "darwin") {
    if (!fs.existsSync(PLIST)) return { installed: false, how: "launchd", note: "not scheduled. fix: os install" };
    const text = fs.readFileSync(PLIST, "utf8");
    const ok = text.includes(script) && text.includes(process.execPath);
    return { installed: ok, how: "launchd", note: ok ? "every 30 minutes, launchd" : "the job points at another folder or node. fix: os install" };
  }
  if (process.platform === "linux") {
    try {
      const tab = execFileSync("crontab", ["-l"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const ok = tab.includes(script) || tab.includes(`${OS_ROOT}" && `);
      return { installed: ok, how: "cron", note: ok ? "every 30 minutes, cron" : "not in your crontab. fix: os install --yes" };
    } catch {
      return { installed: false, how: "cron", note: "not scheduled. fix: os install" };
    }
  }
  return { installed: false, how: "schtasks", note: "not checked on Windows. See README, Schedule." };
}

export function install({ yes = false } = {}) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  if (process.platform === "darwin") {
    fs.mkdirSync(LAUNCH_DIR, { recursive: true });
    fs.writeFileSync(PLIST, plist(process.execPath));
    try { launchctl("unload"); } catch { /* not loaded yet */ }
    launchctl("load");
    return `scheduled: ${LABEL}, every 30 minutes. The read runs at the time in os.yaml, your machine's clock.`;
  }
  if (process.platform === "linux") {
    const line = cronLine();
    if (!yes) return `add this line to your crontab (crontab -e), or run \`os install --yes\` to add it for you:\n  ${line}`;
    let tab = "";
    try { tab = execFileSync("crontab", ["-l"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { /* empty */ }
    if (tab.includes(line)) return "already in your crontab.";
    execFileSync("crontab", ["-"], { input: `${tab.trimEnd()}\n${line}\n` });
    return "added to your crontab: every 30 minutes.";
  }
  return `Windows: run this once in a terminal to schedule the tick every 30 minutes:\n  ${schtasksLine()}`;
}

export function uninstall() {
  if (process.platform === "darwin") {
    if (!fs.existsSync(PLIST)) return "no schedule was installed.";
    try { launchctl("unload"); } catch { /* fine */ }
    fs.rmSync(PLIST, { force: true });
    return `removed ${LABEL}.`;
  }
  if (process.platform === "linux") {
    let tab = "";
    try { tab = execFileSync("crontab", ["-l"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return "no crontab."; }
    const next = tab.split("\n").filter((l) => !l.includes(script)).join("\n");
    execFileSync("crontab", ["-"], { input: `${next.trimEnd()}\n` });
    return "removed from your crontab.";
  }
  return `Windows: schtasks /Delete /TN "Personal OS tick" /F`;
}

/** The `os` alias in the shell's rc file. */
export function installAlias() {
  if (process.platform === "win32") return `Windows: add ${path.join(OS_ROOT, "bin")} to your PATH, or run node "${script}" directly.`;
  const shell = path.basename(process.env.SHELL || "");
  const rc = path.join(os.homedir(), shell === "bash" ? ".bashrc" : ".zshrc");
  const line = `alias os="${path.join(OS_ROOT, "bin", "os")}"`;
  const have = fs.existsSync(rc) ? fs.readFileSync(rc, "utf8") : "";
  if (have.includes(line)) return `the os alias is already in ${rc}.`;
  fs.appendFileSync(rc, `\n# Personal OS\n${line}\n`);
  return `added the os alias to ${rc}. Open a new terminal, then type os from anywhere.`;
}

export function uninstallAlias() {
  if (process.platform === "win32") return "";
  const shell = path.basename(process.env.SHELL || "");
  const rc = path.join(os.homedir(), shell === "bash" ? ".bashrc" : ".zshrc");
  if (!fs.existsSync(rc)) return "";
  const line = `alias os="${path.join(OS_ROOT, "bin", "os")}"`;
  const text = fs.readFileSync(rc, "utf8");
  if (!text.includes(line)) return "";
  fs.writeFileSync(rc, text.replace(`\n# Personal OS\n${line}\n`, "\n").replace(`${line}\n`, ""));
  return `removed the os alias from ${rc}.`;
}
