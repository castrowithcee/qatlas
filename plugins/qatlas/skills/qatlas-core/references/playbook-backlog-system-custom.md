---
description: >
  Werkzeugneutrales Adapterverfahren für unbekannte, benutzerdefinierte oder noch nicht eigens unterstützte
  Planungssysteme mit aktuellem Taskzustand, selektiver Historie, Mapping, Authentifizierung und Migration.
license: MIT
type: playbook
edit: locked
---

# Neutraler Adapter und Fallback

Lies diese Reference bei jedem Wechsel. Ein providerspezifischer Adapter ergänzt sie nur um belegte
Besonderheiten; er ersetzt weder die Sicherheitsgrenzen noch die Migrationsschritte.

## Fähigkeiten erheben

Bestimme aus offizieller Dokumentation, verfügbaren Tools und einer kleinen lesenden Probe:

| Bereich | Zu klären |
|---|---|
| Autorität | Welcher Container oder Datensatz ist maßgeblich und wie wird er eindeutig adressiert? |
| Arbeitseintrag | Task, Issue, Karte, Datenbankzeile oder anderes Objekt; Drafts getrennt oder gleichartig? |
| Schema | Titel, Beschreibung, Status, Typ, Labels, Verantwortliche, Termine, Beziehungen und Archivierung. |
| Schnittstelle | CLI, REST, GraphQL, SDK, MCP oder Export; Lese-, Schreib- und Batch-Fähigkeit getrennt. |
| Authentifizierung | Unterstützte Tokenarten, minimale Berechtigungen, Ablauf, Rotation und sichere Speicherung. |
| Grenzen | Primäre und sekundäre Limits, Pagination, maximale Batch- und Payload-Größe, Concurrency und Retries. |
| Lücken | Nicht automatisierbare Ansichten, Regeln, Formeln, Anhänge, Kommentare oder Historie. |
| Lesepfad | Welcher Datensatz ist der aktuelle Taskvertrag, wo lebt Chronologie und wie werden beide gezielt gelesen? |

Fehlen offizielle oder aktuelle Angaben, behandle die Fähigkeit als unbekannt. Führe keinen breiten
Schreibtest aus, um Dokumentation zu erraten.

## Sicherer Standard

- Bevorzuge vorhandene, eng berechtigte Zugangsmittel. Verlange keine neue globale Anmeldung, wenn ein
  bereits sicher konfigurierter, passender Zugang existiert.
- Lege Secrets im Credential Store oder in der vom Tool vorgesehenen geschützten Konfiguration ab, nie im
  Repo, in Shell-History, Argumenten, Logs oder Migrationsdateien.
- Trenne Erzeugung des Zielschemas, Übernahme der Inhalte und Umschalten der Autorität. Jeder Schritt wird
  unabhängig geprüft.
- Nutze stabile Quell-IDs als Idempotenzschlüssel. Kann das Ziel keinen versteckten Schlüssel tragen,
  verwende eine lokale, unversionierte Zuordnungsdatei für den Lauf.
- Bündele nur unabhängige Operationen. Ein großer Request ist kein Selbstzweck: Er muss unter Größen-,
  Kosten-, Timeout- und Teilfehlergrenzen bleiben.
- Drossle aktiv. Beachte Retry- und Reset-Hinweise und verwende exponentielles Backoff mit Obergrenze, statt
  einen fehlgeschlagenen Block sofort vollständig zu wiederholen.

## Ist-Stand und Historie trennen

- Bestimme genau einen maßgeblichen aktuellen Datensatz pro Arbeitseintrag. Er enthält den weiterhin gültigen
  Taskvertrag, bindende Entscheidungen, den belegten Stand und höchstens die aktuelle Übergabe.
- Behandle Kommentare, Änderungsverlauf und Laufberichte als Historienkanal, nie als still benötigten zweiten
  Teil des Taskvertrags. Arbeite eine dort getroffene bindende Entscheidung in den aktuellen Datensatz ein.
- Lies bei Übersichten zunächst nur Titel, Status, Kurzstand, Abhängigkeiten und Eigentümerschaft. Lade den
  vollständigen aktuellen Datensatz erst für ausgewählte Tasks und echte Blocker.
- Öffne Historie nur bei Widerspruch, fehlender entscheidungsrelevanter Begründung, Auditbedarf oder einem
  ausdrücklichen Verweis des aktuellen Datensatzes. Begrenze den Abruf über Zeitraum, Cursor, letzte Einträge
  oder andere Fähigkeiten des Werkzeugs, ohne den neuesten Eintrag allein zur Wahrheit zu erklären.
- Bietet das Ziel keinen getrennten Historienkanal, aktualisiere den Task in-place. Erzeuge nur dann ein
  zusätzliches Archiv, wenn die Chronologie selbst fachlich oder regulatorisch erhalten werden muss.

## Minimale Zielkonfiguration

Beginne für unbeholfene Nutzer mit dem kleinsten Modell, das den Arbeitsfluss vollständig trägt:

1. genau ein Statusfeld mit `Draft`, `Ready`, `Next`, `In progress`, `Review`, `Waiting`, `Done`
   oder einer bestätigten bedeutungsgleichen Abbildung;
2. ein verständlicher Arbeitseintrag mit Titel und vollständigem aktuellem Taskvertrag, der frühere
   Laufberichte nicht als Pflichtkontext fortschreibt;
3. eine Gesamtansicht sowie gefilterte Ansichten für die nächste Queue, laufende, zu prüfende und ruhende
   Arbeit, sofern das Ziel Ansichten automatisierbar unterstützt;
4. Labels oder Zusatzfelder nur für tatsächlich genutzte Typen, Bereiche oder Prioritäten;
5. keine Automationen, Formeln oder Workflows ohne konkreten Bedarf.

Kann eine Konfiguration nicht über die verfügbare Schnittstelle angelegt werden, erstelle eine kurze
manuelle Checkliste mit exakten UI-Namen. Behaupte nicht, sie sei umgesetzt.

## Provider-Reference ergänzen

Eine neue `references/<provider>.md` beschreibt nur Abweichungen und veränderliche Besonderheiten:

- offizielle Schnittstellen und benötigte Werkzeuge;
- Authentifizierungsoptionen und Sicherheitsabwägungen;
- konkrete Rate-, Paging-, Batch- und Payload-Grenzen;
- effiziente Lese- und Schreibmuster;
- nicht unterstützte Konfiguration und manueller Rest;
- direkte Links auf die maßgeblichen offiziellen Quellen mit Prüfdatum.

Das generische Mapping, die Ein-Autorität-Regel und das dauerhafte BACKLOG-Binding bleiben im Hauptskill
beziehungsweise in dieser Reference.
