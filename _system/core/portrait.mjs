// MANAGER.md: the one portrait, cut per voice.
//
// The daily read gets the file whole as its identity. A coach gets the intro, `## Core`, `## Voice`
// and its own area's section, nothing from the others. The headings are the contract; doctor
// checks them against the areas in os.yaml.

import fs from "node:fs";
import path from "node:path";
import { OS_ROOT } from "./root.mjs";
import { areas, areaByKey } from "./map.mjs";

export const MANAGER = path.join(OS_ROOT, "MANAGER.md");
export const SHARED = ["## Core", "## Voice"];

export const areaHeading = (a) => `## ${a.label}`;
export const expectedHeadings = () => [...SHARED, ...areas().map(areaHeading)];

export const readPortrait = () => (fs.existsSync(MANAGER) ? fs.readFileSync(MANAGER, "utf8") : null);

/** { head: text above the first heading, parts: Map(heading -> section including its heading) } */
export function split(text) {
  const parts = new Map();
  let head = "";
  let current = null;
  for (const line of String(text ?? "").split("\n")) {
    if (line.startsWith("## ")) {
      current = line.trim();
      parts.set(current, "");
    }
    if (current === null) head += `${line}\n`;
    else parts.set(current, `${parts.get(current)}${line}\n`);
  }
  return { head, parts };
}

export const missingHeadings = (text) => {
  const { parts } = split(text);
  return expectedHeadings().filter((h) => !parts.has(h));
};

/** Headings whose section holds no prose yet. */
export const emptySections = (text) => {
  const { parts } = split(text);
  return expectedHeadings().filter((h) => parts.has(h) && !parts.get(h).split("\n").slice(1).join("\n").replace(/<!--[\s\S]*?-->/g, "").trim());
};

/** The slice one voice is handed. `all` is the whole file. */
export function slice(key = "all") {
  const text = readPortrait();
  if (text === null) throw new Error("MANAGER.md is missing. Run /setup, or write it by hand: it is the portrait every voice speaks from.");
  if (key === "all") return text;
  const area = areaByKey(key);
  if (!area) throw new Error(`unknown portrait key "${key}". Use an area key (${areas().map((a) => a.key).join(", ")}) or "all".`);
  const { head, parts } = split(text);
  return [head, ...SHARED.map((h) => parts.get(h)), parts.get(areaHeading(area))]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd() + "\n";
}
