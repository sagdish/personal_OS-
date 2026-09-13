"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type GoalGroup = { key: string | null; label: string; tasks: { text: string; line: string }[] };

export function Goals({ groups, href }: { groups: GoalGroup[]; href: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState<string | null>(null);
  const [text, setText] = useState("");

  async function done(line: string) {
    await fetch("/api/goal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ line, done: true }) });
    router.refresh();
  }
  async function add(area: string | null) {
    if (!text.trim()) return;
    await fetch("/api/goal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, area }) });
    setText("");
    setAdding(null);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="row between">
        <div className="eyebrow">your list</div>
        <a className="small muted" href={href}>open goals.md</a>
      </div>
      {groups.every((g) => g.tasks.length === 0) && <div className="muted small">Nothing open. Add a line, or write one anywhere and the read files it.</div>}
      {groups.map((g) => (
        <div key={g.label} className="group">
          <div className="row between">
            <div className="label">{g.label}</div>
            <button className="linkish" onClick={() => setAdding(adding === g.label ? null : g.label)}>+ add</button>
          </div>
          {g.tasks.map((t) => (
            <label key={t.line} className="task">
              <input type="checkbox" onChange={() => done(t.line)} />
              <span>{t.text}</span>
            </label>
          ))}
          {adding === g.label && (
            <div className="row">
              <input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(g.key); if (e.key === "Escape") setAdding(null); }} placeholder="one task, your words" />
              <button className="btn" onClick={() => add(g.key)}>add</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
