"use client";

import { useRouter } from "next/navigation";

type Item = { key: string; label: string };

export function PracticeStrip({ items, ticks }: { items: Item[]; ticks: Record<string, boolean> }) {
  const router = useRouter();
  async function toggle(key: string) {
    await fetch("/api/practice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, on: !ticks[key] }) });
    router.refresh();
  }
  return (
    <div className="card">
      <div className="eyebrow">today's practice</div>
      <div className="chips">
        {items.map((i) => (
          <button key={i.key} className={`chip${ticks[i.key] ? " on" : ""}`} onClick={() => toggle(i.key)} aria-pressed={Boolean(ticks[i.key])}>
            {i.label}
          </button>
        ))}
      </div>
      <div className="muted small">An empty box is not a failure. Nothing here counts a streak.</div>
    </div>
  );
}
