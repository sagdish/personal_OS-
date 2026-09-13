import { marked } from "marked";

/** Markdown to HTML, frontmatter stripped. A local page rendering the user's own files. */
export function Markdown({ text }: { text: string }) {
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const html = marked.parse(body, { async: false, gfm: true }) as string;
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}
