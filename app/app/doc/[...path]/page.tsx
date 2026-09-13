import Link from "next/link";
import { notFound } from "next/navigation";
import { docHref, readDoc } from "@/lib/files";
import { Markdown } from "@/components/markdown";
import { Editor } from "@/components/editor";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const rel = path.map(decodeURIComponent).join("/");
  const doc = readDoc(rel);
  if (!doc) notFound();

  const parts = doc.rel.split("/");
  const crumbs = parts.map((p, i) => ({ name: p === "j" && i === 0 ? "journal" : p, rel: parts.slice(0, i + 1).join("/") }));

  return (
    <>
      <div className="crumbs">
        <Link href="/">home</Link>
        {crumbs.map((c) => <span key={c.rel}> / <Link href={docHref(c.rel)}>{c.name}</Link></span>)}
      </div>
      {doc.isDir ? (
        <section className="card">
          <h1>{doc.name}</h1>
          <div className="filelist">
            {doc.entries.length === 0 && <div className="muted small">empty</div>}
            {doc.entries.map((e) => (
              <Link key={e.rel} href={docHref(e.rel)}>{e.isDir ? `${e.name}/` : e.name}</Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="card">
          {doc.kind === "md" ? <Markdown text={doc.text} /> : <pre>{doc.text}</pre>}
          <hr />
          {doc.editable && <Editor rel={doc.rel} text={doc.text} />}
        </section>
      )}
    </>
  );
}
