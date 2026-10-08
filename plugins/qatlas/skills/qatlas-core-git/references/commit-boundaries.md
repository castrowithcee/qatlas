---
description: >
  Grenzen zwischen Task, Commit, Review und Release sowie Regeln für Meilenstein-Commits und Checkpoints.
license: MIT
type: rule
edit: locked
---

# Commitgrenzen

Diese vier Grenzen sind unabhängig voneinander. Keine legt die Anzahl oder den Zuschnitt einer anderen fest.

- **Task:** eine geplante Arbeitseinheit, kein Commit-Container. Sie ergibt so viele Commits, wie sachlich
  nötig sind: bei kleinem Umfang einen, bei größerem mehrere. Es gibt weder Ein-Commit-Zwang noch Zielzahl.
- **Commit:** ein kohärenter, prüfbarer und möglichst einzeln rückrollbarer Zustand. Auf dem
  Integrationspfad ist jeder Commit für sich verständlich und besteht die für ihn einschlägigen Prüfungen.
  Implementation und zugehörige Tests reisen im selben Commit. Ein eigenständiger Charakterisierungstest
  darf als eigener vorbereitender Commit vorausgehen. Ein rein mechanisches Refactoring, etwa ein
  Umbenennen oder das Nachziehen vieler Aufrufer, geht einer Verhaltensänderung als eigener Commit voraus,
  statt in ihr zu stecken. Unabhängige Änderungen erhalten eigene Commits. Braucht der Betreff mehrere
  voneinander unabhängige Ergebnisse, etwa getrennte Tool-, Endpunkt- oder Fachgruppen, ist der Commit zu
  teilen.
- **Review:** der Umfang, den ein Mensch gemeinsam beurteilt, etwa ein Branch oder Pull Request. Er darf
  mehrere Commits umfassen und ist kein Grund, sie zusammenzufassen. Fasst die Integration ein Review zu
  einem Commit zusammen, etwa per Squash-Merge, gilt die Commitgrenze für das Review selbst: Es umfasst
  dann genau einen Commit im Sinn dieser Grenze, und mehrere solche Commits werden mehrere Reviews.
- **Release:** der Stand, der gemeinsam versioniert und ausgeliefert wird. Er folgt dem Release-Verfahren
  des Repos, nicht Task- oder Commitgrenzen.

## Meilensteine und Checkpoints

Sichere bei längerer oder riskanter Arbeit nach jedem kohärenten Meilenstein einen Commit, sofern Commits
für diesen Scope autorisiert sind. Sichere vor Übergabe oder Pause einen wiederaufnehmbaren Stand.

- Ein unfertiger Checkpoint entsteht nur auf einem exklusiven privaten Branch, und seine Nachricht weist
  ihn als unfertig aus. Er landet nie unbereinigt auf einem gemeinsamen Branch.
- Vor gemeinsamer Integration wird ein Checkpoint entweder nach [Historie](history.md) zu sinnvollen Commits
  im Sinne der Commitgrenze bereinigt oder ausdrücklich als wertvolle Zwischenstufe erhalten.
- Ohne Commit-Autorisierung bleibt ein Zwischenstand uncommittet in seinem Arbeitsbaum; berichte Branch,
  Worktree und Zustand bei der Übergabe.
