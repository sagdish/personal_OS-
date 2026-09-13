# Personal OS

Your life as plain files. One AI voice that reads them once a day and tells you where you stand,
in your own words, with no scoreboard. A page that shows it. A setup that builds all of it around
you, one question at a time, in about ten minutes.

Everything lives on your disk as markdown. No account, no cloud, no lock-in. Works with Claude Code
and a subscription out of the box; with an API key or another provider if you choose that at
setup. Delete the machine and your life is still there as files you can read.

**What it is not:** a task manager that nags, a habit app with streaks, a chat you have to
remember to open, therapy.

## What you need

- **Node 20 or newer.** `node --version` tells you. Get it at nodejs.org if you have none.
- **An AI tool that can read files.** Claude Code is the default and needs nothing else: a
  subscription is enough. Any other tool works too (Cursor, Codex, Gemini CLI, anything that can
  open a folder and follow instructions), with an API key for the daily read.
- **macOS** for the automatic schedule. Linux and Windows run everything too; the schedule is two
  manual steps (see Schedule below).

## Get it

Any one of these, same result:

```
npx personal-os my-os          # makes the folder and installs it
```

or clone or fork this repository, or download the zip and unzip it anywhere. No git needed, ever.

Then, in a terminal, inside the folder:

```
bin/os install
```

It installs the packages (a minute or two) and the `os` alias, then tells you what to do next,
which is:

## Set up

Open your AI in the folder.

- **Claude Code:** run `claude` in the folder, then type `/setup`.
- **Another tool:** tell it "open SETUP.md and follow it".

It asks one question at a time: your name, what to call the OS, the parts of your life it should
hold (one to five), how it should talk to you, where you write, when the morning read should
arrive. Then a few optional things, each marked optional. Then how the read runs (Claude Code by
default, nothing to set up).

At the end it writes your portrait, checks the structure, runs the first read, installs the
schedule and starts the page. You see where you stand before you close the terminal.

Re-run `/setup` whenever your life changes. It changes only what you change.

## Every day

1. **Write anywhere in your journal.** The inbox for anything quick (the page's capture box, `/capture`
   in your AI, or your phone through Obsidian if you use it). Your daily note for the day. Your
   words, any format. Nothing you write is ever edited or deleted.
2. **The read arrives** at your time, as a banner on macOS and on the page. It says where you
   stand, one line per area, what moved, and at most one question. It files what you wrote where
   it belongs: a finished thing to wins, a task to goals, an attempt to your challenge record,
   copied word for word. It never assigns you work unless you asked for one next step at setup.
3. **Open the page** when you want to see it: `http://localhost:3300`.

That is the whole practice. A quiet day is not a miss.

## Commands

In your AI (Claude Code: type it; other tools: "run the <name> skill", or read
`.claude/skills/<name>/SKILL.md` and follow it):

| Command | What it does |
|---|---|
| `/setup` | the interview. Re-run any time; it changes only what you change |
| `/capture` | appends what you just said to the inbox, verbatim, stamped |
| `/triage` | sorts the inbox now: copies entries to wins, goals, the record, an area. Removes nothing. The read does this daily on its own |
| `/brief` | runs the read now |
| `/coach-<area>` | one per area, named after it: `/coach-health`, `/coach-career`, … Opens your portrait's shared part plus that area, the area's notes, its open tasks, and where the last session stopped |
| `/coach-off` | drops the coach |
| `/weekly` | (if you turned it on) the week from above, written to your journal |

In a terminal (`os` after `os install`; `bin/os` before; on Windows `node bin\os.mjs`):

| Command | What it does |
|---|---|
| `os` | start the page and open it. Safe to run twice. `--no-open` skips the browser |
| `os stop` | stop the page |
| `os status` | what is up, what is down, your areas and commands |
| `os doctor` | the pollution check. Red is a real fault and says the fix |
| `os read` | the read, now. `--dry-run` shows what it would send, free. `--force` skips the ten-minute cooldown |
| `os install` | the packages, the `os` alias and, once set up, the schedule. `--uninstall` removes the schedule and the alias |
| `os inbox sort` | move the inbox dock into the tree now. `os inbox list [days]` prints entries with their ids |
| `os capture "text"` | append to the inbox from a script or a shortcut |
| `os win "text"` | one line to wins.md |
| `os file <id> <to>` | copy one inbox entry to `wins`, `goals` (add the area key) or `challenge` |
| `os portrait <area>` | print who you are for one voice; `all` prints the whole portrait |
| `os apply` | rebuild the structure from the setup answers |
| `os tick` | what the schedule runs every 30 minutes |

## Files and folders

```
README.md        this manual
SETUP.md         the interview your AI runs
AGENTS.md        what any AI reads first: whose OS this is, the rules, where things live. Written by setup
CLAUDE.md        one line for Claude Code: read AGENTS.md
os.yaml          the map: your areas, modules, rhythm, provider, paths. Written by setup, yours to edit
MANAGER.md       your portrait: who you are, how every voice talks to you. Drafted by setup, yours to edit
STATUS.md        where you stand, written by the read. Never edit it
areas/<area>/    one folder per area: index.yaml, README.md in your words, notes/ for anything
journal/         your writing (or the Obsidian folder you named at setup, see below)
  inbox.md         the dock: anything, from any device
  inbox/           the dock's entries, moved here by day once read, kept for good
  daily/           one note per day, YYYY-MM-DD.md
  wins.md          (module) one line per thing done, append-only
  goals.md         (module) your tasks, one heading per area
  challenge.md     (module) the record of your challenge, one dated line per attempt
  reads/           every read, dated, kept
  weeks/           (module) weekly reviews
.claude/skills/  the commands above, one file each. Other tools read the same files
bin/os           the one command
app/             the page (Next.js)
_system/         the machine: its code, its state, its logs. Not yours to edit
.env.local       keys, if you gave any. Never in git
```

