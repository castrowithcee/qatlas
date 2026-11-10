---
description: >
  Maßgebliches Planungssystem eines Qatlas-Projekts sicher wechseln oder migrieren, für jeden Anbieter, und
  die neue Bindung ohne parallelen Spiegel dauerhaft festhalten.
---

# Planungssystem wechseln

Wechsle das maßgebliche Planungssystem so, dass danach genau eines gilt und
`.qatlas-project/backlog/BACKLOG.md` darauf zeigt. Plane dabei keine Produktarbeit und pflege keinen Spiegel.

Der Aufruf erlaubt Bestandsaufnahme und Migrationsplanung. Bevor du Daten im Ziel anlegst, den bisherigen
Bestand stilllegst oder lokale Quelldateien archivierst, zeige Mapping, Umfang, Risiken und Rückweg und hole
die Zustimmung des Nutzers ein.

## 1. Ausgangslage bestimmen

1. Fehlt das Qatlas-Scaffold, stoppe und verweise auf `qatlas-core init`.
2. Bestimme Quelle, Ziel und gewünschte Richtung. Unterstütze lokal nach extern, extern nach lokal und
   extern nach extern; unterstelle keinen Anbieter aus einem vorhandenen Git-Remote.
3. Erhebe für jede externe Seite aus offizieller Dokumentation, verfügbaren Tools und einer kleinen lesenden
   Probe:

| Bereich | Zu klären |
|---|---|
| Autorität | Welcher Container oder Datensatz ist maßgeblich und wie wird er eindeutig adressiert? |
| Arbeitseintrag | Task, Issue, Karte, Datenbankzeile oder anderes Objekt; Drafts getrennt oder gleichartig? |
| Schema | Titel, Beschreibung, Status, Typ, Labels, Verantwortliche, Termine, Beziehungen, Archivierung und Sichtbarkeit. |
| Schnittstelle | CLI, REST, GraphQL, SDK, MCP oder Export; Lese-, Schreib- und Batch-Fähigkeit getrennt. |
| Authentifizierung | Unterstützte Tokenarten, minimale Berechtigungen, Ablauf, Rotation und sichere Speicherung. |
| Grenzen | Primäre und sekundäre Limits, Pagination, maximale Batch- und Payload-Größe, Concurrency und Retries. |
| Lücken | Nicht automatisierbare Ansichten, Regeln, Formeln, Anhänge, Kommentare oder Historie. |
| Lesepfad | Welcher Datensatz trägt den aktuellen Taskvertrag, wo lebt Historie und was liest normale Taskarbeit davon? |

Fehlen offizielle oder aktuelle Angaben, behandle die Fähigkeit als unbekannt. Führe keinen breiten
Schreibtest aus, um Dokumentation zu erraten.

Eine bestehende Bindung ist Repo-Wahrheit. Widerspricht der erreichbare externe Stand dieser Bindung,
melde den Widerspruch und ändere nichts, bis die Autorität geklärt ist.

## 2. Zielmodell und Mapping bestätigen

Leite die kleinste Zielkonfiguration ab, die den Arbeitsfluss vollständig trägt:

1. genau ein Statusfeld für die lokale Task-Zustandsmenge `draft | ready | next | in-progress | review |
   waiting | done`, extern etwa `Draft`, `Ready`, `Next`, `In progress`, `Review`, `Waiting` und `Done`, oder
   eine bestätigte bedeutungsgleiche Abbildung; Projektstatus wie `active | final | archived` sind davon
   getrennt und werden nicht auf Taskstatus abgebildet;
2. ein Arbeitseintrag mit Titel und vollständigem aktuellem Taskvertrag;
3. eine Gesamtansicht und gefilterte Ansichten für die nächste Queue, laufende, zu prüfende und ruhende
   Arbeit, sofern das Ziel Ansichten automatisierbar unterstützt;
4. Labels oder Zusatzfelder nur für tatsächlich genutzte Typen, Bereiche oder Prioritäten;
5. keine Automationen, Formeln oder Workflows ohne konkreten Bedarf.

Kann eine Konfiguration nicht über die verfügbare Schnittstelle angelegt werden, erstelle eine kurze
manuelle Checkliste mit exakten UI-Namen. Behaupte nicht, sie sei umgesetzt.

Trenne im Ziel Ist-Stand und Historie:

- Genau ein aktueller Datensatz pro Arbeitseintrag enthält den weiterhin gültigen Taskvertrag, bindende
  Entscheidungen, den belegten Stand und höchstens die aktuelle Übergabe.
- Kommentare, Änderungsverlauf und Laufberichte sind Historienkanal, nie ein still benötigter zweiter Teil
  des Taskvertrags. Eine dort getroffene bindende Entscheidung gehört in den aktuellen Datensatz.
- Bietet das Ziel keinen getrennten Historienkanal, wird der Task in-place aktualisiert. Ein zusätzliches
  Archiv entsteht nur, wenn die Chronologie fachlich oder regulatorisch erhalten werden muss.

Zeige vor schreibenden Migrationsschritten kompakt:

