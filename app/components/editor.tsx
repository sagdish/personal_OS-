"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** A plain editor: what you see is the file, comments and frontmatter included. */
export function Editor({ rel, text }: { rel: string; text: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(text);
  const [note, setNote] = useState("");
  const router = useRouter();

  async function save() {
    const res = await fetch("/api/file", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ rel, text: value }) });
    setNote(res.ok ? "saved" : "not saved");
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <div className="row">
        <button className="btn ghost" onClick={() => { setValue(text); setOpen(true); setNote(""); }}>edit</button>
        <span className="muted small">{note}</span>
      </div>
    );
  }
  return (
    <div>
      <textarea className="editor" value={value} onChange={(e) => setValue(e.target.value)} rows={Math.min(40, Math.max(12, value.split("\n").length + 2))} spellCheck={false} />
      <div className="row">
        <button className="btn" onClick={save}>save</button>
        <button className="btn ghost" onClick={() => setOpen(false)}>cancel</button>
        <span className="muted small">{note}</span>
      </div>
    </div>
  );
}
