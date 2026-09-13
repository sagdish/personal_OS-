# Personal OS

Your life as plain files. One AI voice that reads them once a day and tells you where you stand,
in your own words, with no scoreboard. A page that shows it. A setup that builds all of it around
you, one question at a time, in about ten minutes.

Everything lives on your computer as markdown files. No account, no cloud, no lock-in. Works with
Claude Code and a Claude subscription out of the box; with an API key or another AI provider if you
choose that at setup. Delete the machine and your life is still there as files you can read.

**What it is not:** a task manager that nags, a habit app with streaks, a chat you have to
remember to open, therapy.

## Install

One command, on a Mac or Linux. Open Terminal (Mac: press ⌘ and Space together, type `Terminal`,
press Return), paste this, press Return:

```
curl -fsSL https://raw.githubusercontent.com/sagdish/personal_OS/main/install.sh | bash
```

It makes a `personal-os` folder in your home folder, puts Node and Claude Code on your computer if
you don't have them (the Mac asks for your password once, for Node), installs the OS, and ends with
the three lines to type next. A few minutes, a lot of text scrolling by; that is normal.

Already downloaded the zip, or cloned it? Go into the folder in Terminal and type `bash install.sh`.
Same thing, without the download.

**Windows,** or if you would rather do each step yourself: the next section. Otherwise skip to
[Set up](#set-up).

## By hand

What the one command does, as steps. You need two things on your computer first.

**1. Node.** The engine everything here runs on. To check whether you have it, open Terminal
(Mac: press ⌘ and Space together, type `Terminal`, press Return) and type this, then Return:

```
node --version
```

If you see a number like `v22.11.0` and it is 20 or higher, you have it. If you see
`command not found`, go to [nodejs.org](https://nodejs.org), click the big green download button
(the LTS version), open the file it downloads and click through the installer. Then close Terminal,
open it again, and check again.

**2. Claude Code.** The AI that runs your setup and your coaches. It needs a Claude subscription
(Pro or Max). To check, type `claude --version` in Terminal. If it prints a number, you have it. If
not, paste this into Terminal and press Return:

```
curl -fsSL https://claude.ai/install.sh | bash
```

Then open a new Terminal window and type `claude` once to sign in.

Another AI tool instead of Claude Code (Cursor, Codex, Gemini CLI, anything that can open a folder
and follow instructions) works too. The daily read then needs an API key; setup asks for it.

**Windows:** everything below works in PowerShell. Where this manual says `bin/os`, type
`node bin\os.mjs`. Where it says `os`, the same.

**3. The folder.** Any one of these gives you the same folder.

**The quick way.** In Terminal, type this and press Return:

```
npx personal-os my-os
```

It makes a folder called `my-os` in the folder Terminal is in (your home folder, unless you moved),
with everything inside, and installs the first packages. Name it anything instead of `my-os`.

**The zip.** On [the GitHub page](https://github.com/sagdish/personal_OS), click the green **Code**
button, then **Download ZIP**. Double-click the downloaded file to unzip it. You get a folder; put it
wherever you keep things.

**Git,** if you use it: clone or fork [github.com/sagdish/personal_OS](https://github.com/sagdish/personal_OS).

**4. The install.** In Terminal, go into the folder. The easy way: type `cd ` (with a space after
it), drag the folder from Finder onto the Terminal window, press Return. Then type:

```
node bin/os.mjs install
```

It downloads the page's packages (a minute or two; a lot of text scrolls by, that is normal) and
adds the `os` shortcut to your shell. At the end it prints "Personal OS is not set up yet" and the
two steps that come next, which are the ones below.

**Open a new Terminal window now.** The `os` shortcut only exists in windows opened after the
install. From here on, `os` is the command; `node bin/os.mjs` always does the same thing.

## Set up

In the new window, go into the folder again (`cd `, drag, Return) and type:

```
claude
```

The first time, Claude Code asks whether you trust the files in this folder. Say yes. Then type:

```
/setup
```

and answer the questions. One at a time: your name, what to call the OS, the parts of your life it
should hold (one to five), how it should talk to you, where you write, when the morning read should
arrive. Then a few optional things, each marked optional; skip what you don't want. Then how the
read runs: Claude Code with your subscription is the default and needs nothing.

Claude Code asks permission before it runs a command or writes a file. Say yes; that is the setup
doing its work.

At the end it writes your portrait, checks the structure, runs the first read, installs the
schedule and opens the page in your browser. You see where you stand before you close the window.

Re-run `/setup` whenever your life changes. It changes only what you change.

## Every day

1. **Write anywhere in your journal.** The inbox for anything quick: the capture box on the page,
   `/capture` in Claude Code, or your phone through Obsidian if you use it. Your daily note for the
   day. Your words, any format. Nothing you write is ever edited or deleted.
2. **The read arrives** at your time, as a banner on a Mac and on the page. It says where you
   stand, one line per area, what moved, and at most one question. It files what you wrote where it
   belongs: a finished thing to wins, a task to goals, an attempt to your challenge record, copied
   word for word. It never assigns you work unless you asked for one next step at setup.
3. **Open the page** when you want to see it: [http://localhost:3300](http://localhost:3300). If it
   is not up, type `os` in Terminal.

That is the whole practice. A quiet day is not a miss.

## Commands

In Claude Code, type the command. In another tool, say "run the <name> skill", or ask it to read
`.claude/skills/<name>/SKILL.md` and follow it.

| Command | What it does |
|---|---|
| `/setup` | the interview. Re-run any time; it changes only what you change |
| `/capture` | appends what you just said to the inbox, verbatim, stamped |
| `/triage` | sorts the inbox now: copies entries to wins, goals, the record, an area. Removes nothing. The read does this daily on its own |
| `/brief` | runs the read now |
| `/coach-<area>` | one per area, named after it: `/coach-health`, `/coach-career`, … Opens your portrait's shared part plus that area, the area's notes, its open tasks, and where the last session stopped |
| `/coach-off` | drops the coach |
| `/weekly` | (if you turned it on) the week from above, written to your journal |

In Terminal, inside the folder (`os` after the install; `node bin/os.mjs` always works; on Windows
`node bin\os.mjs`):

| Command | What it does |
|---|---|
| `os` | start the page and open it in the browser. Safe to run twice. `os --no-open` skips the browser |
| `os stop` | stop the page |
| `os status` | what is up, what is down, your areas and commands |
| `os doctor` | the structure check. Red is a real fault and says the fix |
| `os read` | the read, now. `os read --dry-run` shows what it would send, free. `--force` skips the ten-minute cooldown |
| `os install` | the packages, the `os` shortcut and, once set up, the schedule. `os install --uninstall` removes the schedule and the shortcut |
| `os inbox sort` | move the inbox dock into the tree now. `os inbox list 14` prints the last two weeks' entries with their ids |
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
node_modules/    the packages the install downloaded. Big, normal, never touch it
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

- `claude-code`: Claude Code with your subscription. The default, nothing to set up. It uses the
  model Claude Code is set to; put a model id in `provider.model` to use another one for the read.
  The cost shown at Control is Claude Code's own estimate; on a subscription it is quota, not money.
- `anthropic`: the Anthropic API with `ANTHROPIC_API_KEY` in `.env.local`. Default model
  `claude-opus-5`; about ten cents a read at today's prices.
- `openai-compatible`: any service with an OpenAI-style chat endpoint: `base_url`, `model`, and
  `OS_PROVIDER_KEY` in `.env.local` (Ollama needs no key).

## The page

[http://localhost:3300](http://localhost:3300), on your machine only. Started by `os`.

| Route | What is on it |
|---|---|
| `/` | the read · the capture box · your areas, last touched · then only the modules you turned on: your list, wins, the practice strip, the challenge card · a red strip only when something is broken |
| `/area/<area>` | the area's README, its open tasks, its notes, and which coach to type |
| `/doc/…` | any file, rendered. Edit in place with a plain editor that keeps everything as it is |
| `/history` | every read, newest first |
| `/control` | pause · run now · sort the inbox · the provider · the schedule · doctor · the last ten calls with their cost · the log |
| `/help` | this manual, plus your setup: your areas, your commands, where your journal is |

## Schedule

Once the OS is set up, `os install` puts one job on your machine that runs `os tick` every 30
minutes. The tick sorts the inbox and, once the clock passes your read time and today's read has not
run, runs it. It costs nothing on its own. A missed morning (the machine was asleep) runs when the
machine is back.

- **Mac:** installed automatically (launchd). Setup does it for you.
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
- If the folder is a git repository, setup asks once whether your personal files stay out of git.
  Yes (the default) means `os.yaml`, `MANAGER.md`, `STATUS.md`, `AGENTS.md`, `areas/`, `journal/`
  and the coach commands are ignored, so a public fork leaks nothing. No means everything commits,
  for a private backup repo. Change it in `os.yaml` (`git.life_in_git`) and run `os apply`.
- With the default, **your life exists only on this disk** unless you back it up: point the journal
  at a synced folder at setup, or back the folder up like any other.
- What leaves your machine: once a day, the facts above and your portrait go to the provider you
  chose. Nothing else, ever. The page talks to no network.

## When something looks wrong

| You see | What it means, what to do |
|---|---|
| `node: command not found` | Node is not installed, or this window was opened before you installed it. Install it from nodejs.org, then open a new Terminal window |
| `os: command not found` | open a new Terminal window; the shortcut appears only in new ones. Or type `node bin/os.mjs` instead of `os` |
| `claude: command not found` | Claude Code is not installed, or the window is old. Install it (see Before you start), then a new window |
| `npm install failed` | usually no internet, or a company proxy. Try again; if it keeps failing, run `npm install` inside the folder and read the last lines |
| the page did not open, or `page down` | type `os`. If it says something still listens on port 3300, another program uses it: change `app.port` in `os.yaml` and type `os` again |
| the read did not arrive | `os status` says which of the four it is: paused, the daily cap reached, the provider not ready, the schedule not installed. Each line says the fix. A sleeping Mac runs it when it wakes |
| red lines in `os doctor` | each names the file and the fix |
| something else | the logs in `_system/logs/`: `os.log` (the machine), `tick.log` (the schedule), `app.log` (the page) |

## Credits and license

Built from the personal OS [Sagdi Formanov](https://sagdi.com) ([github.com/sagdish](https://github.com/sagdish))
built and ran for himself, with his life subtracted out and a setup put in its place. MIT license.