**The journal is yours.** The machine only ever appends there, and only your words: a win, a task,
a challenge line, a copy of each read. It never edits or deletes what you wrote.

**Obsidian.** If you said yes at setup, the journal is a folder inside your vault instead of
`journal/` here. Same files, same rules, and your phone reaches it through Obsidian Sync. The page
still shows everything.

## The read

One paid call a day; everything else is free.

**What it sees:** the date; per area, the files touched in the last seven days; yesterday's and
today's daily note; the inbox entries of the last three days; the last wins, the open goals, the
week's practice ticks, the challenge record's tail, for the modules you turned on; its own last
three reads, so it does not repeat itself. Everything capped, computed from disk. `os read --dry-run`
prints exactly what would be sent.

**Its identity:** `MANAGER.md`, whole. Nothing else knows you. Edit it and the voice changes.

**What it writes:** `STATUS.md`, a copy in `journal/reads/`, the filed lines, one banner. A failed
call keeps the previous read and says so on the page and at Control. Nothing fakes a read.

**The caps:** it runs once a day at your time; `os read` runs it again but not within ten minutes
of the last one; a daily cap on calls (3 by default, in `os.yaml`) stops any loop; a call is killed
after five minutes. Pause it at Control.

**Providers** (`provider.kind` in `os.yaml`):

- `claude-code` — Claude Code with your subscription. The default, nothing to set up. It uses the
  model Claude Code is set to; put a model id in `provider.model` to use another one for the read.
  The cost shown at Control is Claude Code's own estimate; on a subscription it is quota, not money.
- `anthropic` — the Anthropic API with `ANTHROPIC_API_KEY` in `.env.local`. Default model
  `claude-opus-5`; about ten cents a read at today's prices.
- `openai-compatible` — any service with an OpenAI-style chat endpoint: `base_url`, `model`, and
  `OS_PROVIDER_KEY` in `.env.local` (Ollama needs no key).

## The page

`http://localhost:3300`, on your machine only. Started by `os`.

| Route | What is on it |
|---|---|
| `/` | the read · the capture box · your areas, last touched · then only the modules you turned on: your list, wins, the practice strip, the challenge card · a red strip only when something is broken |
| `/area/<area>` | the area's README, its open tasks, its notes, and which coach to type |
| `/doc/…` | any file, rendered. Edit in place with a plain editor that keeps everything as it is |
| `/history` | every read, newest first |
| `/control` | pause · run now · sort the inbox · the provider · the schedule · doctor · the last ten calls with their cost · the log |
| `/help` | this manual, plus your setup: your areas, your commands, where your journal is |

## Schedule

`os install`, run once the OS is set up, puts one job on your machine that runs `os tick` every 30 minutes. The tick sorts the
inbox and, once the clock passes your read time and today's read has not run, runs it. It costs
nothing on its own. A missed morning (the machine was asleep) runs when the machine is back.

- **macOS:** installed automatically (launchd).
- **Linux:** `os install` prints the crontab line; `os install --yes` adds it for you.
- **Windows:** `os install` prints the `schtasks` command to run once.

`os install --uninstall` removes it.

## Changing your mind

- **Your areas, modules, read time, provider:** re-run `/setup`, or edit `os.yaml` by hand and run
  `os apply`. Existing notes and journal files are never touched. Adding a sixth area means
  removing one: the cap is the design.
- **How the voice talks to you:** edit `MANAGER.md`. It is plain text with fixed headings.
- **Where things go:** you don't decide. Write anywhere; the read files it.

## Git, privacy, backups

- Git is optional. Nothing here needs it.
- If this folder is a git repo, setup asks once whether your personal files stay out of git. Yes
  (the default) means `os.yaml`, `MANAGER.md`, `STATUS.md`, `AGENTS.md`, `areas/`, `journal/` and
  the coach commands are ignored, so a public fork leaks nothing. No means everything commits, for
  a private backup repo. Change it in `os.yaml` (`git.life_in_git`) and run `os apply`.
- With the default, **your life exists only on this disk** unless you back it up: point the journal
  at a synced folder at setup, or back the folder up like any other.
- What leaves your machine: once a day, the facts above and your portrait go to the provider you
  chose. Nothing else, ever. The page talks to no network.

## When something looks wrong

1. `os status`
2. `os doctor` — it names the file and the fix
3. `/control` on the page — the last calls and their errors, the log tail
4. `_system/logs/` — `os.log` (the machine), `tick.log` (the schedule), `app.log` (the page)

A read that did not arrive: check Control. Paused, a cap reached, a provider not ready, or the
schedule not installed are the usual four, and each says so.

## Credits and license

Built from the personal OS [Sagdi Formanov](https://sagdi.com) ([github.com/sagdish](https://github.com/sagdish))
built and ran for himself, with his life subtracted out and a setup put in its place. MIT license.
