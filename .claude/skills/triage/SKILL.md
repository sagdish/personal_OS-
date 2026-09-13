---
description: "/triage — sort what they wrote. Copies, never removes"
disable-model-invocation: true
---

Their words live in the journal and nothing here deletes them. The daily read files entries on its
own; this is the manual pass for what it left.

1. `node bin/os.mjs inbox sort`, then `node bin/os.mjs inbox list 14`. One line per entry, with its
   id; `[wins]` and the like mean it was already filed.
2. For each entry not yet filed, decide once:
   - something finished, shipped, overcome → `node bin/os.mjs file <id> wins` (only if wins is on)
   - a task they gave themselves → `node bin/os.mjs file <id> goals <area-key>` (only if goals is on)
   - an attempt for their challenge → `node bin/os.mjs file <id> challenge` (only if challenge is on)
   - a thought that belongs to an area → copy it, verbatim, into `areas/<key>/notes/<date>-<slug>.md`
   - nothing actionable, nothing durable → leave it. It is kept in the inbox tree anyway.
3. Finish with three lines: what was copied where, what was left, and whether
   `node bin/os.mjs doctor` is green.

Never edit inbox.md or the inbox tree by hand. Never paraphrase. Unsure → one line to them, then wait.
