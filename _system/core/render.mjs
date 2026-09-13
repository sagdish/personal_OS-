// STATUS.md and the journal copy, rendered from read.json. A view, never a source. Nothing here
// adds a number the model did not write, and the model was told to write none.

import { areas, osName } from "./map.mjs";

export function renderRead(read, { title = true } = {}) {
  const j = read.judgment;
  const out = [];
  if (title) out.push(`# ${osName()} — ${read.date}`, "");
  out.push(j.where.trim(), "");

  const lines = areas()
    .map((a) => [a.label, String(j.areas?.[a.key] ?? "").trim()])
    .filter(([, line]) => line);
  if (lines.length) {
    out.push("## Areas", "");
    for (const [label, line] of lines) out.push(`- **${label}** — ${line}`);
    out.push("");
  }
  if (j.moved?.length) {
    out.push("## Moved", "");
    for (const m of j.moved) out.push(`- ${String(m).trim()}`);
    out.push("");
  }
  if (j.ask) out.push("## A question for you", "", j.ask.trim(), "");
  if (j.next) out.push("## One next step", "", j.next.trim(), "");
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export const renderStatus = (read) =>
  `---\nat: ${read.at}\ndate: ${read.date}\n---\n\n# Where ${read.facts?.name || "you"} stand${read.facts?.name ? "s" : ""} — ${read.date}\n\n${renderRead(read, { title: false })}`;

export const renderJournalCopy = (read) =>
  `---\ndate: ${read.date}\nat: ${read.at}\nprovider: ${read.provider}${read.model ? `\nmodel: ${read.model}` : ""}${read.cost_usd != null ? `\ncost_usd: ${read.cost_usd.toFixed(4)}` : ""}\n---\n\n${renderRead(read)}`;
