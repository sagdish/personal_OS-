// Home: the read, capture, the areas, then only the modules you turned on. Nothing here assigns
// work, counts a streak or says "behind".

import Link from "next/link";
import { areaStats, areas, getRead, isSetUp, journal, machineNotes, map, modules, practice } from "@/lib/os";
import { journalHref } from "@/lib/files";
import { Capture } from "@/components/capture";
import { Goals, type GoalGroup } from "@/components/goals";
import { Wins } from "@/components/wins";
import { PracticeStrip } from "@/components/practice-strip";

export const dynamic = "force-dynamic";

function NotSetUp() {
  return (
    <div className="card">
      <h1>Personal OS</h1>
      <p>Not set up yet. It takes about ten minutes, one question at a time.</p>
      <ol>
        <li>Open your AI in this folder. Claude Code: run <code>claude</code> here and type <code>/setup</code>. Another tool: tell it &ldquo;open SETUP.md and follow it&rdquo;.</li>
        <li>Answer the questions.</li>
      </ol>
      <p className="muted small">This page comes alive on its own when setup ends.</p>
    </div>
  );
}

export default function Home() {
  if (!isSetUp()) return <NotSetUp />;
  const read = getRead();
  const mods = modules();
  const stats = areaStats();
  const notes = machineNotes();
  const rhythm = map.rhythm() as { read_at: string };
  const owner = String(map.owner());

  const goalGroups: GoalGroup[] = mods.goals
    ? (() => {
        const tasks = (journal.readGoals() as { text: string; done: boolean; area: string | null; line: string }[]).filter((t) => !t.done);
        const groups: GoalGroup[] = areas().map((a) => ({ key: a.key, label: a.label, tasks: tasks.filter((t) => t.area === a.key).map(({ text, line }) => ({ text, line })) }));
        const other = tasks.filter((t) => !t.area);
        if (other.length) groups.push({ key: null, label: "Other", tasks: other.map(({ text, line }) => ({ text, line })) });
        return groups;
      })()
    : [];

  const challenge = mods.challenge ? (map.challenge() as { name: string; from?: string; to?: string; rule?: string } | null) : null;

  return (
    <>
      <section className="card read">
        <div className="row between">
          <div className="eyebrow">{read ? `the read · ${read.date}` : "the read"}</div>
          {read && <Link className="small muted" href="/history">earlier</Link>}
        </div>
        {read ? (
          <>
            {read.judgment.where.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            <div className="areas">
              {areas().map((a) => {
                const line = read.judgment.areas?.[a.key];
                return line ? <div key={a.key}><strong>{a.label}</strong> — {line}</div> : null;
              })}
            </div>
            {read.judgment.moved?.length > 0 && (
              <div className="areas">
                <div className="eyebrow" style={{ marginTop: 10 }}>moved</div>
                {read.judgment.moved.map((m, i) => <div key={i}>· {m}</div>)}
              </div>
            )}
            {read.judgment.ask && <div className="ask"><div className="eyebrow">a question for you</div>{read.judgment.ask}</div>}
            {read.judgment.next && <div className="ask"><div className="eyebrow">one next step</div>{read.judgment.next}</div>}
          </>
        ) : (
          <p className="muted">No read yet. It arrives at {rhythm.read_at} every day once the schedule is installed, or now from <Link href="/control">Control</Link>.</p>
        )}
      </section>

      {notes.length > 0 && (
        <section className="card strip">
          {notes.map((n, i) => <div key={i}><span className="bad">{n.what}</span> <span className="muted small">{n.fix}</span></div>)}
        </section>
      )}

      <Capture />

      <section>
        <div className="eyebrow">{owner ? `${owner}'s areas` : "areas"}</div>
        <div className="grid">
          {stats.map((a) => (
            <Link key={a.key} href={`/area/${a.key}`} className="tile">
              <div className="label">{a.label}</div>
              {a.moving && <div className="small muted">{a.moving}</div>}
              <div className="small faint">{a.lastTouched ? `touched ${a.lastTouched}` : "nothing yet"}{a.notes ? ` · ${a.notes} note${a.notes === 1 ? "" : "s"}` : ""}</div>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ height: 14 }} />

      {mods.goals && <Goals groups={goalGroups} href={journalHref("goals.md")} />}
      {mods.wins && <Wins lines={(journal.readWins(5) as string[])} href={journalHref("wins.md")} />}
      {mods.practice && <PracticeStrip items={map.practiceItems() as { key: string; label: string }[]} ticks={practice.ticks() as Record<string, boolean>} />}

      {mods.challenge && challenge && (
        <section className="card">
          <div className="row between">
            <div className="eyebrow">{challenge.name}</div>
            <a className="small muted" href={journalHref("challenge.md")}>the record</a>
          </div>
          {challenge.rule && <p className="muted">{challenge.rule}{challenge.from && challenge.to ? ` · ${challenge.from} to ${challenge.to}` : ""}</p>}
          <ul className="plain">
            {(journal.readChallengeTail(3) as string[]).map((l, i) => <li key={i}>{l}</li>)}
          </ul>
          <div className="muted small">Write the attempt anywhere: the inbox above, your daily note, the record itself. It gets filed, never counted.</div>
        </section>
      )}
    </>
  );
}
