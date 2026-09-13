// What `os apply` writes. Plain functions returning text: no placeholders left behind, nothing that
// asks the user to fill something in later.

import YAML from "yaml";

const yamlStr = (s) => JSON.stringify(String(s ?? ""));

export function osYaml(a) {
  const header = `# ${a.os_name} — the map. Written by \`os apply\` from your setup answers; edit by hand if you like.
# Areas: 1 to 5, no more. Modules are on or off. The read runs at read_at, your machine's clock.
`;
  const doc = {
    version: 1,
    name: a.os_name,
    owner: a.name,
    language: a.language || "en",
    areas: a.areas.map((x) => ({ key: x.key, label: x.label, moving: x.moving || "" })),
    modules: { wins: !!a.modules.wins, goals: !!a.modules.goals, practice: !!a.modules.practice, challenge: !!a.modules.challenge, weekly: !!a.modules.weekly },
    rhythm: { read_at: a.read_at || "08:30", next_step: !!a.next_step },
    provider: { kind: a.provider.kind || "claude-code", model: a.provider.model || "", base_url: a.provider.base_url || "", max_calls_per_day: Number(a.max_calls_per_day || 3) },
    journal: { path: a.journal.path || "journal", obsidian: !!a.journal.obsidian },
    git: { life_in_git: !!a.life_in_git },
    practice: (a.practice ?? []).map((p) => ({ key: p.key, label: p.label })),
    challenge: a.modules.challenge ? { name: a.challenge?.name || "", from: a.challenge?.from || "", to: a.challenge?.to || "", rule: a.challenge?.rule || "" } : null,
    app: { port: Number(a.port || 3300) },
  };
  return header + YAML.stringify(doc);
}

export const areaIndex = (x) =>
  `# ${x.label} — what this area is and what is inside. Written by \`os apply\`; the page reads it.
key: ${x.key}
label: ${yamlStr(x.label)}
moving: ${yamlStr(x.moving || "")}
collections:
  - {key: notes, label: Notes, path: notes/, glob: "**/*.md"}
`;

export const areaReadme = (x) =>
  `# ${x.label}\n\n${x.about ? `${x.about.trim()}\n\n` : ""}${x.moving ? `A day that moves this area: ${x.moving.trim()}\n` : ""}`;

export const managerSkeleton = (a) =>
  `# MANAGER — who ${a.name} is, and how every voice here talks to them

<!-- Your portrait. The daily read gets this whole file as its identity; a coach gets Core, Voice
and its own area. Edit anything; keep the headings. Written at setup, in your words, from what you
said. -->

## Core

## Voice

${a.areas.map((x) => `## ${x.label}\n`).join("\n")}`;

export function agentsMd(a) {
  const mods = a.modules;
  const rules = [
    `Their words stay theirs. Copy verbatim, never paraphrase, never delete. \`${a.journal.path || "journal"}/\` is theirs; you append there only through the routines below.`,
    a.next_step
      ? "They asked for one suggested next step a day, from the read. In a session, suggest a step only when asked."
      : "Never assign them work. No next action, no plan, no chore, unless they ask for one.",
    "A quiet day is evidence of nothing. Never count, score, streak or audit their days.",
    "Check what exists before creating anything (`ls`). Something close is the thing.",
    mods.wins ? 'When something is finished, shipped or overcome, one line goes to wins the same turn: `node bin/os.mjs win "their words"`.' : null,
    mods.goals ? "A task goes to goals.md under its area, never to a list of your own." : null,
    `Speak in ${a.language || "their language"}, in the voice MANAGER.md describes.`,
    "Do not edit `_system/`. Do not edit `os.yaml` unless they ask; `os apply` rewrites it from setup answers.",
  ].filter(Boolean);

  const where = [
    ["`STATUS.md`", "where they stand, written by the daily read. Read it first."],
    ["`MANAGER.md`", "their portrait: who they are, how to talk to them. `node bin/os.mjs portrait <area>` prints one voice's slice."],
    ["`os.yaml`", "the map: areas, modules, rhythm, provider, paths."],
    ...a.areas.map((x) => [`\`areas/${x.key}/\``, `${x.label}. README.md in their words, notes/ for anything.${x.moving ? ` Moves when: ${x.moving}` : ""}`]),
    [`\`${a.journal.path || "journal"}/\``, "their writing: inbox.md (the dock), inbox/ (entries kept by day), daily/ (one note a day), reads/ (every read)."],
    mods.wins ? [`\`${a.journal.path || "journal"}/wins.md\``, "one line per thing done. Append-only."] : null,
    mods.goals ? [`\`${a.journal.path || "journal"}/goals.md\``, "the task list, one heading per area."] : null,
    mods.challenge ? [`\`${a.journal.path || "journal"}/challenge.md\``, `the record of "${a.challenge?.name || "the challenge"}": one dated line per attempt, never counted.`] : null,
  ].filter(Boolean);

  const commands = [
    ["/setup", "the interview again. Changes only what they change."],
    ["/capture", "append what they just said to the dock, verbatim."],
    ["/triage", "sort the dock now: copy entries to wins, goals, the record, an area. Removes nothing."],
    ["/brief", "run the read now."],
    ...a.areas.map((x) => [`/coach-${x.key}`, `the ${x.label} coach.`]),
    ["/coach-off", "drop the coach."],
    mods.weekly ? ["/weekly", "the week from above, written to the journal."] : null,
  ].filter(Boolean);

  return `# ${a.os_name} — instructions for the AI

This folder is ${a.name}'s Personal OS: their life as plain files, plus a machine that reads them
once a day. You are a voice in it. Read \`STATUS.md\` first.

## Rules

${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Where things are

${where.map(([k, v]) => `- ${k} — ${v}`).join("\n")}

## Routines

Each one is a file in \`.claude/skills/<name>/SKILL.md\`. Claude Code: type the command. Any other
tool: read the file and follow it.

${commands.map(([k, v]) => `- \`${k}\` — ${v}`).join("\n")}

