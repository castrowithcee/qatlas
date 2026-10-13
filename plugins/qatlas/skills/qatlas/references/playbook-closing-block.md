---
description: >
  Gemeinsamer Abschlussblock „Für dich“ eines Laufs mit Handlungen, Prüfungen, Entscheidungen, Annahmen,
  neuen Befunden, Sicherheitsrisiken und nicht gepushten Commits.
type: playbook
edit: locked
license: MIT
---

# Abschlussblock

Beende den Abschlussbericht mit genau diesem Block. Jeder Punkt steht in einer Zeile mit seiner Task-ID
und nur hier, nicht zusätzlich im Fließtext. Leere Kategorien entfallen:

```markdown
## Für dich

**Handeln**
- #<ID>: <konkrete Handlung des Nutzers>

**Prüfen**
- #<ID>: <was, wann und woran Erfolg erkennbar ist>

**Entscheiden**
- #<ID>: <offene Entscheidung>

**Angenommen**
- #<ID>: <unter `--fly` getroffene Annahme mit Grund; bestätigen oder zurücknehmen>

**Neu erfasst**
- #<ID> <Titel des Nebenbefunds>

**Sicherheit**
- <nicht erfasstes Sicherheitsrisiko mit Fundstelle>, nur hier gemeldet

**Nicht gepusht**
- <Repo>: <Commit-IDs>

Weiter in neuer Session: <Modi>
```

Nenne in der letzten Zeile nur Modi mit tatsächlicher Arbeit: `review` für Tasks in `review`,
`shape <eindeutiger Task>` für einen Draft oder `shape backlog` für mehrere. Bleibt nichts für den Nutzer,
lautet der Block nur `## Für dich: nichts offen`. Eine neue Idee geht an `shape` ohne Task-Scope. Starte den
Modus nicht selbst. Pushe nur nach „Integration über Pull Requests“.
