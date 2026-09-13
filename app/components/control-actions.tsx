"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ControlActions({ paused }: { paused: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function op(name: string) {
    setBusy(true);
    const res = await fetch("/api/control", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: name }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    setNote(j.note ?? (res.ok ? "done" : "failed"));
    router.refresh();
  }

  return (
    <div className="row wrap">
      <button className="btn" disabled={busy} onClick={() => op("read")}>run the read now</button>
      <button className="btn ghost" disabled={busy} onClick={() => op(paused ? "resume" : "pause")}>{paused ? "resume the read" : "pause the read"}</button>
      <button className="btn ghost" disabled={busy} onClick={() => op("sort")}>sort the inbox</button>
      <button className="btn ghost" disabled={busy} onClick={() => router.refresh()}>refresh</button>
      <span className="muted small">{note}</span>
    </div>
  );
}
