---
description: >
  Shared closing of run, team and shape in the chat: result, numbered user items answerable in the chat, new
  tasks, open risks, process improvements, metrics and unpushed commits.
type: playbook
edit: locked
license: MIT
---

# Closing block

End the mode with exactly this block in the interaction language; the template fixes its structure. Each
item stands only here, once, topic first and task ID after it. Number the items of `Decide`, `Check` and
`Assumed` continuously so that the user can answer by number. Leave out empty categories.

```markdown
<project> · <mode> · <state, e.g. finished, 2 decisions open>

<Result: two to four sentences on what is now different for the user.>

**Decide**
1. <Topic> (#<ID>): <context in one sentence>. <Question>? Recommendation: <option>, because <reason>.

**Check**
2. <Topic> (#<ID>): <what, where, how success shows; when, if not now>.

**Assumed**
3. <Topic> (#<ID>): <assumption> because <reason>; reverting it would <consequence>.

**Act**
- <Topic> (#<ID>): <action with exact place or command>.

**New**
- <Topic> (#<ID>): <what> - <why it is needed>.

**Risks**
- <Risk>: <consequence> - <needed action or decision>.

**Improvements**
- <Weakness of the procedure with its evidence>: <concrete approach>.

**Metrics:** <one line>
**Not pushed:** <repo>: <commit ID> <subject>

Next in a new session: <modes>
```

- **Result:** what now works or changed, in the user's terms; no list of packages or tasks.
- **Assumed:** only assumptions whose reversal would change something.
- **Risks:** only risks still open after the run, among them an unfixed security risk that may not be
  recorded publicly. What was handled as expected stays out; code locations belong in the task.
- **Improvements:** patterns of this run in cut, task contracts, checks or environment, derived from
  corrections, reworks, conflicts, reruns, nudges, standstills, questions and deviations; only with a
  concrete approach, no product ideas.
- **Metrics:** duration and the nonzero counts of questions, reworks, conflicts, reruns and nudges.
- **Last line:** only modes with real work: `review` for tasks in `review`, `shape <unambiguous task>` for a
  draft or `shape backlog` for several, `run <scope>` for the first executable scope after `shape`. A new
  idea goes to `shape` without task scope. Start no mode yourself. If nothing is open, the anchor line says
  so and the line is left out.

## Answers in this chat

The user usually answers right away. Record each answered item before the session ends per the recording
rules of [presenting decisions](playbook-decision-card.md); clarify only an ambiguous item. Put resulting
file changes into one further local commit per affected repo, push nothing, and confirm in one line what was
recorded.
