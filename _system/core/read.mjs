// The read: one paid call a day. Gathers the facts, hands them to the model with MANAGER.md as its
// identity, validates the answer, writes the one object every surface renders, files your inbox
// entries where the model said, tells you. A failed call keeps the previous read and says so.

import fs from "node:fs";
import path from "node:path";
import { OS_ROOT, localDate, log } from "./root.mjs";
import { areas, journalFile, modules, osName, provider, rhythm } from "./map.mjs";
import { callsToday, readMachine, readRanToday, recordRun, updateMachine, writeRead } from "./state.mjs";
import { gatherFacts } from "./facts.mjs";
import { readPortrait } from "./portrait.mjs";
import { renderJournalCopy, renderStatus } from "./render.mjs";
import { findEntry, sortDock } from "./inbox.mjs";
import { appendChallenge, appendGoal, appendWin } from "./journal.mjs";
import { notify } from "./notify.mjs";

export const STATUS = path.join(OS_ROOT, "STATUS.md");
export const COOLDOWN_MS = 10 * 60 * 1000;

const PROVIDERS = {
  "claude-code": () => import("./providers/claude-code.mjs"),
  anthropic: () => import("./providers/anthropic.mjs"),
  "openai-compatible": () => import("./providers/openai-compatible.mjs"),
};

export async function providerModule(kind = provider().kind) {
  const load = PROVIDERS[kind];
  if (!load) throw new Error(`unknown provider "${kind}" in os.yaml. One of: ${Object.keys(PROVIDERS).join(", ")}.`);
  return load();
}

export const TASK = `You are the voice of this personal OS. The system prompt is the portrait of the person it belongs to: who they are and how to talk to them. Speak to them directly, as "you", in their language (FACTS.language), in the voice the portrait describes.

Return exactly ONE JSON object and nothing else, with these keys:

"where": three to six sentences. Where they stand today, built from their own words in FACTS (daily notes, inbox entries) when there are any, otherwise from what moved. No counts, no percentages, no streaks, no "behind", no grades, no praise for its own sake. A quiet day is not a miss and is never mentioned as one. Do not repeat FACTS.history; if you would say the same thing a third time, say instead that you keep noticing it and leave it there.

"areas": an object with one short line per key in FACTS.areas, or "" when there is nothing to say about that area today.

"moved": a list of short lines, what happened since the last read that FACTS shows. An empty list is a real answer.

"ask": one question for them, only if something in their words needs it. Otherwise null. Never two.

"next": null. Only if FACTS.next_step is true: one small step in the direction their own words point, or null. Never a chore about this OS, never a list.

"file": which inbox entries to copy, as a list of {"id": "...", "to": "wins" | "goals" | "challenge", "area": "<area key>" | null}. "wins" when the entry says something was finished, shipped, done or overcome. "goals" when it is a task they gave themselves; set "area" to the area it belongs to. "challenge" when it is an attempt for their challenge (FACTS.challenge). Use only ids from FACTS.inbox whose "filed" is null, and only the destinations named in FACTS.modules. When unsure, leave it out. You never rewrite their words: the machine copies the entry itself.

If FACTS.first_read is true, this is the first read ever: say so in one line, say what the OS now holds for them in their words, and leave "moved" empty. Files created by the setup itself are not something they did.

Use only what FACTS holds. If FACTS._trimmed is present, what it names was not shown to you.`;

class Refusal extends Error {
  constructor(msg) {
    super(msg);
    this.soft = true;
  }
}

