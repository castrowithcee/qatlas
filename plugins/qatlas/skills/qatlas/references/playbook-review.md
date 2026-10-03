---
description: >
  Human-in-the-loop-Verfahren für einen Qatlas-Lauf: führt den Nutzer zügig durch konkrete Prüfungen und
  klärt gesicherte Entscheidungen, Abnahmen und Nutzerhandlungen, ohne die fachliche Ausführung
  fortzusetzen.
type: playbook
edit: locked
license: MIT
---

# Übergaben klären

Offene menschliche Übergaben gehen hinein. Geklärte, wieder ausführbare oder bewusst beendete Tasks kommen
heraus. Der Lauf soll dem Nutzer Zeit sparen: Den offenen Stand kann er selbst im Task lesen. Der Agent
bereitet vor, was der Nutzer sonst zusammensuchen müsste, und führt ihn auf kürzestem Weg durch das, was
nur er beurteilen kann.

## Scope-in

Der Aufruf umfasst die lesende Bestandsaufnahme, Änderungen an Spine und Entscheidungen sowie einen
lokalen Sammelcommit am vollständigen Ende.

## Scope-out

Umsetzung, Worker, technische Tests, Integration, externe Wirkungen und Pushes bleiben außerhalb dieses
Laufs.

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
6. Ordne jede Übergabe ein. Eine **Prüfung** liegt nur vor, wenn ein konkretes Ergebnis existiert, das der
   Nutzer selbst ansehen, ausführen oder ausprobieren muss. Alles andere, auch eine Abnahme ohne konkreten
   Prüfgegenstand, ist eine Entscheidung oder Nutzerhandlung.
7. Lies vor der ersten Übergabe vollständig [Entscheidungen knapp vorlegen](playbook-decision-card.md).
   Nenne nur die Anzahl der Aufgaben in der Schlange und beginne dann mit der ersten Karte nach diesem
   gemeinsamen Dialog.

## Prüfung führen

Bereite die Prüfung vollständig vor, bevor du den Nutzer ansprichst. Ermittle aus Abnahmekriterien,
Abschlussbericht und zugehörigem Diff, was sich geändert hat, wo es sichtbar wird und woran Erfolg
erkennbar ist. Lege nur vor, was der Nutzer selbst sehen oder beurteilen muss; maschinell Belegtes prüft er
nicht erneut.

Lege die Prüfung zuerst als Karte nach dem gemeinsamen Dialog vor und beginne noch nicht mit dem Ablauf. Zu
entscheiden ist, ob sie jetzt läuft. Die Optionen sind `Jetzt prüfen` mit Anzahl und Ort der Schritte und
`Überspringen`, nach dem der Task unverändert in `review` bleibt.

Erst nach `Jetzt prüfen` führst du Schritt für Schritt und zeigst immer nur einen Schritt:

```text
Prüfung 1/2: <was geprüft wird, in einem Satz>

Wo: <exakter Pfad, URL, Befehl oder Ansicht, direkt nutzbar>
Tun: <die eine Handlung>
Erwartet: <das beobachtbare Ergebnis>

Antwort: ok, Abweichung beschreiben oder überspringen.
```

- Ein Schritt ist eine Handlung mit einem beobachtbaren Ergebnis. Fasse zusammen, was der Nutzer in einem
  Zug prüfen kann, und teile nur, was nacheinander geschehen muss.
- Ein Schritt enthält keinen Hintergrund und keinen Rückblick auf den Lauf. Der Nutzer handelt ohne
  Tasklektüre sofort.
- Nach `ok` folgt ohne Zwischenbericht der nächste Schritt.
- Der Nutzer kann jederzeit überspringen oder etwas anderes mitteilen. Nach einem Überspringen bleibt der
  Task unverändert in `review`, und du gehst zur nächsten Aufgabe. Eine andere Mitteilung behandelst du
  zuerst; danach setzt du die Prüfung fort oder beendest sie, wenn die Mitteilung das verlangt.
- Halte eine Abweichung knapp mit erwartetem und beobachtetem Ergebnis fest. Frage nur nach, wenn sie sonst
  nicht nachvollziehbar wäre. Weitere Schritte desselben Tasks führst du nur, wenn sie trotz der Abweichung
  aussagekräftig bleiben.

## Antwort festhalten

- Schreibe Entscheidung oder Prüfergebnis an den vorhandenen fachlichen Ort im Task, nicht in ein separates
  Protokoll. Pflege Task und Übergabe als aktuellen Snapshot nach dem maßgeblichen Vertrag. Arbeite die
  daraus geltenden Anweisungen und überprüfbaren Abnahmen konkret ein; ein Quellenlink allein reicht nicht.
  Eine Abweichung wird dabei zur konkreten Korrektur mit eigener Abnahme.
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
Erst wenn jede Übergabe der anfänglichen Schlange geklärt oder vom Nutzer übersprungen ist, lies den
vollständigen Diff und erstelle nach der Git-Norm genau einen lokalen Sammelcommit pro betroffenem Repo. Der
ausdrückliche Skill-Aufruf ersetzt für diesen einen Commit die vorherige Einzelabnahme der Nachricht; zeige
Nachricht und ID danach. Bei offenem Rest oder vorzeitigem Ende committe nicht. Pushe nichts.
