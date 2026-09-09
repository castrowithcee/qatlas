---
description: >
  Maßgebliches Planungssystem eines Qatlas-Projekts sicher wechseln oder migrieren und das neue Binding
  ohne parallelen Spiegel dauerhaft festhalten.
license: MIT
type: playbook
edit: locked
---

# Planungssystem wechseln

Dieser Skill führt einen seltenen Systemwechsel aus. Danach gibt es genau ein maßgebliches Planungssystem;
`.qatlas-project/backlog/BACKLOG.md` bleibt der beim Sessionstart geladene Wegweiser dorthin. Der Skill plant
keine Produktarbeit und pflegt keinen dauerhaften Spiegel.

Der ausdrückliche Aufruf autorisiert Bestandsaufnahme und Migrationsplanung. Bevor du Daten im Ziel anlegst,
den bisherigen Bestand stilllegst oder lokale Quelldateien archivierst, zeige Mapping, Umfang, Risiken und
Rückweg und hole die Zustimmung des Nutzers ein. Secrets und Tokens gehören nie ins Repo.

## 1. Ausgangslage bestimmen

1. Lies Projektanweisungen, `.qatlas-project/README.md` und `.qatlas-project/backlog/BACKLOG.md`. Folge aus
   der README nur den für den Systemwechsel passenden Lesebedingungen. Fehlt das Qatlas-Scaffold, stoppe und
   verweise auf `qatlas setup`.
2. Bestimme Quelle, Ziel und gewünschte Richtung. Unterstütze lokal nach extern, extern nach lokal und
   extern nach extern; unterstelle keinen Anbieter aus einem vorhandenen Git-Remote.
3. Ermittle für beide Seiten Titel, Container oder Projekt, Task-Artefakt, Entwurfsform, Status, Felder,
   Labels, Beziehungen, Archivierung, Sichtbarkeit und verfügbare Schnittstellen. Bestimme ausdrücklich,
   welcher Datensatz den aktuellen Taskvertrag trägt, wo Historie lebt und was normale Taskarbeit davon
   standardmäßig liest.
4. Lies immer [das neutrale Adapterverfahren](backlog-system-custom.md). Für GitHub lies zusätzlich
   [die GitHub-Besonderheiten](backlog-system-github.md). Für einen später ergänzten bekannten Anbieter gilt
   dessen eigene Reference zusätzlich; ohne passende Reference bleibt `custom.md` der vollständige
   Fallback.

Ein bestehendes Binding ist Repo-Wahrheit. Widerspricht der erreichbare externe Stand diesem Binding,
melde den Widerspruch und ändere nichts, bis die Autorität geklärt ist.

## 2. Zielmodell und Mapping bestätigen

Leite die kleinste sinnvolle Zielkonfiguration ab. Die lokale Task-Zustandsmenge ist
`draft | ready | next | in-progress | review | waiting | done`; externe Anzeigenamen dürfen etwa `Draft`,
`Ready`, `Next`, `In progress`, `Review`, `Waiting` und `Done` lauten. Projektstatus wie
`active | final | archived` sind davon getrennt und werden nicht auf Taskstatus abgebildet.

Zeige vor schreibenden Migrationsschritten kompakt:

- Quelle, Ziel und künftig maßgebliche Autorität;
- Anzahl und Arten der zu übernehmenden Einträge;
- Feld- und Statusmapping einschließlich nicht abbildbarer Werte;
- Umgang mit Drafts, Abhängigkeiten, Anhängen, Kommentaren, Historie und abgeschlossenen Einträgen sowie die
  Trennung zwischen maßgeblichem Ist-Stand und nur bedarfsweise gelesener Chronologie;
- Zielkonfiguration, benötigte Berechtigungen, bekannte API-Grenzen und geschätztes Request-Budget;
- Idempotenzschlüssel, Verifikation, Rückweg und den Umgang mit der bisherigen Quelle.

Verwende bei einer neuen GitHub-Konfiguration
[`../assets/backlog-system-github-config.yaml`](../assets/backlog-system-github-config.yaml) als veränderbaren Ausgangspunkt,
nicht als blind anzuwendende Norm. Frage nur nach Entscheidungen, die sich nicht aus Repo, Quelle oder Ziel
ableiten lassen.

## 3. Sicher migrieren

