# Qatlas

Qatlas ist ein Arbeitsfundament für Coding-Agents wie Claude Code und Codex. Es gibt Agent, Mensch und Projekt
eine gemeinsame Ordnung, damit Arbeit über Sitzungen, Agenten und Geräte hinweg nachvollziehbar, sparsam und
sicher bleibt.

| Problem | Antwort von Qatlas |
|---|---|
| Wissen geht zwischen Sitzungen verloren | Projektwissen, Entscheidungen und Merkzettel liegen im Repo und werden beim Start jeder Sitzung als kurzer Einstieg geladen |
| Agenten suchen blind und verbrauchen dabei viel | Ein Wegweiser führt vom Einstieg zur passenden Datei, statt ganze Ordner zu lesen |
| Die Ablage wuchert | Jede Datei hat einen festen Ort, Namen und Steckbrief |
| Planung franst aus | Je Projekt gibt es genau ein maßgebliches Planungssystem, im Repo oder extern, ohne Kopie |
| Parallele Agenten stören einander | Jede Aufgabe bekommt einen eigenen Arbeitsbaum, und nur eine Rolle führt Ergebnisse zusammen |
| Sensible Daten landen im Repo | Eine Schutzprüfung sucht vor jedem Commit nach Zugangsdaten und personenbezogenen Daten |

Drei Grundsätze gelten überall:

- Was im Repo steht, gilt. Anweisungen des Nutzers und des Projekts haben immer Vorrang vor Qatlas.
- Von selbst wirkt nur Kontext. Werkzeuge und Arbeitsschleifen starten nur auf deinen Aufruf.
- Qatlas erklärt und ordnet. Es entscheidet nicht für dich.

## Voraussetzungen

- Claude Code oder Codex
- Git
- Node.js ab Version 18.15 im Suchpfad. Ohne Node laden die Hooks weder Regeln noch Projektzustand. Der Start
  einer Sitzung nennt das in einer Zeile.
- Windows ist nicht am Gerät geprüft. Claude Code braucht dort Git for Windows, weil die Hooks in Git Bash
  laufen. Unter Codex auf Windows ist offen, ob die Hooks laufen.
- Für das Pack `qatlas-design` Node.js ab Version 22, ein installiertes Chrome, Edge oder Chromium und
  Internetzugang.

## Installation

**Claude Code**

```text
/plugin marketplace add castrowithcee/qatlas
/plugin install qatlas@qatlas
```

Dasselbe in der Kommandozeile: `claude plugin marketplace add castrowithcee/qatlas` und
`claude plugin install qatlas@qatlas`. Ein Update holst du mit `claude plugin marketplace update qatlas` und
`claude plugin update qatlas@qatlas`.

**Codex**

```text
codex plugin marketplace add castrowithcee/qatlas
codex plugin add qatlas@qatlas
```

Starte danach eine neue Sitzung. In der Sitzung zeigt `/plugins` alle Plugins des Marketplaces. Ein Update
holst du mit `codex plugin marketplace upgrade qatlas`.

## Erste Schritte

Einen Skill rufst du in Claude Code mit `/<name>` auf, in Codex mit `$<name>` oder über das Menü `/skills`.

1. `qatlas-core init` richtet ein Projekt ein, ohne Rückfrage und ohne etwas Vorhandenes zu ersetzen: Git-Repo,
   `AGENTS.md`, `CLAUDE.md`, `README.md`, den Wissensraum `.qatlas-brain/` und deine persönliche Bibliothek
   `~/qatlas/`.
2. `qatlas-help` führt dich wie ein Handbuch durch alles Weitere.
3. `qatlas-core doctor` prüft jederzeit den Zustand, ohne etwas zu ändern.

## Die Arbeitsschleife

Vier Schritte, jeder mit eigenem Aufruf. Keiner startet von selbst den nächsten.

