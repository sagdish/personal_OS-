# Setup — the interview

You are setting up Personal OS for the person you are talking to. Read this whole file first, then
start.

## How to run it

- **One question at a time.** Ask, wait for the answer, write it down, then the next one. Never a
  list of questions, never two in one message. One or two plain sentences per question.
- Write every answer as you get it into `_system/state/setup.yaml` (the shape is at the end of
  this file). If `os.yaml` already exists, this is a re-run: read `os.yaml` first (it is the truth,
  they may have edited it by hand), bring the answers file in line with it, say in one line what is
  already set, and ask what they want to change. Nothing they wrote anywhere else is ever touched.
- Ask in the language they write in. Record it as `language` (a code: `en`, `de`, `ru`, …).
- Optional questions are introduced as optional: "Optional, skip if you like." A skip is an answer.
- Do not explain the whole system first. One sentence of welcome, then question 1.
- Never invent anything for them. Where they gave nothing, leave it empty, and say nothing about
  the gap in any file you write: a skipped question is not a hole to mention, it is simply absent.

## The questions

Crucial:

1. What is your name? → `name`
2. What should this OS be called? Default "<Name>'s OS". → `os_name`
3. What parts of your life should it hold? One to five. Common ones: career, health, building,
   learning, relationships, money, writing, inner work. Or your own words. → `areas[].label`
4. For each area, optional: what does a day that moved this area look like, in one line?
   → `areas[].moving`
5. How should it talk to you: blunt and short, or warmer and longer? Anything it must never say
   or do? → `voice`, `never`
6. Where do you write? Inside this folder (default), or in an Obsidian vault you already have: give
   the path of a folder inside it. → `journal.obsidian`, `journal.path`
7. When should the morning read arrive? Default 08:30, your machine's clock. → `read_at`
8. Should the read only tell you where you stand, or also suggest one next step? Default: no
   suggestion. → `next_step`

Optional, each introduced as optional:

9. wins.md: one line per finished thing, append-only, so it outvotes memory on a bad day. Want it?
   → `modules.wins`
10. goals.md: one task list, one heading per area. Want it? → `modules.goals`
11. A daily practice list: a few habits to tick on the home page. Want it? Which ones?
    → `modules.practice`, `practice[]`
12. A challenge or a season: a name, dates, a one-line rule. Kept as a record, never scored.
    → `modules.challenge`, `challenge`
13. A weekly review: a prompt you run on Sundays. Nothing automatic. → `modules.weekly`
14. Notes about yourself I may read to draft your portrait: a file or a folder. I only read.
    → `notes_path`
15. Anything else the voice should know about you? → `about`

Machine:

16. How will the daily read run? (1) Claude Code with your subscription: nothing to set up.
    (2) An Anthropic API key. (3) Another provider with an OpenAI-compatible endpoint. Default 1.
    → `provider.kind`: `claude-code` | `anthropic` | `openai-compatible`
17. Only for 2 or 3: the key, the model, and for 3 the base URL. Write the key into `.env.local`
    at the root as `ANTHROPIC_API_KEY=…` (2) or `OS_PROVIDER_KEY=…` (3), never into setup.yaml.
    → `provider.model`, `provider.base_url`
18. Max paid calls per day. Default 3. → `max_calls_per_day`
19. Only if a `.git` folder exists here: keep your personal files out of git? Yes is safe for a
    public fork; no commits everything, for a private backup repo. Default yes.
    → `life_in_git` (false when they say yes)

## Then, without asking

1. Run `node bin/os.mjs apply --from-answers` and read what it prints. If it reports a problem with the answers,
   fix `_system/state/setup.yaml` and run it again.
2. Write the portrait. `MANAGER.md` has the headings; fill each with prose in their words, from
   their answers, and from their notes if they gave a path (read those first). `## Core`: who they
   are, what they are in the middle of, what matters to them. `## Voice`: how to talk to them, in
   their words, and what never to say. One section per area: what it is for them, what moving it
   looks like. Short, plain, no praise, nothing they did not say or their notes do not show.
3. Write each `areas/<key>/README.md`: the area in their words, a few lines. Apply left a skeleton
   with their "moving" line. If they gave little, the file stays short; never write that something
   is missing or "not yet" given.
4. `node bin/os.mjs doctor`. Fix anything red.
5. `node bin/os.mjs read --force`: the first read. If it fails, say exactly what it said and stop.
6. `node bin/os.mjs install`: the schedule and the `os` alias. On Linux and Windows this prints a
   line for them to add; show it to them as it is.
7. `node bin/os.mjs`: installs and builds the page (a minute or two), starts it, opens the browser.
8. End with two lines: the page's address, and that the first read is on it and in `STATUS.md`.
   No summary of them back at them, no advice.

## The answers file: `_system/state/setup.yaml`

```yaml
name: Maria
os_name: Maria's OS
language: en
areas:
  - label: Certification
    moving: a study block done, or a practice exam taken
  - label: Health
    moving: moved, slept, cooked
voice: blunt and short, no cheering
never: never tell me to rest
journal: {obsidian: false, path: ""}      # path empty = journal/ inside this folder
read_at: "08:30"
next_step: false
modules: {wins: true, goals: true, practice: false, challenge: false, weekly: true}
practice: []                              # e.g. [{label: Walk}, {label: Ten pages}]
challenge: {name: "", from: "", to: "", rule: ""}
notes_path: ""
about: ""
provider: {kind: claude-code, model: "", base_url: ""}
max_calls_per_day: 3
life_in_git: false
```
