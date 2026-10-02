---
description: >
  Git-Zustand prüfen und synchronisieren: vor dem ersten schreibenden Eingriff in ein Repo
  und bei Status-, Diff-, Fetch- und Sync-Aufträgen.
license: MIT
type: playbook
edit: locked
---

# Zustand und Synchronisierung

1. Ermittle Branch, Upstream und vorhandene Remotes; nimm weder `origin` noch `main` pauschal an.
2. Führe `git worktree list --porcelain` aus und berücksichtige benachbarte Worktrees.
3. Prüfe `git status` und bei einem Status- oder Diffauftrag die passenden Diffs für gestagte und ungestagte
   Änderungen.
4. Nenne die bekannte Abweichung zwischen `HEAD` und Upstream als Stand des zuletzt geholten Remotes, nie als
   aktuellen Remotestand. Ein Status-, Diff- oder sonstiger rein lokaler Leseauftrag löst keinen
   Netzwerkzugriff aus.
5. Führe `git fetch` erst aus, wenn der aktuelle Remotestand für den Auftrag nötig ist, insbesondere für
   einen Remotevergleich, Sync oder Push, und nur für die betroffenen Remotes. Ein rein lokaler Merge löst
   keinen Fetch aus. Scheitert ein nötiger Fetch, melde, dass der entfernte Stand nicht geprüft werden
   konnte.
6. Aktualisiere einen Branch nie allein wegen einer Zustandsprüfung. Einen sauberen,
   nur zurückliegenden Branch aktualisierst du ausschließlich in einem ausdrücklich autorisierten Sync- oder
   Arbeitsablauf und ausschließlich per Fast-Forward, bevorzugt mit `git pull --ff-only`.
