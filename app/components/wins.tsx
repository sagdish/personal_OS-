"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function Wins({ lines, href }: { lines: string[]; href: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  async function add() {
    if (!text.trim()) return;
    await fetch("/api/win", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    setText("");
    router.refresh();
  }
  return (
    <div className="card">
      <div className="row between">
        <div className="eyebrow">wins</div>
        <a className="small muted" href={href}>open wins.md</a>
      </div>
      {lines.length === 0 && <div className="muted small">Nothing yet. The first line goes here the day something lands.</div>}
      <ul className="plain">
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="one line, your words. Ugly counts." />
        <button className="btn" onClick={add}>add</button>
      </div>
    </div>
  );
}
