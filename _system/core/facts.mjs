// What the read is shown: computed from disk, capped, compact. The model interpolates these; it
// never restates a count. A channel that could not be read says so, because "missing" and
// "empty" must never look the same to the model.

import fs from "node:fs";
import path from "node:path";
import { areas, areaDir, challenge, language, modules, owner, practiceItems, rhythm } from "./map.mjs";
import { openGoals, readChallengeTail, readDaily, readWins } from "./journal.mjs";
import { recentEntries } from "./inbox.mjs";
import { days as practiceDays } from "./practice.mjs";
import { readRead } from "./state.mjs";
import { localDate } from "./root.mjs";

export const FACTS_MAX_BYTES = 20000;
const DAY_MS = 86400000;

/** Collapse runs of blank lines, cut to n, mark the cut. Never silently truncate. */
export function cut(s, n) {
  if (s == null) return null;
  const t = String(s).replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > n ? `${t.slice(0, n)} […cut]` : t;
}

const SKIP = new Set([".gitkeep", "index.yaml", ".DS_Store"]);

function touched(dir, daysBack = 7, limit = 15) {
  const out = [];
  const since = Date.now() - daysBack * DAY_MS;
  const walk = (d) => {
    for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) {
      if (e.name.startsWith(".")) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (!SKIP.has(e.name)) {
        const m = fs.statSync(p).mtimeMs;
        if (m >= since) out.push({ file: path.relative(dir, p), days_ago: Math.floor((Date.now() - m) / DAY_MS) });
      }
    }
  };
  walk(dir);
  return out.sort((a, b) => a.days_ago - b.days_ago).slice(0, limit);
}

export function gatherFacts() {
  const mods = modules();
  const today = localDate();
  const yesterday = localDate(new Date(Date.now() - DAY_MS));
  const prev = readRead();

  const facts = {
    date: today,
    weekday: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    language: language(),
    name: owner(),
    modules: Object.keys(mods).filter((k) => mods[k]),
    next_step: Boolean(rhythm().next_step),
    areas: {},
    daily: {},
    inbox: [],
    history: [],
  };

  for (const a of areas()) {
    facts.areas[a.key] = { label: a.label, moving: a.moving ?? "", touched: touched(areaDir(a)) };
  }

  const safe = (fn, fallback) => {
    try {
      return fn();
    } catch (e) {
      return { unreadable: `could not be read: ${e.message}`, ...fallback };
    }
  };

  facts.daily = safe(() => ({ yesterday: cut(readDaily(yesterday), 1500), today: cut(readDaily(today), 1500) }), {});
  facts.inbox = safe(
    () => recentEntries(3).slice(-20).map((e) => ({ id: e.id, at: `${e.date} ${e.time}`, text: cut(e.text, 1200), filed: e.filed?.to ?? null })),
    [],
  );
  if (mods.wins) facts.wins = safe(() => readWins(10), []);
  if (mods.goals) {
    facts.goals = safe(() => {
      const g = openGoals();
      for (const k of Object.keys(g)) g[k] = g[k].slice(0, 15);
      return g;
    }, {});
  }
  if (mods.practice) {
    facts.practice = safe(
      () => ({
        items: practiceItems().map((i) => i.label),
        days: practiceDays(7).map((d) => ({ date: d.date, done: Object.keys(d.ticks).map((k) => practiceItems().find((i) => i.key === k)?.label ?? k) })),
      }),
      {},
    );
  }
  if (mods.challenge) facts.challenge = safe(() => ({ ...(challenge() ?? {}), record: readChallengeTail(5) }), {});

  // Its own last reads, so it can tell when it is repeating itself.
  facts.history = [...(prev?.history ?? []), ...(prev?.judgment?.where ? [{ date: prev.date, where: cut(prev.judgment.where, 300) }] : [])].slice(-3);

  return enforceBudget(facts);
}

/** Trim to the ceiling and say what was cut. Least valuable first: touched files, then the day
 *  notes, then the oldest inbox entries. Wins, goals and history are small and stay. */
export function enforceBudget(facts, max = FACTS_MAX_BYTES) {
  const size = () => JSON.stringify(facts).length;
  if (size() <= max) return facts;
  const dropped = [];
  for (const k of Object.keys(facts.areas)) {
    if (size() <= max) break;
    if (facts.areas[k].touched?.length) {
      facts.areas[k].touched = [];
      dropped.push(`touched files of ${k}`);
    }
  }
  if (size() > max && facts.daily?.yesterday) {
    facts.daily.yesterday = null;
    dropped.push("yesterday's note");
  }
  while (size() > max && facts.inbox?.length) {
    facts.inbox.shift();
    dropped.push("the oldest inbox entry");
  }
  if (size() > max && facts.daily?.today) {
    facts.daily.today = cut(facts.daily.today, 600);
    dropped.push("most of today's note");
  }
  facts._trimmed = `The context ceiling was reached; dropped and NOT shown to you: ${[...new Set(dropped)].join(", ")}. Treat them as unseen, never as empty.`;
  return facts;
}
