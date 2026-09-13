import Link from "next/link";
import { notFound } from "next/navigation";
import { areaNotes, areaStats, isSetUp, journal, modules } from "@/lib/os";
import { docHref, readDoc } from "@/lib/files";
import { Markdown } from "@/components/markdown";
import { Editor } from "@/components/editor";

export const dynamic = "force-dynamic";

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSetUp()) notFound();
  const area = areaStats().find((a) => a.key === slug);
  if (!area) notFound();
  const readme = readDoc(`areas/${slug}/README.md`);
  const notes = areaNotes(slug);
  const mods = modules();
  const open = mods.goals ? ((journal.openGoals() as Record<string, string[]>)[slug] ?? []) : [];

  return (
    <>
      <div className="crumbs"><Link href="/">home</Link> / {area.label}</div>
      <section className="card">
        <h1>{area.label}</h1>
        {area.moving && <p className="muted">A day that moves this: {area.moving}</p>}
        {readme && !readme.isDir && (
          <>
            <Markdown text={readme.text.replace(/^#\s.*\n/, "")} />
            <Editor rel={readme.rel} text={readme.text} />
          </>
        )}
        <p className="small faint" style={{ marginTop: 10 }}>
          {area.lastTouched ? `touched ${area.lastTouched}` : "nothing written here yet"} · your coach: type <code>/coach-{slug}</code> in your AI
        </p>
      </section>

      {mods.goals && (
        <section className="card">
          <div className="eyebrow">open here</div>
          {open.length === 0 ? <div className="muted small">nothing open</div> : <ul className="plain">{open.map((t, i) => <li key={i}>{t}</li>)}</ul>}
        </section>
      )}

      <section className="card">
        <div className="row between">
          <div className="eyebrow">notes</div>
          <Link className="small muted" href={docHref(`areas/${slug}/notes`)}>the folder</Link>
        </div>
        {notes.length === 0 ? (
          <div className="muted small">Nothing yet. A coach files here; so does /triage. Or drop a file into <code>areas/{slug}/notes/</code>.</div>
        ) : (
          <div className="filelist">
            {notes.slice(0, 30).map((n) => (
              <Link key={n.rel} href={docHref(n.rel)}>{n.name} <span className="faint small">{n.date}</span></Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
