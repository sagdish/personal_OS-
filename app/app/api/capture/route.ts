import { inbox, isSetUp } from "@/lib/os";

export async function POST(req: Request) {
  if (!isSetUp()) return Response.json({ error: "not set up" }, { status: 400 });
  const { text } = await req.json().catch(() => ({}));
  if (typeof text !== "string" || !text.trim()) return Response.json({ error: "empty" }, { status: 400 });
  const e = inbox.appendToDock(text);
  return Response.json({ ok: true, id: e?.id ?? null });
}
