// Documents the page may show and edit. Two roots: the OS folder (`areas/…`, `MANAGER.md`, …) and
// the journal (`j/…`, wherever os.yaml points). The machine's folders are never served.

import fs from "node:fs";
import path from "node:path";
import { OS_ROOT, map, isSetUp } from "./os";

const DENY = new Set(["_system", "app", "bin", "node_modules", ".git", ".env.local", ".claude", "package.json", "package-lock.json"]);
const EDITABLE = /\.(md|yaml|yml|txt)$/i;

export type Entry = { name: string; rel: string; isDir: boolean };
export type Doc =
  | { rel: string; name: string; isDir: true; entries: Entry[] }
  | { rel: string; name: string; isDir: false; text: string; kind: "md" | "yaml" | "text"; editable: boolean };

export function resolveDoc(rel: string): { abs: string; base: string; rel: string } | null {
  const clean = rel.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const parts = clean ? clean.split("/") : [];
  if (parts.some((s) => s === ".." || s === "" || s === ".")) return null;
  let base = OS_ROOT;
  let rest = clean;
  if (parts[0] === "j") {
    if (!isSetUp()) return null;
    base = String(map.journalDir());
    rest = parts.slice(1).join("/");
  } else if (parts[0] && DENY.has(parts[0])) {
    return null;
  }
  const abs = path.resolve(base, rest);
  if (abs !== base && !abs.startsWith(base + path.sep)) return null;
  return { abs, base, rel: clean };
}

export const docHref = (rel: string): string => `/doc/${rel.split("/").map(encodeURIComponent).join("/")}`;

/** The journal's own path on the page, whether it is inside the OS or an Obsidian folder. */
export const journalHref = (rel = ""): string => docHref(rel ? `j/${rel}` : "j");

export function readDoc(rel: string): Doc | null {
  const r = resolveDoc(rel);
  if (!r || !fs.existsSync(r.abs)) return null;
  const name = r.rel.split("/").pop() || (r.rel === "j" ? "journal" : "Personal OS");
  if (fs.statSync(r.abs).isDirectory()) {
    const entries = fs
      .readdirSync(r.abs, { withFileTypes: true })
      .filter((e) => !e.name.startsWith(".") && !(r.rel === "" && DENY.has(e.name)))
      .map((e) => ({ name: e.name, rel: r.rel ? `${r.rel}/${e.name}` : e.name, isDir: e.isDirectory() }))
      .sort((a, b) => Number(b.isDir) - Number(a.isDir) || b.name.localeCompare(a.name));
    return { rel: r.rel, name, isDir: true, entries };
  }
  const text = fs.readFileSync(r.abs, "utf8");
  const kind = /\.md$/i.test(name) ? "md" : /\.ya?ml$/i.test(name) ? "yaml" : "text";
  return { rel: r.rel, name, isDir: false, text, kind, editable: EDITABLE.test(name) };
}

/** Overwrite an existing text file. Never creates one, never touches anything binary. */
export function writeDoc(rel: string, text: string): boolean {
  const r = resolveDoc(rel);
  if (!r || !fs.existsSync(r.abs) || fs.statSync(r.abs).isDirectory() || !EDITABLE.test(r.abs)) return false;
  fs.writeFileSync(r.abs, text);
  return true;
}
