# Personal OS

Your life as plain text files on your own computer. Once a day an AI reads them and tells you
where you stand, in your own words, with no score and no nagging. A page shows it. A ten-minute
setup builds it around you: your areas, your voice, your rhythm.

It is not a task manager, not a habit app with streaks, not a chat you have to remember to open.

## The short version

Mac or Linux. Open Terminal and paste these, one at a time:

```
curl -fsSL https://raw.githubusercontent.com/sagdish/personal_OS-/main/install.sh | bash
```

Open a **new** Terminal window, then:

```
cd personal-os
claude
```

Inside Claude, type `/setup` and answer the questions. That is all. The rest of this file explains
each part.

## Install

The one command above does four things: it puts a `personal-os` folder where Terminal is (your home
folder, in a new window), it installs Node if you don't have it (the Mac may ask for your password
once), it installs Claude Code if you don't have it, and it installs the OS. A few minutes. A lot of
text scrolls by; that is normal. At the end it prints the three lines to type next.

To open Terminal on a Mac: press ⌘ and Space together, type `Terminal`, press Return.

If you downloaded the zip or cloned the repository instead: go into that folder in Terminal and type
`bash install.sh`. Same result, no download.

Windows, or if you want to do each step yourself: see [By hand](#by-hand) at the end.

## Set up

1. Open a **new** Terminal window. The `os` shortcut exists only in windows opened after the install.
2. Go into the folder: type `cd personal-os` (or type `cd `, then drag the folder onto the window).
3. Type `claude`. The first time it asks you to sign in with your Claude account (Pro or Max), and
   whether you trust the files in this folder. Say yes.
4. Type `/setup`.
5. Answer the questions, one at a time: your name, what to call the OS, the parts of your life it
   should hold (one to five), how it should talk to you, where you write (inside this folder is
   fine), when the morning read should arrive, whether it may suggest one next step. Then a few
   optional things, each marked optional; skip what you don't want. Then how the read runs: Claude
   Code with your subscription is the default and needs nothing. Claude asks permission before it
   runs a command or writes a file. Say yes; that is the setup working.

At the end it writes your portrait, runs the first read, sets the daily schedule (on Linux and
Windows it shows you the one line to add), and opens the page in your browser. Done. Re-run
`/setup` whenever your life changes; it changes only what you change.

## Every day

1. **Write.** Anything, anywhere in your journal: the capture box on the page, `/capture` inside
   Claude, or your phone through Obsidian if you use it. Your words, any format. They are never
   rewritten or deleted.
2. **Read.** The read arrives at your time, as a banner on a Mac and on the page. Where you stand,
   one line per area, what moved, at most one question. It also files what you wrote: a finished
   thing to wins, a task to goals, word for word.
3. **Look** when you want to: [http://localhost:3300](http://localhost:3300). If the page is not
   up, type `os` in Terminal.

A quiet day is not a miss. Nothing counts your days.

## Questions

**Does it cost money?** Claude Code needs a Claude subscription (Pro or Max). The daily read uses
that subscription once a day. Nothing else costs anything. If you chose an API key at setup, a read
costs about ten cents.

**Do I need to know how to code?** No. You type a few commands from this file. The AI does the rest.

**Where is my data?** On your computer, as text files you can open with anything. Nothing goes to
the cloud except one message a day to your AI provider: the facts of your day and your portrait.
When you talk to a coach or run `/setup`, what you show Claude in that session goes to Claude, as
with any AI tool. The page runs on your machine only.

**Can I use it on my phone?** For writing, yes, if your journal is an Obsidian folder (say so at
setup). The page itself is on your computer.

**What if I stop using it?** Type `os install --uninstall` in the folder (it removes the daily
schedule and the `os` shortcut), then delete the folder. Node and Claude Code stay; they are
ordinary programs you can keep or remove like any other.

**Can I change my areas later?** Yes. Type `/setup` again inside Claude. Your notes stay.

**Can I use another AI instead of Claude Code?** Yes. Any tool that can open a folder and follow
instructions. Tell it "open SETUP.md and follow it". The daily read then needs an API key, which
setup asks for.

**Does the read run when the laptop is closed?** No. It runs when the machine is awake and the time
has passed. A missed morning runs when the lid opens.

**Is anything sent without me knowing?** Only the read, once a day at your time, and whenever you
run it yourself. `os read --dry-run` shows you exactly what it sends, without sending it.

## Commands

Inside Claude, type the command.

| Command | What it does |
|---|---|
| `/setup` | the questions. Re-run any time |
| `/capture` | keep what you just said, word for word |
| `/triage` | sort the inbox now. The read does this daily on its own |
| `/brief` | run the read now |
| `/coach-<area>` | talk to the coach of one area, for example `/coach-health`. It knows your portrait, that area, and where you left off |
| `/coach-off` | drop the coach |
| `/weekly` | the week from above, if you turned it on |

In Terminal, inside the folder. (`os` works after the install. `node bin/os.mjs` always works; on
Windows type `node bin\os.mjs`.)

| Command | What it does |
|---|---|
| `os` | start the page and open it. Safe to repeat. `os --no-open` skips the browser |
| `os stop` | stop the page |
| `os status` | what is up, what is down, your areas and commands |
| `os doctor` | check the structure. Red is a real fault and says the fix |
| `os read` | the read, now. `--dry-run` shows what it would send, free. `--force` skips the ten-minute wait |
| `os install` | the packages, the `os` shortcut and, once set up, the schedule. `--uninstall` removes the schedule and the shortcut |
| `os inbox list 14` | the last two weeks of inbox entries, with their ids. `os inbox sort` files the dock now |
| `os capture "text"` | keep a line from a script or a shortcut |
| `os win "text"` | one line to your wins |
| `os file <id> <to>` | copy one inbox entry to `wins`, `goals` (add the area) or `challenge` |
| `os portrait <area>` | print your portrait for one voice; `all` for the whole thing |
| `os apply` | rebuild the folders, the coaches and the instructions from `os.yaml`, after you edited it |
| `os help` | this list |

## Where things are

```
README.md        this file
SETUP.md         the questions your AI asks
AGENTS.md        what any AI reads first: whose OS this is, the rules, where things live. Written by setup
CLAUDE.md        one line for Claude Code: read AGENTS.md
os.yaml          the map: your areas, what is on, your read time. Written by setup, yours to edit
MANAGER.md       your portrait: who you are, how every voice talks to you. Yours to edit
STATUS.md        where you stand, written by the read. Never edit it
areas/<area>/    one folder per area: a README in your words, notes/ for anything
journal/         your writing, or the Obsidian folder you named at setup
  inbox.md         the dock: anything, from any device
  inbox/           the dock's entries, kept by day, for good
  daily/           one note per day, YYYY-MM-DD.md
  wins.md          one line per thing done (if you turned it on)
  goals.md         your tasks, one heading per area (if on)
  challenge.md     your challenge record (if on)
  reads/           every read, dated
  weeks/           weekly reviews (if on)
.claude/skills/  the commands above, one file each
bin/os           the one command
install.sh       the one-command installer
app/             the page
_system/         the machine. Not yours to edit
node_modules/    the packages the install downloaded. Big, normal, leave it
package.json     the machine's package list, and package-lock.json. Leave them
LICENSE          MIT
.env.local       keys, if you gave any. Never in git
```

**The journal is yours.** The machine only adds to it: your own words filed as a win, a task or a
challenge line, and a copy of each read. It never edits or deletes what you wrote.

## The daily read

What it sees: the date; what changed in each area this week; yesterday's and today's daily note;
the last few days of inbox entries; your last wins and open goals, if those are on; its own last
three reads, so it does not repeat itself. All of it computed from your files and kept small.

Who it is: `MANAGER.md`, your portrait. Nothing else knows you. Edit it and the voice changes.

What it writes: `STATUS.md`, a copy in your journal under `reads/`, the lines it filed, one banner.
If the call fails, the previous read stays and the page says so. It never fakes a read.

Limits: once a day at your time; `os read` runs it again but not within ten minutes of the last
one; at most three calls a day unless you raise it in `os.yaml`; a call is stopped after five
minutes. Pause it on the Control page.

Who runs it (`provider.kind` in `os.yaml`): `claude-code`, your subscription, the default and the
only one that needs no key. `anthropic`, an Anthropic API key in `.env.local`. `openai-compatible`,
any other service with an OpenAI-style endpoint, key in `.env.local`, address and model in `os.yaml`.

## The page

[http://localhost:3300](http://localhost:3300), on your machine only.

- **Home**: the read, the capture box, your areas, then only what you turned on: your list, wins,
  the practice ticks, the challenge. A red strip only when something is broken.
- **An area**: its README, its open tasks, its notes, which coach to type.
- **Any file**: rendered, with an edit button that keeps the file exactly as it is.
- **History**: every read, newest first.
- **Control**: pause, run now, sort the inbox, the schedule, the check, the last ten calls, the log.
- **Help**: this file, plus your own setup.

## Changing things

- Your areas, what is on, the read time, the provider: `/setup` again, or edit `os.yaml` and run
  `os apply`. Notes and journal files are never touched. Five areas is the cap; a sixth means
  dropping one.
- How it talks to you: edit `MANAGER.md`. Plain text, keep the headings.
- Where things go: you don't decide. Write anywhere; the read files it.

## Privacy, git, backups

- Git is optional. Nothing here needs it.
- If the folder is a git repository, setup asks once whether your personal files stay out of git.
  Yes, the default, means a public fork leaks nothing. No means everything commits, for a private
  backup repo. Change it later in `os.yaml` (`git.life_in_git`) and run `os apply`.
- By default your life exists only on this disk. Back the folder up like any other, or point the
  journal at a synced folder at setup.

## When something looks wrong

| You see | What to do |
|---|---|
| `node: command not found` | Node is not installed, or this window is older than the install. Install it from nodejs.org, then open a new window |
| `os: command not found` | open a new Terminal window. Or type `node bin/os.mjs` instead of `os` |
| `claude: command not found` | Claude Code is not installed, or the window is old. See By hand, then a new window |
| `npm install failed` | usually no internet. Try again. If it keeps failing, type `npm install` inside the folder and read the last lines |
| the page did not open, or `page down` | type `os`. If it says something still listens on port 3300, change `app.port` in `os.yaml` and type `os` again |
| the read did not arrive | `os status` names the reason: paused, the daily cap, the provider not ready, or the schedule not installed. Each line says the fix. A sleeping Mac runs it when it wakes |
| red lines in `os doctor` | each names the file and the fix |
| anything else | the logs in `_system/logs/`: `os.log` (the machine), `tick.log` (the schedule), `app.log` (the page) |

## By hand

What the one command does, as steps. Also the way on Windows.

**1. Node.** Type `node --version` in Terminal. A number of 20 or more means you have it. If not:
[nodejs.org](https://nodejs.org), the big green download button, run the installer. Then open a
new Terminal window.

**2. Claude Code.** Type `claude --version`. A number means you have it. If not, Mac or Linux:

```
curl -fsSL https://claude.ai/install.sh | bash
```

Windows, in PowerShell:

```
irm https://claude.ai/install.ps1 | iex
```

Then open a new window and type `claude` once to sign in.

**3. The folder.** Either the green **Code** button then **Download ZIP** on
[the GitHub page](https://github.com/sagdish/personal_OS-), unzip by double-clicking, and put the
folder wherever you keep things; or `git clone https://github.com/sagdish/personal_OS-.git`.

**4. The install.** Go into the folder in Terminal (`cd `, drag the folder onto the window, Return),
then:

```
node bin/os.mjs install
```

Then continue at [Set up](#set-up). On Windows, use `node bin\os.mjs` wherever this file says `os`,
and `/setup` prints the one line to schedule the daily read.

## Credits and license

Built from the personal OS [Sagdi Formanov](https://sagdi.com) ([github.com/sagdish](https://github.com/sagdish))
built and ran for himself, with his life subtracted out and a setup put in its place. MIT license.