## The machine

\`node bin/os.mjs <command>\`: status · doctor · read · capture · win · file · inbox · portrait · apply.
The page runs at http://localhost:${a.port || 3300}. The manual is \`README.md\`.
`;
}

export const coachSkill = (x, a) =>
  `---
description: "/coach-${x.key} — the ${x.label} coach"
disable-model-invocation: true
---

You are ${a.name}'s coach for **${x.label}** until they load another /coach-* or say stop.

**First, who they are and how to talk to them:** run \`node bin/os.mjs portrait ${x.key}\` and read
what it prints: the shared part of their portrait plus this area's section, nothing from the others.

**Then the area:** \`areas/${x.key}/README.md\`, the files in \`areas/${x.key}/notes/\` (names first,
open only what the conversation needs), ${a.modules.goals ? `the open tasks under "${x.label}" in the journal's goals.md, ` : ""}and
where the last session stopped: \`_system/state/coach/${x.key}.md\` if it exists. Do not ask them to
re-explain what is written there.${x.moving ? `\n\nA day that moves this area, in their words: ${x.moving}` : ""}

**How to be in this:** answer first, short. Their words are the material; quote them, never a
version of them. ${a.next_step ? "Suggest a step only when asked, one, small." : "Never assign work: no next action, no plan, unless they ask for one."} A
quiet stretch is not a failure and is never counted at them. Unverified is said so.
${a.modules.wins ? '\n**When something is finished, shipped or overcome**, one line to wins, same turn, their words: `node bin/os.mjs win "..."`.\n' : ""}${a.modules.goals ? `**A task** goes to goals.md under "${x.label}", their words. A note worth keeping goes to \`areas/${x.key}/notes/<date>-<slug>.md\`, verbatim.\n` : `**A note worth keeping** goes to \`areas/${x.key}/notes/<date>-<slug>.md\`, verbatim.\n`}
**At the end, or the moment it drifts:** write three lines to \`_system/state/coach/${x.key}.md\`:
\`last:\` the date, \`stopped_at:\` where the thread stopped, \`next:\` the one thing to pick up. That
file is how the next session starts without a re-explanation.
`;

export const gitignoreLife = (journalPath) => `
# Your life. Not committed: this folder can be a public fork and leak nothing.
# Set git.life_in_git: true in os.yaml and re-run \`os apply\` to commit everything (a private backup repo).
os.yaml
MANAGER.md
STATUS.md
AGENTS.md
areas/
${journalPath && !journalPath.startsWith("/") && !journalPath.startsWith("~") ? `${journalPath.replace(/\/$/, "")}/\n` : ""}.claude/skills/coach-*/
!.claude/skills/coach-off/
`;

export const statusPlaceholder = (a) =>
  `# Where ${a.name} stands\n\nNo read yet. It runs at ${a.read_at || "08:30"} every day once the schedule is installed (\`os install\`), or now with \`os read\`.\n`;
