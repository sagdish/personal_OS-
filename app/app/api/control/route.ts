import path from "node:path";
import { spawn } from "node:child_process";
import { OS_ROOT, inbox, isSetUp, state } from "@/lib/os";

export async function POST(req: Request) {
  if (!isSetUp()) return Response.json({ error: "not set up" }, { status: 400 });
  const { op } = await req.json().catch(() => ({}));
  if (op === "pause" || op === "resume") {
    state.updateMachine((m: { paused: boolean }) => ({ ...m, paused: op === "pause" }));
    return Response.json({ ok: true, note: op === "pause" ? "paused" : "on" });
  }
  if (op === "sort") {
    const { moved } = inbox.sortDock() as { moved: number };
    return Response.json({ ok: true, note: `sorted ${moved}` });
  }
  if (op === "read") {
    // The read takes a minute or more: it runs on its own, and the page shows it when it lands.
    const child = spawn(process.execPath, [path.join(OS_ROOT, "bin", "os.mjs"), "read", "--force"], { cwd: OS_ROOT, detached: true, stdio: "ignore" });
    child.unref();
    return Response.json({ ok: true, note: "the read is running; refresh in a minute" });
  }
  return Response.json({ error: "unknown op" }, { status: 400 });
}
