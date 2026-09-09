---
name: qatlas-help
description: >
  Zeigt auf ausdrücklichen Aufruf die zentrale Karte des Qatlas-Plugins, seiner Einstiege, automatischen
  Fähigkeiten und optionalen Fach-Packs. Kein dauerhafter Modus und keine automatische Hilfe.
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
Verwaltungswerkzeuge und Arbeitsloop starten ausschließlich durch einen Nutzeraufruf.

## Qatlas-Einstieg

| Aufruf | Aufgabe |
|---|---|
| **qatlas setup** | Richtet Scaffold, Projekt-Ruleset und nutzerweite Einstellungen ein. |
| **qatlas goal** | Klärt Idee, Zielbild und kleinsten tragfähigen Umfang ausschließlich im Gespräch. |
| **qatlas shape** | Dokumentiert bestätigtes Wissen, schneidet ausführbare Arbeit und bildet bei leerem Horizont bis zu fünf `next`-Tasks. |
| **qatlas backlog** | Bespricht ohne Scope alle Drafts einzeln bis `ready`, prüft wartende Arbeit und bildet einen sinnvollen `next`-Horizont. |
| **qatlas run** | Führt höchstens fünf Tasks seriell aus; der Orchestrator steuert und Subagents setzen jeweils den aktiven Task um. |
| **qatlas review** | Klärt menschliche Entscheidungen, Prüfungen und Abnahmen einzeln und beginnt keine Ausführung. |
| **qatlas worktree** | Zeigt gemeinsame Git-Worktrees nummeriert, legt mit `new` kontextgeleitet an und räumt sicher auf. |
| **qatlas-core doctor** | Prüft Store, Scaffold, Abhängigkeiten und den repo-lokalen Plugin-Update-Stand. |
| **qatlas-core statusline** | Konfiguriert die Statusline des aktuellen Hosts. |
| **qatlas-core ping** oder **qatlas-core ping telegram** | Richtet einen einseitigen Telegram-Push beim Warten ein. |
| **qatlas-core backlog-system** | Wechselt oder migriert das maßgebliche Planungssystem. |
| **qatlas-mode adhd** | Formt die Zusammenarbeit für den Rest der Session handlungsfreundlich für ADHD. |
| **qatlas-help** | Zeigt diese zentrale Karte. |

`qatlas`, `qatlas-core` und `qatlas-mode` sind Router. `qatlas-help` bleibt der einzige direkte
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

## Optionale Fach-Packs

| Pack | Zweck |
|---|---|
| **qatlas-dev** | Aktiviert sich bei tatsächlicher Codearbeit; `qatlas-dev lite`, `qatlas-dev` oder `qatlas-dev ultra` setzen die Sessionstufe, `qatlas-dev-review` prüft Over-Engineering. |
| **qatlas-web** | Liefert bei aktiver Webprodukt-Arbeit automatisch die passende Produkt-, UI-, Daten-, Architektur- und Betriebsmethode. |

## Zusammenarbeit und Scaffold

- `.qatlas-project/README.md` führt in den repo-eigenen Projektzustand und von dort bedarfsgerecht zu
  fachlichen Quellen. Ihr Fundort oder automatisches Laden erhöht deren Autorität nicht.
- Projektanweisungen und `BACKLOG.md` führen zum maßgeblichen Planungssystem. Der lokale Backlog wird nie
  als Spiegel eines externen Systems gepflegt. Taskverträge übernehmen geltende Vorgaben konkret; Links
  dienen nur der Nachprüfung.
- `zone-import/` und `zone-export/` sind flüchtige Puffer. Backlog und Memory sind einmaliger verwalteter
  Projektzustand; `templates/` gehört dem Nutzer. Der Update-Prüfstand liegt im technischen Namespace.
- Der Pfad sagt, wo Inhalt liegt; Frontmatter sagt, was es ist. Das vollständige Inhaltsschema wird erst
  vor einer tatsächlichen Markdown-Änderung geladen.
- `~/.qatlas/plugins/config.yaml` schaltet Sessionstart und verwaltete Arbeitsvereinbarung nutzerweit.

Claude verwendet `/qatlas <modus>`, `/qatlas-core <modus>`, `/qatlas-mode <modus>` oder
`/qatlas-help`; Codex verwendet die entsprechenden `$…`-Skills oder das `/skills`-Menü.
