// `os apply`: the setup answers (_system/state/setup.yaml) -> the structure. Deterministic, no model.
// Creates what is missing, rewrites only what it owns (os.yaml, index.yaml, the coach skills,
// AGENTS.md, .gitignore, the MANAGER.md headings). Never touches the journal, notes, README prose
// or MANAGER.md prose. Safe to run again after a year.

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { OS_ROOT, STATE_DIR, abs } from "./root.mjs";
import { MODULES, isSetUp, map, writeMapText } from "./map.mjs";
import { ensureJournal } from "./journal.mjs";
import { MANAGER, expectedHeadings, split } from "./portrait.mjs";
import * as t from "./templates.mjs";

export const ANSWERS = path.join(STATE_DIR, "setup.yaml");

export function slugify(label, taken = new Set(), n = 1) {
  let s = String(label ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (!s) s = `area-${n}`;
  let out = s;
  let i = 2;
  while (taken.has(out)) out = `${s}-${i++}`;
  return out;
}

/** os.yaml -> the answers shape, so the structure can be rebuilt from the map alone. */
export function mapToAnswers(m) {
  return {
    name: m.owner,
    os_name: m.name,
    language: m.language,
    areas: (m.areas ?? []).map((x) => ({ key: x.key, label: x.label, moving: x.moving })),
    modules: m.modules ?? {},
    journal: m.journal ?? {},
    read_at: m.rhythm?.read_at,
    next_step: m.rhythm?.next_step,
    practice: m.practice ?? [],
    challenge: m.challenge ?? null,
    provider: { kind: m.provider?.kind, model: m.provider?.model, base_url: m.provider?.base_url },
    max_calls_per_day: m.provider?.max_calls_per_day,
    life_in_git: m.git?.life_in_git,
    port: m.app?.port,
  };
}

export function readAnswers() {
  if (!fs.existsSync(ANSWERS)) throw new Error(`no answers at ${path.relative(OS_ROOT, ANSWERS)}. Run /setup first.`);
  const a = YAML.parse(fs.readFileSync(ANSWERS, "utf8")) ?? {};
  return normalize(a);
}

export function normalize(a) {
  const problems = [];
  const name = String(a.name ?? "").trim();
  if (!name) problems.push("name is missing");
  const rawAreas = Array.isArray(a.areas) ? a.areas : [];
  if (rawAreas.length < 1 || rawAreas.length > 5) problems.push(`areas: ${rawAreas.length} given, the range is 1 to 5`);
  const taken = new Set();
  // Keys already in os.yaml keep their folder when the label is the same. A renamed label keeps
  // its key too, matched by position, so a rename never orphans a folder.
  const existing = isSetUp() ? map().areas ?? [] : [];
  const areas = rawAreas.map((x, i) => {
    const label = String(typeof x === "string" ? x : x?.label ?? "").trim();
    if (!label) problems.push(`area ${i + 1} has no label`);
    const prior = existing.find((e) => e.label.toLowerCase() === label.toLowerCase()) ?? existing[i];
    const key = x?.key && /^[a-z0-9][a-z0-9-]*$/.test(x.key) ? x.key : prior?.key ?? slugify(label, taken, i + 1);
    taken.add(key);
    return { key, label, moving: String(x?.moving ?? "").trim(), about: String(x?.about ?? "").trim() };
  });
  const modules = Object.fromEntries(MODULES.map((k) => [k, Boolean(a.modules?.[k])]));
  const practice = (Array.isArray(a.practice) ? a.practice : []).map((p, i) => {
    const label = String(typeof p === "string" ? p : p?.label ?? "").trim();
    return { key: p?.key && /^[a-z0-9][a-z0-9-]*$/.test(p.key) ? p.key : slugify(label, new Set(), i + 1), label };
  }).filter((p) => p.label);
  if (modules.practice && !practice.length) problems.push("practice is on but no items were given");
  if (modules.challenge && !String(a.challenge?.name ?? "").trim()) problems.push("challenge is on but has no name");
  const journal = { obsidian: Boolean(a.journal?.obsidian), path: String(a.journal?.path ?? "").trim() || "journal" };
  const provider = { kind: String(a.provider?.kind ?? "claude-code").trim() || "claude-code", model: String(a.provider?.model ?? "").trim(), base_url: String(a.provider?.base_url ?? "").trim() };
  if (!["claude-code", "anthropic", "openai-compatible"].includes(provider.kind)) problems.push(`provider.kind "${provider.kind}" is not claude-code, anthropic or openai-compatible`);
  const read_at = String(a.read_at ?? "08:30").trim();
  if (!/^\d{1,2}:\d{2}$/.test(read_at)) problems.push(`read_at "${read_at}" is not HH:MM`);
  if (problems.length) throw new Error(`cannot apply:\n  - ${problems.join("\n  - ")}`);
  return {
    name,
    os_name: String(a.os_name ?? "").trim() || `${name}'s OS`,
    language: String(a.language ?? "en").trim() || "en",
    areas,
    voice: String(a.voice ?? "").trim(),
    never: String(a.never ?? "").trim(),
    about: String(a.about ?? "").trim(),
    journal,
    read_at,
    next_step: Boolean(a.next_step),
    modules,
    practice,
    challenge: a.challenge ?? null,
    provider,
    max_calls_per_day: Number(a.max_calls_per_day ?? 3) || 3,
    life_in_git: Boolean(a.life_in_git),
    port: Number(a.port ?? 3300) || 3300,
  };
}

const writeIfMissing = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) return false;
  fs.writeFileSync(file, text);
  return true;
};

