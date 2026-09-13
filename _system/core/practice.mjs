// The daily practice: a few habits you tick on the home page. Optional. One small JSON file per
// day under _system/state/practice/, never inside your journal. Nothing here computes a streak.

import fs from "node:fs";
import path from "node:path";
import { practiceItems } from "./map.mjs";
import { STATE_DIR, localDate } from "./root.mjs";

const DIR = path.join(STATE_DIR, "practice");
const fileFor = (date) => path.join(DIR, `${date}.json`);

export function ticks(date = localDate()) {
  try {
    return JSON.parse(fs.readFileSync(fileFor(date), "utf8"));
  } catch {
    return {};
  }
}

export function setTick(key, on, date = localDate()) {
  if (!practiceItems().some((i) => i.key === key)) throw new Error(`unknown practice item "${key}"`);
  fs.mkdirSync(DIR, { recursive: true });
  const t = ticks(date);
  if (on) t[key] = true;
  else delete t[key];
  fs.writeFileSync(fileFor(date), `${JSON.stringify(t)}\n`);
  return t;
}

/** The last N days, oldest first, today last. */
export function days(n = 7) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = localDate(d);
    out.push({ date, ticks: ticks(date) });
  }
  return out;
}
