---
name: qatlas-work
description: >
  Bündelt auf ausdrücklichen Aufruf ausführbare Einzelverfahren außerhalb des Qatlas-Arbeitsloops.
  `tree` zeigt gemeinsame Git-Worktrees, legt einen für einen Auftrag an oder räumt ihn sicher auf.
  Ohne Argument nur die verfügbaren Modi zeigen; niemals automatisch starten.
disable-model-invocation: true
argument-hint: "[tree [new [Auftrag]|Auswahl|aufräumen]]"
license: MIT
type: skill
edit: locked
---

# Qatlas Work

Dieser Router bündelt ausdrücklich gestartete Einzelarbeit außerhalb des Qatlas-Arbeitsloops.
`qatlas run` verwaltet seine benötigten Worktrees selbst; ein zusätzlicher Work-Aufruf ist dafür unnötig.

## Ohne Argument

Antworte ausschließlich mit der folgenden Karte als gerendetes Markdown. Lies keine Modusreferenz und
ändere keinen Zustand.

### Qatlas Work

| Argument | Aufgabe |
|---|---|
| `tree` | Zeigt Git-Worktrees nummeriert, legt mit `new` einen an oder räumt ausgewählte sicher auf. |

Aufruf: `qatlas-work <argument>`

## Modus wählen

- **`tree [new [Auftrag]|Auswahl|aufräumen]`:** Lies vollständig
  [Git-Worktrees verwalten](references/worktree.md) und führe nur dieses Verfahren aus.

Ist ein vorhandenes Argument nicht eindeutig, nenne die passende Möglichkeit und frage nach genau einer.
Ist es unbekannt, zeige die kompakte Karte und nenne das unbekannte Argument in einem Satz. Deute eine
allgemeine Git-Unterhaltung nie als Aufruf dieses Skills.