/**
 * The source is os.yaml once it exists: edit it by hand and run `os apply`. The interview writes the
 * answers file and runs `os apply --from-answers`, which turns the answers into os.yaml first.
 */
export function apply({ fromAnswers = false } = {}) {
  const done = [];
  let a;
  if (fromAnswers || (!isSetUp() && fs.existsSync(ANSWERS))) {
    a = readAnswers();
    done.push("os.yaml, from the setup answers");
  } else if (isSetUp()) {
    a = normalize(mapToAnswers(map()));
    done.push("os.yaml, as it is");
  } else {
    throw new Error("nothing to build from: no os.yaml and no setup answers. Run /setup.");
  }
  // The map, in its canonical form. Only this function writes it.
  writeMapText(t.osYaml(a));

  // The areas.
  for (const x of a.areas) {
    const dir = abs(path.join("areas", x.key));
    fs.mkdirSync(path.join(dir, "notes"), { recursive: true });
    fs.writeFileSync(path.join(dir, "index.yaml"), t.areaIndex(x));
    writeIfMissing(path.join(dir, "notes", ".gitkeep"), "");
    if (writeIfMissing(path.join(dir, "README.md"), t.areaReadme(x))) done.push(`areas/${x.key}/README.md`);
  }
  done.push(`${a.areas.length} area${a.areas.length === 1 ? "" : "s"}`);

  // The journal.
  ensureJournal();
  done.push(`journal at ${a.journal.path}`);

  // The portrait: the skeleton once; missing headings appended, existing text untouched.
  if (writeIfMissing(MANAGER, t.managerSkeleton(a))) done.push("MANAGER.md skeleton (the words are still to be written)");
  else {
    const text = fs.readFileSync(MANAGER, "utf8");
    const { parts } = split(text);
    const missing = expectedHeadings().filter((h) => !parts.has(h));
    if (missing.length) {
      fs.appendFileSync(MANAGER, `\n${missing.map((h) => `${h}\n`).join("\n")}`);
      done.push(`MANAGER.md: added ${missing.join(", ")}`);
    }
  }

  // The instructions and the commands.
  fs.writeFileSync(path.join(OS_ROOT, "AGENTS.md"), t.agentsMd(a));
  done.push("AGENTS.md");
  const skills = path.join(OS_ROOT, ".claude", "skills");
  for (const x of a.areas) {
    fs.mkdirSync(path.join(skills, `coach-${x.key}`), { recursive: true });
    fs.writeFileSync(path.join(skills, `coach-${x.key}`, "SKILL.md"), t.coachSkill(x, a));
  }
  const keep = new Set(a.areas.map((x) => `coach-${x.key}`));
  for (const e of fs.existsSync(skills) ? fs.readdirSync(skills) : []) {
    if (e.startsWith("coach-") && e !== "coach-off" && !keep.has(e)) fs.rmSync(path.join(skills, e), { recursive: true, force: true });
  }
  done.push(`${a.areas.length} coach command${a.areas.length === 1 ? "" : "s"}`);

  // git: the base list plus, unless they want their life in git, the life list.
  const gi = path.join(OS_ROOT, ".gitignore");
  const base = (fs.existsSync(gi) ? fs.readFileSync(gi, "utf8") : "").split("\n# Your life.")[0].trimEnd() + "\n";
  fs.writeFileSync(gi, a.life_in_git ? base : base + t.gitignoreLife(a.journal.path));
  done.push(a.life_in_git ? ".gitignore (life committed)" : ".gitignore (life kept out of git)");

  if (writeIfMissing(path.join(OS_ROOT, "STATUS.md"), t.statusPlaceholder(a))) done.push("STATUS.md placeholder");
  fs.mkdirSync(path.join(STATE_DIR, "coach"), { recursive: true });

  return { answers: a, done };
}
