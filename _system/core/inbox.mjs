// The inbox: your words, kept. Nothing here is ever deleted.
//
// The dock, <journal>/inbox.md, is where everything lands: the page's capture box, /capture, a
// phone through Obsidian. The tick moves each entry into <journal>/inbox/<date>.md, and only after
// reading it back from there is it spliced out of the dock. The read and /triage file COPIES from
// the day files; the entry stays.
//
// A stamped entry:  - 2026-09-14 08:12 · text
//                     a second line, indented
// A plain line from a phone is an entry too; it gets a stamp when it is sorted.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { journalFile } from "./map.mjs";
import { localDate, localTime } from "./root.mjs";
import { readMachine } from "./state.mjs";
import { DOCK_HEAD } from "./journal.mjs";

const STAMPED = /^-\s*(?:\[[ x]\]\s*)?(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*·\s*(.*)$/;

export function parseEntries(raw) {
  const out = [];
  for (const line of String(raw ?? "").split("\n")) {
    const t = line.trim();
    if (!t || /^#{1,6}\s/.test(t) || t.startsWith("<!--") || t === "---") continue;
    const m = t.match(STAMPED);
    if (m) {
      out.push({ date: m[1], time: m[2], lines: [m[3].trim()], raw: [line] });
      continue;
    }
    const last = out[out.length - 1];
    if (last && /^\s+\S/.test(line)) {
      last.lines.push(t);
      last.raw.push(line);
      continue;
    }
    out.push({ date: null, time: null, lines: [t.replace(/^[-*]\s+(?:\[[ x]\]\s*)?/, "")], raw: [line] });
  }
  return out;
}

export const entryText = (e) => e.lines.join("\n");

/** Stable once stamped: the same words at the same minute are the same entry. */
export const entryId = (e) =>
  `e${createHash("sha1").update(`${e.date} ${e.time}\n${entryText(e)}`).digest("hex").slice(0, 10)}`;

export const formatEntry = (e) =>
  [`- ${e.date} ${e.time} · ${e.lines[0]}`, ...e.lines.slice(1).map((l) => `  ${l}`)].join("\n");

export const dockPath = () => journalFile("inbox.md");

/** The one write into the dock besides the phone: append, never rewrite. */
export function appendToDock(text) {
  const dock = dockPath();
  fs.mkdirSync(path.dirname(dock), { recursive: true });
  if (!fs.existsSync(dock)) fs.writeFileSync(dock, DOCK_HEAD);
  const lines = String(text).replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const e = { date: localDate(), time: localTime(), lines };
  fs.appendFileSync(dock, `${formatEntry(e)}\n`);
  return { id: entryId(e), ...e };
}

/** Move the dock's entries into inbox/<date>.md. An entry leaves the dock only after it is read back. */
export function sortDock() {
  const dock = dockPath();
  if (!fs.existsSync(dock)) return { moved: 0 };
  const entries = parseEntries(fs.readFileSync(dock, "utf8"));
  if (!entries.length) return { moved: 0 };

  const today = localDate();
  const now = localTime();
  const movedRaw = [];
  let moved = 0;
  for (const e of entries) {
    const stamped = e.date ? e : { ...e, date: today, time: now };
    const dayFile = journalFile("inbox", `${stamped.date}.md`);
    fs.mkdirSync(path.dirname(dayFile), { recursive: true });
    if (!fs.existsSync(dayFile)) fs.writeFileSync(dayFile, `# ${stamped.date}\n\n`);
    fs.appendFileSync(dayFile, `${formatEntry(stamped)}\n`);
    const back = parseEntries(fs.readFileSync(dayFile, "utf8"));
    const landed = back.some(
      (b) => b.date === stamped.date && b.time === stamped.time && entryText(b) === entryText(stamped),
    );
    if (landed) {
      movedRaw.push(...e.raw);
      moved += 1;
    }
  }

  // Splice the moved lines out of a FRESH read of the dock, one occurrence each, never a rewrite
  // from a stale copy. A line the phone added in between survives untouched.
  const fresh = fs.readFileSync(dock, "utf8").split("\n");
  const pending = [...movedRaw];
  const keep = [];
  for (const line of fresh) {
    const i = pending.indexOf(line);
    if (i !== -1) {
      pending.splice(i, 1);
      continue;
    }
    keep.push(line);
  }
  let text = keep.join("\n").replace(/\n{3,}/g, "\n\n");
  if (!text.trim()) text = DOCK_HEAD;
  fs.writeFileSync(dock, text.endsWith("\n") ? text : `${text}\n`);
  return { moved };
}

/** Entries from the day files of the last N days, newest last, each with its id and whether it was filed. */
export function recentEntries(days = 14) {
  const filed = readMachine().filed ?? {};
  const out = [];
  const dir = journalFile("inbox");
  if (!fs.existsSync(dir)) return out;
  const since = new Date(Date.now() - days * 86400000);
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .filter((f) => new Date(f.slice(0, 10)) >= since)
    .sort();
  for (const f of files) {
    for (const e of parseEntries(fs.readFileSync(path.join(dir, f), "utf8"))) {
      const withDate = e.date ? e : { ...e, date: f.slice(0, 10), time: "00:00" };
      const id = entryId(withDate);
      out.push({ id, date: withDate.date, time: withDate.time, text: entryText(withDate), filed: filed[id] ?? null });
    }
  }
  return out;
}

export const findEntry = (id, days = 90) => recentEntries(days).find((e) => e.id === id) ?? null;

/** How many entries still sit in the dock, unsorted. */
export function dockCount() {
  const dock = dockPath();
  return fs.existsSync(dock) ? parseEntries(fs.readFileSync(dock, "utf8")).length : 0;
}
