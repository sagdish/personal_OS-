// os.yaml, read once and cached on the file's own mtime. Everything that needs to know what the
// OS contains asks here. Nothing downstream hardcodes an area, a module or a path.

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { OS_ROOT, abs } from "./root.mjs";

export const OS_YAML = path.join(OS_ROOT, "os.yaml");
export const MODULES = ["wins", "goals", "practice", "challenge", "weekly"];

let cache = null;

export const isSetUp = () => fs.existsSync(OS_YAML);

export function map() {
  if (!fs.existsSync(OS_YAML)) {
    throw new Error("os.yaml is missing: this OS is not set up yet. Run /setup (it reads SETUP.md).");
  }
  const st = fs.statSync(OS_YAML);
  const key = `${st.mtimeMs}:${st.size}`;
  if (cache?.key === key) return cache.map;
  const m = YAML.parse(fs.readFileSync(OS_YAML, "utf8")) ?? {};
  cache = { key, map: m };
  return m;
}

/** Only `os apply` writes os.yaml, as text it generated. Runtime switches live in machine.json. */
export function writeMapText(text) {
  YAML.parse(text); // refuse to write a map nothing can read
  fs.writeFileSync(OS_YAML, text);
  cache = null;
}

export const osName = () => map().name || "Personal OS";
export const owner = () => map().owner || "";
export const language = () => map().language || "en";
export const areas = () => map().areas ?? [];
export const areaByKey = (key) => areas().find((a) => a.key === key) ?? null;
export const areaDir = (a) => abs(path.join("areas", a.key));
export const modules = () => Object.fromEntries(MODULES.map((k) => [k, Boolean(map().modules?.[k])]));
export const rhythm = () => ({ read_at: "08:30", next_step: false, ...(map().rhythm ?? {}) });
export const provider = () => ({
  kind: "claude-code",
  model: "",
  base_url: "",
  max_calls_per_day: 3,
  ...(map().provider ?? {}),
});
export const journalDir = () => abs(map().journal?.path || "journal");
export const journalFile = (...parts) => path.join(journalDir(), ...parts);
export const usesObsidian = () => Boolean(map().journal?.obsidian);
export const practiceItems = () => map().practice ?? [];
export const challenge = () => map().challenge ?? null;
export const appPort = () => Number(process.env.OS_PORT || map().app?.port || 3300);
