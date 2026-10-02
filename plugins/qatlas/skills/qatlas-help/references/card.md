---
description: >
  Befehlskarte aller ausdrücklichen Qatlas-Aufrufe einschließlich der optionalen Packs.
type: meta
edit: locked
license: MIT
---

# Befehlskarte

| Aufruf | Aufgabe |
|---|---|
| **qatlas goal [Idee, Task oder Datei]** | Klärt Zielbild und kleinsten tragfähigen Umfang ausschließlich im Gespräch. |
| **qatlas shape [Idee oder Datei]** | Hält bestätigtes Wissen fest und schneidet kleine, ausführungsreife Tasks. |
| **qatlas shape <Task>** | Schärft einen eindeutig bezeichneten bestehenden Task. |
| **qatlas shape backlog [Scope]** | Schärft Drafts, klärt Voraussetzungen und repariert die Queue. |
| **qatlas run** | Führt höchstens fünf Tasks seriell mit Orchestrator und Subagents aus. |
| **qatlas review** | Klärt menschliche Entscheidungen, Prüfungen und Abnahmen einzeln. |
| **qatlas-work tree** | Zeigt Git-Worktrees, legt mit `new` einen an oder räumt sicher auf. |
| **qatlas-core setup** | Richtet Projektzustand, Projektanweisungen, Bibliothek und Einstellungen ein. |
| **qatlas-core doctor** | Prüft Abhängigkeiten, Scaffold, Bibliothek und Update-Stand ohne Reparatur. |
| **qatlas-core statusline** | Konfiguriert die Statusline des aktuellen Hosts. |
| **qatlas-core backlog-system** | Wechselt oder migriert das maßgebliche Planungssystem. |
| **qatlas-mode adhd** | Formt die Zusammenarbeit für den Rest der Session handlungsfreundlich für ADHD. |
| **qatlas-help [Thema]** | Begleitet durch Qatlas wie ein Handbuch. |
| **qatlas-dev [lite\|full\|ultra]** | Setzt die Stufe der Codemethode für die Session. |
| **qatlas-dev-review** | Prüft Code auf Over-Engineering, ohne etwas umzusetzen. |
| **qatlas-council [arch]** | Berät mit unabhängigen Subagents zu Vorhaben oder Architektur. |

Claude verwendet `/<aufruf>`, Codex `$<aufruf>` oder das `/skills`-Menü. `qatlas-dev` und `qatlas-council`
stehen nur zur Verfügung, wenn ihr Pack installiert ist.
