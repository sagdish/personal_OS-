import { isSetUp, modules, practice } from "@/lib/os";

export async function POST(req: Request) {
  if (!isSetUp() || !modules().practice) return Response.json({ error: "practice is off" }, { status: 400 });
  const { key, on } = await req.json().catch(() => ({}));
  try {
    return Response.json({ ok: true, ticks: practice.setTick(String(key), Boolean(on)) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
