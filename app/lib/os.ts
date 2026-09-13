// The page's one door onto the machine. Server-side only: everything here touches the disk.

import fs from "node:fs";
import path from "node:path";
import * as map from "@core/map.mjs";
import * as state from "@core/state.mjs";
import * as journal from "@core/journal.mjs";
import * as inbox from "@core/inbox.mjs";
import * as practice from "@core/practice.mjs";
import * as schedule from "@core/schedule.mjs";
import { doctor } from "@core/doctor.mjs";
import { providerModule } from "@core/read.mjs";
import { OS_ROOT, LOGS_DIR, localDate } from "@core/root.mjs";
import { loadEnv } from "@core/env.mjs";

loadEnv();

export { map, state, journal, inbox, practice, schedule, doctor, providerModule, OS_ROOT, LOGS_DIR, localDate };

export type Area = { key: string; label: string; moving?: string };
export type Judgment = { where: string; areas: Record<string, string>; moved: string[]; ask: string | null; next: string | null };
export type Read = {
  at: string;
  date: string;
  provider: string;
  model: string | null;
  cost_usd: number | null;
  judgment: Judgment;
};
export type Run = { at: string; ok: boolean; provider?: string; cost_usd?: number | null; ms?: number; in_bytes?: number; error?: string };
export type Machine = { paused: boolean; last_read_at: string | null; last_tick_at: string | null; runs: Run[]; filed: Record<string, unknown> };

export const isSetUp = (): boolean => Boolean(map.isSetUp());
export const osName = (): string => (isSetUp() ? String(map.osName()) : "Personal OS");
export const areas = (): Area[] => (isSetUp() ? (map.areas() as Area[]) : []);
export const modules = (): Record<string, boolean> => (isSetUp() ? (map.modules() as Record<string, boolean>) : {});
export const getRead = (): Read | null => (state.readRead() as Read | null);
export const getMachine = (): Machine => state.readMachine() as Machine;

const NOT_NOTES = new Set(["index.yaml", "README.md", ".gitkeep", ".DS_Store"]);

export type AreaStat = Area & { lastTouched: string | null; notes: number };

export function areaStats(): AreaStat[] {
  return areas().map((a) => {
    const dir = String(map.areaDir(a));
    let newest = 0;
    let notes = 0;
    const walk = (d: string) => {
      for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) {
        if (e.name.startsWith(".")) continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name !== "index.yaml") {
          newest = Math.max(newest, fs.statSync(p).mtimeMs);
          if (!NOT_NOTES.has(e.name)) notes += 1;
        }
      }
    };
    walk(dir);
    return { ...a, lastTouched: newest ? String(localDate(new Date(newest))) : null, notes };
  });
}

/** Files under areas/<key>/notes, newest first. */
export function areaNotes(key: string): { name: string; rel: string; date: string }[] {
  const dir = path.join(OS_ROOT, "areas", key, "notes");
  if (!fs.existsSync(dir)) return [];
  const out: { name: string; rel: string; date: string; m: number }[] = [];
  const walk = (d: string, rel: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const p = path.join(d, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p, r);
      else {
        const m = fs.statSync(p).mtimeMs;
        out.push({ name: r, rel: `areas/${key}/notes/${r}`, date: String(localDate(new Date(m))), m });
      }
    }
  };
  walk(dir, "");
  return out.sort((a, b) => b.m - a.m).map(({ m: _m, ...rest }) => rest);
}

/** What the machine needs to say, if anything. Empty most days. */
export function machineNotes(): { what: string; fix: string }[] {
  const out: { what: string; fix: string }[] = [];
  const m = getMachine();
  if (m.paused) out.push({ what: "The read is paused.", fix: "turn it on at Control" });
  const last = m.runs[m.runs.length - 1];
  if (last && !last.ok) out.push({ what: `The last read failed: ${last.error ?? "unknown error"}.`, fix: "see Control" });
  return out;
}

export function logTail(n = 25): string[] {
  const file = path.join(LOGS_DIR, "os.log");
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").trim().split("\n").slice(-n);
}

export function readmeText(): string {
  const file = path.join(OS_ROOT, "README.md");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}
