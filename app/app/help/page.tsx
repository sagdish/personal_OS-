import Link from "next/link";
import { areas, isSetUp, map, modules, readmeText } from "@/lib/os";
import { Markdown } from "@/components/markdown";

export const dynamic = "force-dynamic";

export default function Help() {
  const setUp = isSetUp();
  const mods = modules();
  return (
    <>
      <div className="crumbs"><Link href="/">home</Link> / help</div>
      {setUp && (
        <section className="card">
          <div className="eyebrow">your setup</div>
          <ul className="plain">
            {areas().map((a) => <li key={a.key}><strong>{a.label}</strong> — <code>/coach-{a.key}</code>{a.moving ? <span className="muted"> · {a.moving}</span> : null}</li>)}
            <li>modules: {Object.keys(mods).filter((k) => mods[k]).join(", ") || "none"}</li>
            <li>the read: at {(map.rhythm() as { read_at: string }).read_at}, via {(map.provider() as { kind: string }).kind}</li>
            <li>your journal: <code>{String(map.journalDir())}</code></li>
            <li>commands: <code>/setup</code> <code>/capture</code> <code>/triage</code> <code>/brief</code> {areas().map((a) => <code key={a.key}>/coach-{a.key} </code>)}<code>/coach-off</code>{mods.weekly ? <code> /weekly</code> : null}</li>
          </ul>
        </section>
      )}
      <section className="card">
        <Markdown text={readmeText()} />
      </section>
    </>
  );
}