- Quelle, Ziel und künftig maßgebliche Autorität;
- Anzahl und Arten der zu übernehmenden Einträge;
- Feld- und Statusmapping einschließlich nicht abbildbarer Werte;
- Umgang mit Drafts, Abhängigkeiten, Anhängen, Kommentaren, Historie und abgeschlossenen Einträgen;
- Zielkonfiguration, benötigte Berechtigungen, bekannte API-Grenzen und geschätztes Request-Budget;
- Idempotenzschlüssel, Verifikation, Rückweg und den Umgang mit der bisherigen Quelle.

Frage nur nach Entscheidungen, die sich nicht aus Repo, Quelle oder Ziel ableiten lassen.

## 3. Sicher migrieren

Bevorzuge vorhandene, eng berechtigte Zugangsmittel und verlange keine neue globale Anmeldung, wenn ein
passender sicherer Zugang existiert. Secrets und Tokens liegen im Credential Store oder in der vom Tool
vorgesehenen geschützten Konfiguration, nie im Repo, in Shell-History, Argumenten, Logs oder
Migrationsdateien. Zielschema, Übernahme der Inhalte und Umschalten der Autorität sind getrennte, einzeln
geprüfte Schritte.

1. Prüfe das Ziel zuerst lesend und erzeuge bei unterstützter Schnittstelle einen kleinen, eindeutig
   erkennbaren Testeintrag. Entferne ihn nach erfolgreicher Prüfung wieder, sofern das ohne
   Informationsverlust möglich ist.
2. Löse unveränderliche IDs, Felddefinitionen und Auswahlwerte einmal auf. Bündele nur unabhängige Abfragen
   und Mutationen in kontrollierten, beobachtbaren Blöcken unter den dokumentierten Größen-, Rate-, Timeout-
   und Inhaltsgrenzen; ein großer Request ist kein Selbstzweck.
3. Erzeuge Zielobjekte idempotent mit stabilen Quell-IDs als Schlüssel. Kann das Ziel keinen versteckten
   Schlüssel tragen, halte während des Laufs eine nicht versionierte Zuordnung von Quell-ID zu Ziel-ID, ohne
   Zugangsdaten oder unnötige personenbezogene Rohdaten. Übernimm in den aktuellen Zieldatensatz nur
   weiterhin gültigen Taskvertrag, Entscheidungen und aktuelle Übergabe. Arbeite die geltenden
   Entscheidungen, Konventionen und Anforderungen als konkrete Taskanweisungen und überprüfbare Abnahme ein;
   Quellenlinks allein genügen nicht. Migriere eine fachlich benötigte Chronologie getrennt, statt frühere
   Laufberichte in den Pflichtkontext des Tasks zu verkleben.
4. Verifiziere nach jedem Block Fehler, Anzahl und Stichproben. Bei Rate-Limit oder Teilfehler stoppe,
   beachte Retry- und Reset-Hinweise, warte mit exponentiellem Backoff mit Obergrenze, erhalte die Zuordnung
   und wiederhole einen Block nie blind vollständig.
5. Ändere oder entferne die Quelle erst, wenn das Ziel vollständig verifiziert und der Nutzer dem Umschalten
   zugestimmt hat. Ein alter lokaler Backlog darf nicht als zweites aktives System liegen bleiben; archiviere
   oder entferne ihn nur nach ausdrücklicher Freigabe.

Für das lokale Ziel lies vollständig
[den lokalen Backlog-Vertrag](../../qatlas-core-backlog/references/local-backlog.md) und instanziiere danach
die dort genannten kanonischen Vorlagen. Importierte Tasks erhalten kollisionsgeprüfte lokale IDs; externe
IDs bleiben nur als knapper Herkunftshinweis erhalten, wenn sie für Rückverfolgung oder Links nötig sind.

## 4. Bindung umschalten

Mache `.qatlas-project/backlog/BACKLOG.md` erst nach erfolgreicher Verifikation in einem Schritt zum neuen
Wegweiser: bei lokalem Ziel mit dem Roster nach dem lokalen Backlog-Vertrag, bei externem Ziel nach
[der Bindungsvorlage](../assets/backlog-system-external-binding.md).

Passe widersprechende Planungshinweise in den nativen Projektanweisungen nur nach Zustimmung an. Es bleibt
genau eine Autoritätsaussage und kein zweites Anbieterhandbuch im Repo.

## 5. Abschluss belegen

Vergleiche Quell- und Zielanzahl nach Typ und Status, prüfe eine Stichprobe vollständig und bestätige, dass
alle Links in der neuen Bindung erreichbar sind. Berichte:

- migrierte, übersprungene und fehlgeschlagene Einträge;
- bewusst nicht übernommene Daten und verbleibende manuelle Konfiguration;
- das neue maßgebliche System und den Rückweg;
- verbliebene Quellartefakte, die noch nicht freigegeben archiviert oder entfernt wurden.

Ein Systemwechsel ist erst abgeschlossen, wenn die Bindung stimmt, das Ziel verifiziert ist und kein
unbeabsichtigter zweiter aktiver Backlog behauptet wird.
