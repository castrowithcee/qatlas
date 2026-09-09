---
description: >
  Human-in-the-loop-Verfahren für gesicherte Entscheidungen, Prüfungen, Abnahmen und Nutzerhandlungen aus
  einem Qatlas-Lauf, ohne die fachliche Ausführung fortzusetzen.
type: playbook
edit: locked
license: MIT
---

# Übergaben klären

Offene menschliche Übergaben gehen hinein. Geklärte, wieder ausführbare oder bewusst beendete Tasks kommen
heraus.

## Scope-in

Der Aufruf umfasst die lesende Bestandsaufnahme, Änderungen an Spine und Entscheidungen sowie einen
lokalen Sammelcommit am vollständigen Ende.

## Scope-out

Umsetzung, Worker, Integration, externe Wirkungen und Pushes bleiben außerhalb dieses Laufs.

## Schlange bilden

1. Bestimme Planungssystem und ausdrücklich gewählten Scope.
2. Ist `.qatlas-project/README.md` vorhanden, folge von dort nur den Lesebedingungen, die für die gewählten
   Übergaben relevant sind. Beziehe fachliche Quellen außerhalb des Wissensraums nach ihrem Gegenstand ein;
   bloßes Lesen oder automatische Bereitstellung erhöht ihre Autorität nicht.
3. Lies zunächst nur Roster beziehungsweise externe Metadaten und bilde daraus die Schlange aus `review`
   und ausdrücklich offenen Nutzerentscheidungen, Prüfungen oder Handlungen. Reife keine Drafts und
   verändere keinen Task mit laufendem Worker.
4. Lies nur die Tasks der gebildeten Schlange vollständig. Sammle aus ihrem aktuellen Datensatz Ist-Stand,
   Belege, offene Frage, Empfehlung und Folgen. Öffne Historie nur bei einem Widerspruch, fehlender
   entscheidungsrelevanter Begründung oder ausdrücklichem Verweis und frage nichts erneut, was bereits in den
   aktuellen Stand eingearbeitet ist.
5. Prüfe bei Git Root, Branch, Upstream, Worktrees und Status. Ein neuer Review beginnt sauber; eine
   Fortsetzung darf nur ihren eindeutig zugeordneten Entscheidungsdiff weiterführen.
6. Lies vor der ersten Übergabe vollständig
   [Entscheidungen knapp vorlegen](decision-card.md). Nenne nur die Anzahl der Aufgaben in der Schlange und
   beginne dann mit der ersten Karte nach diesem gemeinsamen Dialog.

Der gemeinsame Dialog regelt Orientierung und Darstellung. Die folgenden Abschnitte regeln weiterhin, wie
`review` die Antwort festhält und den Lauf vollständig beendet.

## Antwort festhalten

- Schreibe die Entscheidung an den vorhandenen fachlichen Ort im Task, nicht in ein separates Protokoll.
  Pflege Task und Übergabe als aktuellen Snapshot nach dem maßgeblichen Vertrag. Arbeite die daraus
  geltenden Anweisungen und überprüfbaren Abnahmen konkret ein; ein Quellenlink allein reicht nicht.
- Wähle den nächsten Status nach dem maßgeblichen Vertrag: `next`, wenn die Aufgabe nach einem neuen
  ausdrücklichen Lauf fortgesetzt werden kann, `review`, solange eine Nutzerhandlung offen bleibt,
  `waiting` bei einer externen Voraussetzung,
  `draft` bei einer weiterhin offenen Vertragsfrage oder `done`, wenn die menschliche Abnahme den bereits
  belegten Abschluss vervollständigt. Schließe und archiviere ihn dann im selben Schritt nach den Regeln des
  maßgeblichen Planungssystems.
- Aktualisiere nach jeder vollständig geklärten Aufgabe Spine und Zeitstempel nach dem maßgeblichen System.
- Eine Antwort autorisiert keine Ausführungsarbeit. Dafür ist ein neuer ausdrücklicher Lauf nötig.

Ändert die bestätigte Entscheidung eine maßgebliche Grundlage, pflege sie an deren fachlichem Ort und prüfe
die davon betroffenen offenen Tasks gezielt auf veraltete Vorgaben. Ändere dabei keine anderen Ziele oder
Abnahmekriterien still.

## Vollständig beenden

Erzeuge keinen Zwischencommit. Prüfe nach jeder Antwort, dass der Steuerbranch nicht fremd verändert wurde.
Erst wenn jede Übergabe der anfänglichen Schlange geklärt ist, lies den vollständigen Diff und erstelle nach
der Git-Norm genau einen lokalen Sammelcommit pro betroffenem Repo. Der ausdrückliche Skill-Aufruf ersetzt
für diesen einen Commit die vorherige Einzelabnahme der Nachricht; zeige Nachricht und ID danach. Bei
offenem Rest oder vorzeitigem Ende committe nicht. Pushe nichts.