/** Pull the JSON object out of a reply that may wrap it in prose or a fence. */
export function parseJudgment(text, facts) {
  const s = String(text ?? "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a === -1 || b <= a) throw new Error("the model returned no JSON object");
  let j;
  try {
    j = JSON.parse(s.slice(a, b + 1));
  } catch (e) {
    throw new Error(`the model's JSON does not parse: ${e.message}`);
  }
  if (typeof j.where !== "string" || !j.where.trim()) throw new Error('"where" is missing or empty');

  const known = new Set(areas().map((x) => x.key));
  const out = {
    where: j.where.trim(),
    areas: Object.fromEntries(Object.entries(j.areas ?? {}).filter(([k]) => known.has(k)).map(([k, v]) => [k, String(v ?? "").trim()])),
    moved: Array.isArray(j.moved) ? j.moved.map((m) => (typeof m === "string" ? m : m?.what ?? JSON.stringify(m))).filter(Boolean) : [],
    ask: typeof j.ask === "string" && j.ask.trim() ? j.ask.trim() : null,
    next: rhythm().next_step && typeof j.next === "string" && j.next.trim() ? j.next.trim() : null,
    file: [],
  };
  const mods = modules();
  const ids = new Map((Array.isArray(facts.inbox) ? facts.inbox : []).map((e) => [e.id, e]));
  for (const f of Array.isArray(j.file) ? j.file : []) {
    const e = ids.get(f?.id);
    if (!e || e.filed) continue;
    if (!["wins", "goals", "challenge"].includes(f.to) || !mods[f.to]) continue;
    out.file.push({ id: f.id, to: f.to, area: known.has(f.area) ? f.area : null });
  }
  return out;
}

/** Copy one inbox entry to its destination, verbatim, once. Shared by the read and `os file`. */
export function fileEntry(id, to, area = null) {
  const mods = modules();
  if (!["wins", "goals", "challenge"].includes(to)) throw new Error(`"${to}" is not a destination. Use wins, goals or challenge.`);
  if (!mods[to]) throw new Error(`the ${to} module is off in os.yaml.`);
  const m = readMachine();
  if (m.filed?.[id]?.to === to) return { id, to, skipped: "already filed" };
  const e = findEntry(id);
  if (!e) throw new Error(`no inbox entry with id ${id} in the last 90 days.`);
  if (to === "wins") appendWin(e.text, e.date);
  else if (to === "goals") appendGoal(e.text, area);
  else appendChallenge(e.text, e.date);
  updateMachine((mm) => ({ ...mm, filed: { ...mm.filed, [id]: { to, area, at: new Date().toISOString() } } }));
  return { id, to, area, text: e.text };
}

export async function runRead({ manual = false, force = false, dryRun = false } = {}) {
  const prov = provider();
  const m = readMachine();
  if (m.paused && !force) throw new Refusal("the read is paused. Turn it on at /control, or run with --force.");
  if (!manual && readRanToday(m)) throw new Refusal("already ran today.");
  if (manual && !force && m.last_read_at && Date.now() - Date.parse(m.last_read_at) < COOLDOWN_MS) {
    const min = Math.round((Date.now() - Date.parse(m.last_read_at)) / 60000);
    throw new Refusal(`the read from ${min} minute${min === 1 ? "" : "s"} ago is on the page. --force runs it again.`);
  }
  if (callsToday(m) >= prov.max_calls_per_day && !force) {
    throw new Refusal(`the daily cap of ${prov.max_calls_per_day} calls is reached. Raise it in os.yaml, or --force.`);
  }

  const system = readPortrait();
  if (!system) throw new Error("MANAGER.md is missing: the read has no identity. Run /setup.");

  try {
    sortDock();
  } catch (e) {
    log(`read: inbox sort failed: ${e.message}`);
  }
  const facts = gatherFacts();
  const prompt = `${TASK}\n\n=== FACTS (computed from disk; true; interpolate, never restate counts) ===\n${JSON.stringify(facts)}`;
  if (dryRun) return { dryRun: true, prompt, system, facts };

  const mod = await providerModule(prov.kind);
  const started = Date.now();
  let out;
  try {
    out = await mod.call({ system, prompt, model: prov.model || "", baseUrl: prov.base_url || "", timeoutMs: 300000 });
  } catch (e) {
    recordRun({ ok: false, provider: prov.kind, ms: Date.now() - started, in_bytes: prompt.length + system.length, error: String(e.message).slice(0, 300) });
    log(`read FAILED provider=${prov.kind} ${e.message}`);
    throw new Error(`the read failed: ${e.message}. The previous read is kept.`);
  }

  let judgment;
  try {
    judgment = parseJudgment(out.text, facts);
  } catch (e) {
    recordRun({ ok: false, provider: prov.kind, cost_usd: out.cost_usd, ms: Date.now() - started, in_bytes: prompt.length + system.length, error: e.message });
    log(`read FAILED unparseable: ${e.message}`);
    throw new Error(`the read failed: ${e.message}. The previous read is kept.`);
  }

  const read = {
    at: new Date().toISOString(),
    date: localDate(),
    provider: prov.kind,
    model: prov.model || null,
    cost_usd: out.cost_usd,
    usage: out.usage,
    facts,
    judgment,
    history: facts.history,
  };
  writeRead(read);
  recordRun({ ok: true, provider: prov.kind, cost_usd: out.cost_usd, ms: Date.now() - started, in_bytes: prompt.length + system.length, out_chars: out.text.length });
  updateMachine((mm) => ({ ...mm, last_read_at: read.at }));

  // Everything after this point is delivery. The read is safely on disk; a delivery fault is
  // logged, never fatal, never a reason to lose what was paid for.
  const filed = [];
  try {
    fs.writeFileSync(STATUS, renderStatus(read));
  } catch (e) {
    log(`read: STATUS.md write failed: ${e.message}`);
  }
  try {
    const dir = journalFile("reads");
    fs.mkdirSync(dir, { recursive: true });
    let file = path.join(dir, `${read.date}.md`);
    let n = 2;
    while (fs.existsSync(file)) file = path.join(dir, `${read.date}-${n++}.md`);
    fs.writeFileSync(file, renderJournalCopy(read));
  } catch (e) {
    log(`read: journal copy failed: ${e.message}`);
  }
  for (const f of judgment.file) {
    try {
      const r = fileEntry(f.id, f.to, f.area);
      if (!r.skipped) filed.push(r);
    } catch (e) {
      log(`read: filing ${f.id} -> ${f.to} failed: ${e.message}`);
    }
  }
  await notify(osName(), judgment.where.split("\n")[0].slice(0, 200)).catch(() => {});
  log(`read ok provider=${prov.kind} cost=${out.cost_usd ?? "?"} ms=${Date.now() - started} in=${prompt.length + system.length} filed=${filed.length}`);
  return { read, filed };
}

/** Is the scheduled read due right now? Local clock past rhythm.read_at, not run today, not paused. */
export function readDue(now = new Date()) {
  const m = readMachine();
  if (m.paused || readRanToday(m)) return false;
  const [h, min] = String(rhythm().read_at || "08:30").split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + (min || 0);
}
