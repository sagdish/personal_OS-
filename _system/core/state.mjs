// The machine's own state. Two files, written here and nowhere else.
//
//   machine.json   paused · last_read_at · last_tick_at · runs (the last 100 calls, with cost) ·
//                  filed (which inbox entries were copied where)
//   read.json      the last read: facts + the model's judgment. Every surface renders this one object.
//
// Writes go through a temp file and a rename, so a kill mid-write leaves the previous file intact.

import fs from "node:fs";
import path from "node:path";
import { STATE_DIR, localDate } from "./root.mjs";

const MACHINE = path.join(STATE_DIR, "machine.json");
const READ = path.join(STATE_DIR, "read.json");

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};

function writeAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

export const readMachine = () => ({
  paused: false,
  last_read_at: null,
  last_tick_at: null,
  runs: [],
  filed: {},
  ...readJson(MACHINE, {}),
});

export function updateMachine(fn) {
  const m = readMachine();
  const next = fn(m) ?? m;
  writeAtomic(MACHINE, next);
  return next;
}

/** One row per model call, success or failure. `cost_usd` is the provider's estimate or null. */
export function recordRun(run) {
  updateMachine((m) => ({ ...m, runs: [...m.runs, { at: new Date().toISOString(), ...run }].slice(-100) }));
}

const dayOf = (iso) => localDate(new Date(iso));

/** Calls made today, machine-local. Failures count: they were paid for, or at least attempted. */
export const callsToday = (m = readMachine()) => m.runs.filter((r) => dayOf(r.at) === localDate()).length;

export const readRanToday = (m = readMachine()) => Boolean(m.last_read_at && dayOf(m.last_read_at) === localDate());

export const readRead = () => readJson(READ, null);
export const writeRead = (obj) => writeAtomic(READ, obj);
