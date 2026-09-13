import { isSetUp, journal, modules } from "@/lib/os";

export async function POST(req: Request) {
  if (!isSetUp() || !modules().goals) return Response.json({ error: "goals is off" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.line === "string") {
    const ok = journal.setGoalDone(body.line, body.done !== false);
    return ok ? Response.json({ ok: true }) : Response.json({ error: "that line is not in goals.md any more" }, { status: 409 });
  }
  if (typeof body.text === "string" && body.text.trim()) {
    journal.appendGoal(body.text, typeof body.area === "string" ? body.area : null);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "give a line to tick, or a text to add" }, { status: 400 });
}
