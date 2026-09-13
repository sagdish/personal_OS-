// The journal: your writing folder. journal/ inside the OS, or the Obsidian folder you pointed at.
// The machine only ever APPENDS here, and only your words: a win, a task, a challenge line, a copy
// of each read. It never edits or deletes what you wrote.

import fs from "node:fs";
import path from "node:path";
import { areas, challenge, journalDir, journalFile, modules } from "./map.mjs";
import { localDate } from "./root.mjs";

export const DOCK_HEAD =
  "# inbox\n\n<!-- Anything, any format, from any device. The OS reads it and files it. Nothing here is ever deleted. -->\n\n";
const WINS_HEAD = "# Wins\n\n<!-- One line per thing done, your words. Newest at the bottom. Never edited, never deleted. -->\n\n";
const GOALS_HEAD = "# Goals\n\n<!-- One task per line under the area it belongs to. Tick it when it is done. -->\n";

const ensureFile = (file, head) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, head);
};

/** Create the tree for the modules that are on. Safe to run again: creates only what is missing. */
export function ensureJournal() {
  const mods = modules();
  fs.mkdirSync(journalFile("daily"), { recursive: true });
  fs.mkdirSync(journalFile("inbox"), { recursive: true });
  fs.mkdirSync(journalFile("reads"), { recursive: true });
  ensureFile(journalFile("inbox.md"), DOCK_HEAD);
  if (mods.wins) ensureFile(journalFile("wins.md"), WINS_HEAD);
  if (mods.goals) {
    ensureFile(journalFile("goals.md"), GOALS_HEAD);
    // Every area gets its heading once. Existing text is never touched.
    const raw = fs.readFileSync(journalFile("goals.md"), "utf8");
    const missing = areas().filter((a) => !sectionFor(raw, a));
    if (missing.length) {
      fs.appendFileSync(journalFile("goals.md"), missing.map((a) => `\n## ${a.label}\n`).join(""));
    }
  }
  if (mods.challenge) {
    const c = challenge() ?? {};
    ensureFile(
      journalFile("challenge.md"),
      `# ${c.name || "The challenge"}\n\n<!-- ${[c.from && c.to ? `${c.from} to ${c.to}.` : "", c.rule ? c.rule.replace(/[.!]?$/, ".") : ""].filter(Boolean).join(" ")} One dated line per attempt, your words. Never counted, never scored. -->\n\n`,
    );
  }
  if (mods.weekly) fs.mkdirSync(journalFile("weeks"), { recursive: true });
}

const bullet = (date, text) => {
  const lines = String(text).replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  return [`- ${date} — ${lines[0]}`, ...lines.slice(1).map((l) => `  ${l}`)].join("\n");
};

export function appendWin(text, date = localDate()) {
  ensureFile(journalFile("wins.md"), WINS_HEAD);
  fs.appendFileSync(journalFile("wins.md"), `${bullet(date, text)}\n`);
}

export function readWins(n = 10) {
  const file = journalFile("wins.md");
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, "utf8").split("\n").filter((l) => /^- /.test(l));
  return lines.slice(-n).map((l) => l.replace(/^- /, ""));
}

export function appendChallenge(text, date = localDate()) {
  const c = challenge() ?? {};
  ensureFile(journalFile("challenge.md"), `# ${c.name || "The challenge"}\n\n`);
  fs.appendFileSync(journalFile("challenge.md"), `${bullet(date, text)}\n`);
}

export function readChallengeTail(n = 5) {
  const file = journalFile("challenge.md");
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, "utf8").split("\n").filter((l) => /^- /.test(l));
  return lines.slice(-n).map((l) => l.replace(/^- /, ""));
}

// ---- goals.md: `## <Area label>` headings, `- [ ] task` lines under them ----

const norm = (s) => String(s ?? "").trim().toLowerCase();

function areaForHeading(heading) {
  const h = norm(heading);
  return areas().find((a) => norm(a.label) === h || norm(a.key) === h) ?? null;
}

function sectionFor(raw, area) {
  return raw.split("\n").some((l) => /^##\s+/.test(l) && areaForHeading(l.replace(/^##\s+/, ""))?.key === area.key);
}

/** Every task line, with its heading and area. */
export function parseGoals(raw) {
  const out = [];
  let heading = null;
  let area = null;
  for (const line of String(raw ?? "").split("\n")) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      heading = h[1];
      area = areaForHeading(heading)?.key ?? null;
      continue;
    }
    const m = /^- \[( |x|X)\] (.+)$/.exec(line);
    if (m) out.push({ text: m[2].trim(), done: m[1] !== " ", heading, area, line });
  }
  return out;
}

export function readGoals() {
  const file = journalFile("goals.md");
  return fs.existsSync(file) ? parseGoals(fs.readFileSync(file, "utf8")) : [];
}

/** Open tasks grouped by area key; tasks under no known area land in `other`. */
export function openGoals() {
  const out = {};
  for (const t of readGoals().filter((t) => !t.done)) (out[t.area ?? "other"] ??= []).push(t.text);
  return out;
}

export function appendGoal(text, areaKey = null) {
  ensureFile(journalFile("goals.md"), GOALS_HEAD);
  const file = journalFile("goals.md");
  const area = areas().find((a) => a.key === areaKey) ?? null;
  const heading = area ? area.label : "Other";
  const line = `- [ ] ${String(text).replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean).join(" ")}`;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const at = lines.findIndex((l) => {
    if (!/^##\s+/.test(l)) return false;
    const h = l.replace(/^##\s+/, "");
    return area ? areaForHeading(h)?.key === area.key : norm(h) === "other";
  });
  if (at === -1) {
    fs.appendFileSync(file, `\n## ${heading}\n\n${line}\n`);
    return;
  }
  // After the last task line of that section, or right under the heading.
  let end = lines.length;
  for (let i = at + 1; i < lines.length; i++) if (/^##\s+/.test(lines[i])) { end = i; break; }
  let insert = at + 1;
  for (let i = at + 1; i < end; i++) if (/^- \[/.test(lines[i])) insert = i + 1;
  if (insert === at + 1 && lines[at + 1] === "") insert = at + 2;
  lines.splice(insert, 0, line);
  if (/^##\s+/.test(lines[insert + 1] ?? "")) lines.splice(insert + 1, 0, "");
  fs.writeFileSync(file, lines.join("\n"));
}

/** Tick or untick one exact task line. Returns false when the line is not there any more. */
export function setGoalDone(lineText, done) {
  const file = journalFile("goals.md");
  if (!fs.existsSync(file)) return false;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const i = lines.findIndex((l) => l === lineText);
  if (i === -1) return false;
  lines[i] = lineText.replace(/^- \[( |x|X)\]/, `- [${done ? "x" : " "}]`);
  fs.writeFileSync(file, lines.join("\n"));
  return true;
}

export function readDaily(date) {
  const file = journalFile("daily", `${date}.md`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

export function listReads(n = 30) {
  const dir = journalFile("reads");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse()
    .slice(0, n)
    .map((f) => ({ file: f, path: path.join(dir, f), text: fs.readFileSync(path.join(dir, f), "utf8") }));
}

export const journalExists = () => fs.existsSync(journalDir());
