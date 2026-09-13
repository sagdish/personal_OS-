import Link from "next/link";
import { isSetUp, journal } from "@/lib/os";
import { journalHref } from "@/lib/files";

export const dynamic = "force-dynamic";

export default function History() {
  if (!isSetUp()) return <div className="card">Not set up yet.</div>;
  const reads = journal.listReads(60) as { file: string; text: string }[];
  return (
    <>
      <div className="crumbs"><Link href="/">home</Link> / history</div>
      <h1>Every read</h1>
      <p className="muted">Newest first. Each one is a file in your journal, kept for good.</p>
      {reads.length === 0 && <div className="card muted">No reads yet.</div>}
      {reads.map((r) => {
        const body = r.text.replace(/^---[\s\S]*?\n---\n/, "").replace(/^#\s.*\n/, "").trim();
        const first = body.split(/\n{2,}/)[0];
        return (
          <section key={r.file} className="card">
            <div className="row between">
              <div className="eyebrow">{r.file.replace(/\.md$/, "")}</div>
              <Link className="small muted" href={journalHref(`reads/${r.file}`)}>open</Link>
            </div>
            <p>{first}</p>
          </section>
        );
      })}
    </>
  );
}
