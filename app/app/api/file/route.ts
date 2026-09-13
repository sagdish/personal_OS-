import { writeDoc } from "@/lib/files";

export async function PUT(req: Request) {
  const { rel, text } = await req.json().catch(() => ({}));
  if (typeof rel !== "string" || typeof text !== "string") return Response.json({ error: "rel and text" }, { status: 400 });
  return writeDoc(rel, text) ? Response.json({ ok: true }) : Response.json({ error: "not a file this page may write" }, { status: 400 });
}