1. Prüfe das Ziel zuerst lesend und erzeuge bei unterstützter Schnittstelle einen kleinen, eindeutig
   erkennbaren Testeintrag. Entferne ihn nach erfolgreicher Prüfung wieder, sofern das ohne Informationsverlust
   möglich ist.
2. Löse unveränderliche IDs, Felddefinitionen und Auswahlwerte einmal auf. Bündele lesende Abfragen und
   schreibende Mutationen in kontrollierten, beobachtbaren Blöcken; halte jeden Block unter den dokumentierten
   Größen-, Rate- und Inhaltsgrenzen des Werkzeugs.
3. Erzeuge Zielobjekte idempotent und halte während des Laufs eine nicht versionierte Zuordnung von Quell-ID
   zu Ziel-ID. Schreibe keine Zugangsdaten oder unnötigen personenbezogenen Rohdaten hinein.
   Übernimm in den aktuellen Zieldatensatz nur weiterhin gültigen Taskvertrag, Entscheidungen und aktuelle
   Übergabe. Arbeite die geltenden Entscheidungen, Konventionen und Anforderungen als konkrete
   Taskanweisungen und überprüfbare Abnahme ein; Quellenlinks allein genügen nicht. Migriere eine fachlich
   benötigte Chronologie getrennt, statt frühere Laufberichte in den Pflichtkontext des Tasks zu verkleben.
4. Verifiziere nach jedem Block Fehler, Anzahl und Stichproben. Bei Rate-Limit oder Teilfehler stoppe anhand
   der Antwort-Header, erhalte die Zuordnung und setze nicht blind erneut an.
5. Ändere oder entferne die Quelle erst, wenn das Ziel vollständig verifiziert und der Nutzer dem Umschalten
   zugestimmt hat. Ein alter lokaler Backlog darf nicht als zweites aktives System liegen bleiben; archiviere
   oder entferne ihn nur nach ausdrücklicher Freigabe.

Für das lokale Ziel lies vollständig `<plugin-root>/rules/references/backlog.md` und instanziiere danach die
dort genannten kanonischen Vorlagen aus `<plugin-root>/store/backlog/`. Importierte Tasks erhalten
kollisionsgeprüfte lokale IDs; externe IDs bleiben nur als knapper Herkunftshinweis erhalten, wenn sie für
Rückverfolgung oder Links nötig sind.

## 4. Binding umschalten

Erst nach erfolgreicher Verifikation wird `.qatlas-project/backlog/BACKLOG.md` atomar zum neuen Wegweiser:

- Bei lokalem Ziel enthält es den lokalen Roster nach der Backlog-Regel und ihrer Referenz.
- Bei externem Ziel enthält es einen prominenten Link mit Titel und eine knappe Bindung: Anbieter,
  maßgebliches Projekt oder Datenobjekt, Task-Artefakt, Statusfeld und Werte, Entwurfsregel, Schreibweg,
  aktueller Datensatz, Historienkanal, Standard-Lesepolitik, Betriebsgrenzen und die klare Aussage
  `Lokaler Spiegel: keiner`.

Nutze für ein neues externes Binding
[`../assets/backlog-system-external-binding.md`](../assets/backlog-system-external-binding.md) als Ausgangspunkt. Lies eine
vorhandene Datei vor der Änderung, übernimm geltende projektspezifische Angaben und ersetze sie nie
pauschal. Zusätzliche Anbieterregeln gehören nur ins Binding, wenn der Agent sie bei normaler Taskarbeit
ständig braucht; ausführliche Migrationsdetails bleiben in diesem Skill.

Passe widersprechende Planungshinweise in den nativen Projektanweisungen nur nach Zustimmung an. Es bleibt
genau eine Autoritätsaussage und kein zweites Anbieterhandbuch im Repo.

## 5. Abschluss belegen

Vergleiche Quell- und Zielanzahl nach Typ und Status, prüfe eine Stichprobe vollständig und bestätige, dass
alle Links im neuen Binding erreichbar sind. Berichte:

- migrierte, übersprungene und fehlgeschlagene Einträge;
- bewusst nicht übernommene Daten und verbleibende manuelle Konfiguration;
- das neue maßgebliche System und den Rückweg;
- verbliebene Quellartefakte, die noch nicht freigegeben archiviert oder entfernt wurden.

Ein Systemwechsel ist erst abgeschlossen, wenn das Binding stimmt, das Ziel verifiziert ist und kein
unbeabsichtigter zweiter aktiver Backlog behauptet wird.
