---
description: >
  Befehlskarte aller expliziten Qatlas-Aufrufe, einschließlich der optionalen Packs.
---

# Befehlskarte

| Aufruf | Zweck |
|---|---|
| **qatlas goal [Idee, Task oder Datei]** | Erarbeitet im Gespräch einen Plan mit beantworteten Fragen, als Grundlage für Shape. |
| **qatlas shape [Datei, Task oder Backlog]** | Hält bestätigtes Wissen aus dem Gesprächskontext oder einer Datei fest und schneidet kleine, ausführungsreife Tasks zu; mit einem Task oder `backlog [Scope]` schärft es bestehende Arbeit und repariert die Queue. |
| **qatlas run [--limit <n\|0>] [--ask]** | Arbeitet bis zu vier unabhängige Batches mit je etwa fünf Tasks parallel als Subagents ab; `--limit <n>` erlaubt bis zu `n` Batches, `--limit 0` hebt die Grenze auf. |
| **qatlas review** | Geht konkrete Prüfungen Schritt für Schritt durch und klärt Entscheidungen einzeln. |
| **qatlas-work tree** | Zeigt Git-Worktrees, legt mit `new` einen an oder räumt sicher auf. |
| **qatlas-core init** | Richtet Git-Repo, Projektzustand, Projektanweisungen und Library ein. |
| **qatlas-core doctor** | Prüft Abhängigkeiten, Scaffold und Library, ohne etwas zu reparieren. |
| **qatlas-core statusline** | Konfiguriert oder entfernt die Statusline des aktuellen Hosts. |
| **qatlas-core backlog-system** | Wechselt oder migriert das maßgebliche Planungssystem. |
| **qatlas-mode adhd** | Gestaltet die Zusammenarbeit für den Rest der Session so, dass ein Leser mit ADHS danach handeln kann. |
| **qatlas-help [Thema]** | Führt wie ein Handbuch durch Qatlas. |
| **qatlas-dev [lite\|full\|ultra\|off]** | Setzt die Stufe der Code-Methode für die Session oder schaltet sie ab. |
| **qatlas-dev-review** | Prüft eine Änderung auf Bugs, Risiko, Skalierung, fehlende Tests, Geschwindigkeit und Ballast, ohne Code zu ändern. |
| **qatlas-dev-audit** | Prüft ein ganzes Repo auf dieselbe Weise, mit Rangfolge, ohne Code zu ändern. |
| **qatlas-design** | Gibt einer Webseite oder einem App-Screen eine recherchierte Art Direction und prüft sie in einem echten Browser. |
| **qatlas-council [arch]** | Berät mit unabhängigen Subagents zu Plänen oder Architektur. |

Claude nutzt `/<aufruf>`, Codex `$<aufruf>` oder das Menü `/skills`. `qatlas-dev`, `qatlas-design` und
`qatlas-council` sind nur verfügbar, wenn ihr Pack installiert ist.
