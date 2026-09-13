import Link from "next/link";
import { doctor, getMachine, isSetUp, logTail, map, providerModule, schedule, state, inbox } from "@/lib/os";
import { ControlActions } from "@/components/control-actions";

export const dynamic = "force-dynamic";

export default async function Control() {
  if (!isSetUp()) return <div className="card">Not set up yet.</div>;
  const m = getMachine();
  const prov = map.provider() as { kind: string; model: string; max_calls_per_day: number };
  const rhythm = map.rhythm() as { read_at: string; next_step: boolean };
  let provLine = "";
  try {
    const mod = await providerModule(prov.kind);
    provLine = `${mod.label}${prov.model ? ` · ${prov.model}` : ""} · ${mod.readiness()}`;
  } catch (e) {
    provLine = (e as Error).message;
  }
  const sched = schedule.status() as { installed: boolean; note: string };
  const d = (await doctor()) as { fails: { rule: string; msg: string; fix: string }[]; warns: { rule: string; msg: string; fix: string }[] };
  const runs = [...m.runs].reverse().slice(0, 10);
  const today = Number(state.callsToday(m));
  const dock = Number(inbox.dockCount());

  return (
    <>
      <div className="crumbs"><Link href="/">home</Link> / control</div>
      <h1>Control</h1>

      <section className="card">
        <div className="eyebrow">the read</div>
        <div>{m.paused ? <span className="bad">paused</span> : <span className="ok">on</span>} · at {rhythm.read_at} daily, your machine&apos;s clock · last: {m.last_read_at ? new Date(m.last_read_at).toLocaleString() : "never"} · calls today: {today} of {prov.max_calls_per_day}</div>
        <div className="small muted">{provLine}</div>
        <div className="small muted">schedule: {sched.note}</div>
        {dock > 0 && <div className="small muted">{dock} entr{dock === 1 ? "y" : "ies"} in the dock, not yet sorted</div>}
        <ControlActions paused={m.paused} />
      </section>

      <section className="card">
        <div className="eyebrow">doctor</div>
        {d.fails.length === 0 && d.warns.length === 0 && <div className="ok">clean</div>}
        {d.fails.map((f, i) => <div key={`f${i}`}><span className="bad">✗ {f.msg}</span> <span className="small muted">fix: {f.fix}</span></div>)}
        {d.warns.map((w, i) => <div key={`w${i}`}><span>! {w.msg}</span> <span className="small muted">{w.fix}</span></div>)}
      </section>

      <section className="card">
        <div className="eyebrow">the last calls</div>
        {runs.length === 0 ? <div className="muted small">none yet</div> : (
          <table className="runs">
            <thead><tr><th>when</th><th>ok</th><th>cost</th><th>time</th><th>sent</th><th>note</th></tr></thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.at).toLocaleString()}</td>
                  <td>{r.ok ? <span className="ok">yes</span> : <span className="bad">no</span>}</td>
                  <td>{r.cost_usd != null ? `$${r.cost_usd.toFixed(3)}` : "–"}</td>
                  <td>{r.ms ? `${Math.round(r.ms / 1000)}s` : "–"}</td>
                  <td>{r.in_bytes ? `${Math.round(r.in_bytes / 1000)} KB` : "–"}</td>
                  <td className="small muted">{r.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <div className="eyebrow">log</div>
        <pre>{logTail(20).join("\n") || "nothing yet"}</pre>
      </section>
    </>
  );
}
