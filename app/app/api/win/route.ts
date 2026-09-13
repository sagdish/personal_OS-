import { isSetUp, journal, modules } from "@/lib/os";

export async function POST(req: Request) {
  if (!isSetUp() || !modules().wins) return Response.json({ error: "wins is off" }, { status: 400 });
  const { text } = await req.json().catch(() => ({}));
  if (typeof text !== "string" || !text.trim()) return Response.json({ error: "empty" }, { status: 400 });
  journal.appendWin(text.trim());
  return Response.json({ ok: true });
}