| Schritt | Aufruf | Was passiert |
|---|---|---|
| Ziel klären | `qatlas goal [Idee, Task oder Datei] [--check]` | Ein Gespräch macht aus einer Idee einen bestätigten Plan. Es ändert nichts |
| Zuschneiden | `qatlas shape [Datei, Task oder backlog]` | Aus dem Plan werden kleine, ausführungsreife Aufgaben im Planungssystem |
| Ausführen | `qatlas run [Scope] [--limit <n\|0>]` | Unteragenten arbeiten die reifen Aufgaben parallel ab, ohne dass du dabei sein musst |
| Übergaben abschließen | `qatlas review [Scope]` | Du bekommst einzeln vorgelegt, was nur du entscheiden, prüfen oder tun kannst |

`goal` ist freiwillig. Wer schon weiß, was er will, beginnt mit `shape`.

Der Lauf committet und führt lokal zusammen. Er pusht, öffnet Pull Requests und mergt nur, wenn deine
Anweisungen oder die des Projekts es verlangen und erlauben. Er veröffentlicht nichts, liefert nichts aus und
tut nichts Unumkehrbares.

## Was von selbst geschieht

Nach der Installation verändert Qatlas nichts in deinem Projekt. Es gibt dem Agenten beim Start einer Sitzung
Kontext mit und erinnert ihn nach Dateiänderungen an Regeln des Wissensraums. Kein Hook blockiert, ändert oder
verwirft eine deiner Dateien.

Der Agent lädt fünf Kern-Skills selbst, sobald der Anlass eintritt: Wissen finden, Dateien ablegen, im
Planungssystem arbeiten, Git sicher bedienen und Einstellungen ändern.

## Wo Qatlas etwas ablegt

| Ort | Inhalt |
|---|---|
| `.qatlas-brain/` im Repo | Der Wissensraum: Absicht, Regeln, Wissen, Merkzettel und der Wegweiser zur Planung |
| `.qatlas/plugins/config.json` im Repo | Einstellungen des Projekts |
| `.qatlas/local/` im Repo | Arbeitsdateien dieses Checkouts, nie versioniert |
| Zweig `qatlas-backlog` im Repo | Die mitgelieferte Aufgabenliste, getrennt von der Geschichte des Codes |
| `~/qatlas/` | Deine persönliche Bibliothek mit der globalen Arbeitsvereinbarung `AGENTS.qatlas.md` |
| `~/.qatlas/` | Technischer Zustand: persönliche Einstellungen, Statuszeile, Laufprotokolle, Arbeitsbäume |

## Plugins

| Plugin | Rolle |
|---|---|
| `qatlas` | Das Fundament und die einzige Standardinstallation |
| `qatlas-dev` | Optional. Methode für Codearbeit: die kleinste Änderung, die eine Aufgabe vollständig löst, dazu Review einer Änderung und Audit eines Repos |
| `qatlas-design` | Optional. Art Direction für Webseiten und App-Screens, geprüft in einem echten Browser. Es lädt Bilder aus offenen Sammlungen, und die fertige Seite bindet Schriften und Skripte fremder Server ein, solange sie nicht lokal abgelegt sind |
| `qatlas-sentinel` | Optional, Beta. Eine Sitzung behält mehrere Projekte im Blick und meldet alle 45 Minuten, was dich braucht |

Die optionalen Packs brauchen `qatlas`.

## Unterschiede zwischen den Hosts

| Thema | Claude Code | Codex |
|---|---|---|
| Rollen im Lauf | eigene Agententypen für Lead, Integrator und Worker | allgemeiner Unteragent, der die Rollendatei liest |
| Modellwahl im Lauf | wird erzwungen | setzt allein der Agent |
| Statuszeile | eigene Zeile mit 13 Bausteinen | Auswahl aus den eingebauten Feldern |
| `qatlas-sentinel` | läuft über einmalige Termine | nur, wo die Oberfläche einen Termin in derselben Sitzung planen kann |

## Fehler melden

Unter https://github.com/castrowithcee/qatlas/issues mit der Vorlage für Fehlermeldungen. Trage dort keine
privaten Projektdaten ein.

## Lizenz

MIT, siehe `LICENSE`. Übernommene Inhalte und ihre Lizenzen nennt die Datei `THIRD-PARTY-LICENSES.md` im
jeweiligen Plugin.
