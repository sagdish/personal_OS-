"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function Capture() {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/capture", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    setBusy(false);
    if (res.ok) {
      setText("");
      setNote("captured. The read files it, or /triage does.");
      router.refresh();
    } else setNote("could not write to the dock");
  }

  return (
    <div className="card">
      <div className="eyebrow">capture</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send(); }}
        placeholder="anything, any format. It lands in your inbox, word for word."
        rows={3}
      />
      <div className="row">
        <button className="btn" onClick={send} disabled={busy || !text.trim()}>keep it</button>
        <span className="muted small">{note || "⌘⏎ / Ctrl⏎"}</span>
      </div>
    </div>
  );
}
