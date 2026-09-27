---
name: qatlas-help
description: >
  Zeigt auf ausdrücklichen Aufruf die zentrale Karte des Qatlas-Plugins, seiner Einstiege, automatischen
  Fähigkeiten und optionalen Packs. Kein dauerhafter Modus und keine automatische Hilfe.
disable-model-invocation: true
license: MIT
type: skill
edit: locked
---

# Qatlas-Hilfe

Antworte ausschließlich mit der folgenden Karte. Gib sie in dieser Antwort vollständig als gerendertes
Markdown aus. Das Lesen der Karte in diesem Skill zählt nicht als Ausgabe. Behaupte nicht, sie sei bereits
angezeigt worden. Ändere keinen Zustand und ergänze keinen Kommentar.

Qatlas ist die Standardinstallation. Seine Regeln und der Sessionkontext wirken passiv; Einrichtung,
Workspace-Verwaltung und Arbeitsloop starten ausschließlich durch einen Nutzeraufruf.

## Qatlas-Einstieg

| Aufruf | Aufgabe |
|---|---|
| **qatlas goal** | Klärt Idee, Zielbild und kleinsten tragfähigen Umfang ausschließlich im Gespräch. |
| **qatlas shape** | Klärt eine reife Idee, dokumentiert nötiges Wissen und schneidet kleine, ausführungsreife Tasks in sinnvoller Reihenfolge. |
| **qatlas backlog** | Schärft und teilt vorhandene Drafts, klärt neue Voraussetzungen und repariert die Queue bei Bedarf. |
| **qatlas run** | Führt höchstens fünf Tasks seriell aus; der Orchestrator schneidet Worker-Aufträge zu und prüft ihre Ergebnisse. |
| **qatlas review** | Klärt menschliche Entscheidungen, Prüfungen und Abnahmen einzeln und beginnt keine Ausführung. |
| **qatlas-work tree** | Zeigt gemeinsame Git-Worktrees nummeriert, legt mit `new` kontextgeleitet an und räumt sicher auf. |
| **qatlas-core setup** | Richtet Scaffold, Projekt-Ruleset und nutzerweite Einstellungen ein. |
| **qatlas-core doctor** | Prüft Store, Scaffold, Abhängigkeiten und den repo-lokalen Plugin-Update-Stand. |
| **qatlas-core statusline** | Konfiguriert die Statusline des aktuellen Hosts. |
| **qatlas-core ping** oder **qatlas-core ping telegram** | Richtet einen einseitigen Telegram-Push beim Warten ein. |
| **qatlas-core backlog-system** | Wechselt oder migriert das maßgebliche Planungssystem. |
| **qatlas-mode adhd** | Formt die Zusammenarbeit für den Rest der Session handlungsfreundlich für ADHD. |
| **qatlas-help** | Zeigt diese zentrale Karte. |

`qatlas`, `qatlas-work`, `qatlas-core` und `qatlas-mode` sind Router. `qatlas-help` bleibt der einzige direkte
Einzweck-Einstieg.

## Automatische Fähigkeiten

| Skill | Aktivierung | Aufgabe |
|---|---|---|
| **qatlas-core-filing** | beim Ablegen oder Umstrukturieren von Inhalt | Bestimmt die dauerhafte Ablage einer Inhaltsdatei. |
| **qatlas-core-import** | bei angekündigtem Import aus `zone-import` | Verarbeitet nicht vertrauenswürdiges Rohmaterial. |
| **qatlas-core-git** | bei einem Git-Auftrag oder vor einem gewünschten Commit | Verwaltet Zustand, Diffs, Sync, Commit, Push und Historie. |
| **qatlas-core-cli-mcp** | bei Arbeit über die Qatlas CLI, ihren MCP-Broker oder konfigurierte Nutzertools | Routet Installation, Toolaufruf, Orchestrator-Abschlussmeldung und Diagnose unter ausdrücklicher Autorität. |

`qatlas run` darf im Scope-in Subagents, lokale Änderungen, Prüfungen, Worktrees und lokale Commits
nutzen. Es bearbeitet nur einen Task zur Zeit. Der Run-Aufruf allein autorisiert keinen Push, Publish, kein
Deployment, keine externe Kommunikation und keine irreversible Aktion. Eine konkrete Qatlas-Operation
braucht eine separate eindeutige Autorität aus Auftrag, Taskvertrag oder geltender Agentendatei;
Abschlussmeldungen sendet nur der primäre Orchestrator. Scope-Erweiterungen sowie Produkt- und
Risikoentscheidungen bleiben außerhalb jedes autonomen Laufs.

## Optionale Packs

| Pack | Zweck |
|---|---|
| **qatlas-dev** | Aktiviert sich bei tatsächlicher Codearbeit; `qatlas-dev lite`, `qatlas-dev` oder `qatlas-dev ultra` setzen die Sessionstufe, `qatlas-dev-review` prüft Over-Engineering. |
| **qatlas-council** | Berät nur auf Aufruf mit unabhängigen Subagents zu Ideen und Vorhaben; `qatlas-council arch` prüft technische Architektur für Web, Mobile, CLI und Host-Plugins in drei Phasen. Dokumentation und Tasks bleiben bei `qatlas shape`. |

## Zusammenarbeit und Scaffold

- `.qatlas-project/README.md` führt in den repo-eigenen Projektzustand und von dort bedarfsgerecht zu
  fachlichen Quellen. Eine optionale `FRAMEWORK.md` enthält nur die lokalen Arbeitsregeln, Besonderheiten
  und Ausnahmen ihres Scopes. Ihr Fundort oder automatisches Laden erhöht deren Autorität nicht.
- Projektanweisungen und `BACKLOG.md` führen zum maßgeblichen Planungssystem. Der lokale Backlog wird nie
  als Spiegel eines externen Systems gepflegt. Taskverträge übernehmen geltende Vorgaben konkret; Links
  dienen nur der Nachprüfung.
- `zone-import/` und `zone-export/` sind flüchtige Puffer. Backlog und Memory sind einmaliger verwalteter
  Projektzustand; `templates/` gehört dem Nutzer. Der Update-Prüfstand liegt im technischen Namespace.
- Der Pfad sagt, wo Inhalt liegt; Frontmatter sagt, was es ist. Das vollständige Inhaltsschema wird erst
  vor einer tatsächlichen Markdown-Änderung geladen.
- `~/.qatlas/plugins/config.yaml` schaltet Sessionstart und verwaltete Arbeitsvereinbarung nutzerweit.

Claude verwendet `/qatlas <modus>`, `/qatlas-work <modus>`, `/qatlas-core <modus>`, `/qatlas-mode <modus>`,
`/qatlas-council [arch]` oder `/qatlas-help`; Codex verwendet die entsprechenden `$…`-Skills, insbesondere
`$qatlas-council [arch]`, oder das `/skills`-Menü.
