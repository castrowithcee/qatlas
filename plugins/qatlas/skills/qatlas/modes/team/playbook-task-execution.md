---
description: >
  Einen Task eines Team-Pakets mit begrenzten Worker-Aufträgen umsetzen, die Worker überwachen und
  Nebenbefunde festhalten.
---

# Einen Task ausführen

Schreibe Anspruch, Statuswechsel und Entwürfe nach „Planungssystem“ im Git-Workflow. Lass keinen Worker
Planungssystem oder Branch-Verwaltung ändern, Commits anlegen oder eigene Subagents starten.

## Worker beauftragen

Gib jedem Worker genau einen begrenzten Auftrag mit Task-ID und Titel, Arbeitsort, erlaubten Zielen,
Scope-out, Abnahmekriterien, Prüfungen und Rückgabeformat. Setze die inhaltliche Lösung nicht selbst um,
erledige aber kleine Status-, Integrations- und Verifikationsschritte selbst. Ausnahme: Besteht das gesamte
Ergebnis eines Tasks aus einer kleinen, risikoarmen Änderung an wenigen Dateien, die du ohnehin vollständig
prüfen musst, setze sie selbst um.

Lass den Worker bei einem Umsetzungs-Task dauerhafte Projektdokumentation nicht selbst aktualisieren, sondern
als Dokumentationsbefund melden: bestehende Aussagen, die seine Änderung ungültig macht, sowie belegte neue
Pflichten oder Kopplungen für künftige Arbeit. Ist die Dokumentation selbst ausdrückliches Task-Ergebnis, darf
er sie bearbeiten. Übernimm die Nacharbeit nach „Dokumentationswirkung“ in „Abnehmen und integrieren“.

Beurteile vor jedem Start den tatsächlichen Auftrag und seinen Verifikationsaufwand: Welche Ergebnisse lassen
sich unabhängig abnehmen, welche Schritte hängen voneinander ab, welche Sicherheits- und Zielgrenzen gelten,
und welche Abnahmen kannst du nach der Rückgabe selbst belegen? Schneide kleiner zu bei mehreren unabhängigen
Tool- oder Endpunktgruppen, unterschiedlichen Risiko- und Berechtigungsgrenzen oder einem Scope, der einen
Worker über viele Umsetzungs- und Prüfschritte bindet.

Liegt die gesamte Abnahme bereits in einem tragfähigen Taskvertrag, teile ihn bei Bedarf in geordnete
Worker-Aufträge A, B und weitere mit je einem eigenen prüfbaren Meilenstein, ohne daraus neue Backlog-Tasks
anzulegen. Prüfe und sichere jeden Meilenstein vor dem nächsten Auftrag und lass spätere Aufträge auf dem
bestätigten Stand aufbauen. Gib einem unabhängigen Meilenstein oder einem vorbereitenden mechanischen
Refactoring nach der Commit-Grenze der Git-Norm mindestens einen eigenen Commit und bei Integration über Pull
Requests mit Squash-Merge einen eigenen Pull Request. Enthält der Task dagegen in sich geschlossene
Ergebnisse, deren Grenzen, Reihenfolge oder Abnahme der Vertrag noch nicht klärt, setze ihn nach der
Reifeprüfung auf `draft` und halte die offene Zuschnittsfrage am bestehenden Ort für ein späteres, vom Nutzer
gestartetes `shape` fest. Erfinde die fehlende Planung nicht im Lauf.

Wähle für jeden Auftrag ein Profil, zuerst `light`: ein enger Auftrag mit klarem Vorgehen und direkter
Prüfung. Nimm `standard` bei mehreren abhängigen Schritten oder technischen Abwägungen und `demanding` für eine
belegt schwierige Diagnose oder eine eng gekoppelte Umsetzung, die sich sinnvoll nicht weiter teilen lässt,
nie wegen des Umfangs allein. Du musst dafür nicht erst einen kleinen Worker scheitern lassen. Begründe
`standard` und `demanding` vor dem Start kurz; setze das Korrekturbudget bei einem Modellwechsel nicht zurück.

Leite den Auftrag aus dem aktuellen Taskvertrag und dem geprüften Stand des Repos ab. Er enthält in dieser
Reihenfolge:

- **Ziel:** beobachtbares Ergebnis des Tasks.
- **Arbeitsgrundlage:** Ausgangszustand, vorhandene Einstiegspunkte, erwartete Änderungsflächen, maßgebliche
  Quellen und benötigte Ausführungsvoraussetzungen. Kennzeichne erwartete Flächen als Arbeitskarte, nicht als
  starre Dateierlaubnis, und gib keine Geheimnisse weiter.
- **Scope:** erlaubte inhaltliche Ziele sowie ein ausdrückliches Scope-out.
- **Leitplanken:** verbindliche Grenzen für Architektur, Sicherheit, Kompatibilität und Dokumentation sowie
  der Entscheidungsspielraum, jeweils als konkrete Arbeitsanweisung statt als bloßer Quellenlink. Prüfe
  insbesondere die Bindung fremder Objekt-IDs an das gewählte Ziel und den Umgang mit nicht vertrauenswürdigen
  Inhalten, soweit der Task solche Grenzen berührt. Weise den Worker an: Lässt der Vertrag eine Ziel- oder
  Berechtigungsgrenze offen, wählt er die engere Lesart und nennt sie in seiner Rückgabe; er weitet Zugriff
  oder Wirkung nie aus eigener Auslegung aus. Vor einem Befehl, der löscht, überschreibt, Berechtigungen
  ändert oder außerhalb des Repos wirkt, verifiziert er das genaue Ziel und den Umfang und führt nichts aus,
  dessen Wirkung er nicht begrenzen kann. Einen Schutzmechanismus testet er nie so, dass echte Daten Schaden
  nehmen, wenn der Mechanismus versagt.
- **Budget:** Zahl der für diesen Task eingesetzten Worker und verbleibende Korrekturversuche.
- **Worker-Profil:** gewähltes Profil mit Modell, Effort oder dessen fehlender Unterstützung und, bei
  `standard` oder `demanding`, der Grund.
- **Stoppbedingung:** Alle dem Worker zugewiesenen Abnahmekriterien und vereinbarten Prüfungen sind erfüllt,
  bei einer größeren Umsetzung ist der vereinbarte Meilenstein erreicht, oder eine Grenze des Vertrags, der
  Berechtigung, des Risikos oder externer Wirkung ist erreicht.
- **Rückgabe:** geänderte Dateien, ausgeführte Prüfungen mit Ergebnis, Dokumentationsbefunde mit Ort und
  Nachweis oder ein begründetes `Keine`, Abweichungen von den erwarteten Änderungsflächen, ungelöste Risiken
  und Nebenbefunde mit Ort und Nachweis.

Setze für einen kleinen Task normalerweise einen Worker ein. Braucht derselbe Task berechtigt mehrere
getrennte Rollen oder Zielbereiche, setze mehrere ein. Lass schreibende Worker nacheinander arbeiten, nie
gleichzeitig; nur schreibgeschützte Analysen und Reviews dürfen parallel laufen, solange sie nachweislich
nichts verändern. Achte darauf, dass sich die Aufträge nachweislich ergänzen, keine konkurrierenden Lösungen
bauen und zusammen im Korrekturbudget dieses einen Tasks bleiben.

Führe lokale Nachweise über `<tools> slot -- <test command>` aus; `slot` begrenzt gleichzeitige Testläufe
repoweit und verwendet einen grünen Nachweis desselben Trees wieder. Entnimm Projektwerte für Gültigkeit,
unversionierte Eingaben, Slot-Anzahl und exklusive Ressourcen der Teststrategie des Projekts in „Abnehmen und
integrieren“, die Optionen dem Kopfkommentar des Skripts. Führe einen Befehl, den die Projektvorgaben einer
exklusiven Ressource zuweisen, über `slot --resource <name> -- <command>` aus. Führe vollständige Tests immer
über `slot` aus, im Vordergrund oder über die Hintergrundausführung des Hosts mit ihrer Abschlussmeldung, und
warte nie durch Abfragen von Prozessen oder Lock-Ordnern.

Erlaube dem Worker, eine nicht vorhergesagte Datei von sich aus einzubeziehen, wenn sie nachweislich im
inhaltlichen Scope liegt. Wäre eine Wirkung außerhalb des Scopes nötig oder widerspricht der aktuelle Zustand
einer verbindlichen inhaltlichen Quelle, lass ihn vor dieser Wirkung anhalten und dir den Befund zurückgeben.
Den Vertrag erweitert er nicht selbst.

Nenne im Bericht des Tasks für jeden Worker Profil, Modell und Effort. Meldet der Host die tatsächliche
Kombination nicht zurück, nenne die angeforderte und kennzeichne sie mit „angefordert“; halte nur bei einer
belegten Abweichung an.

## Worker überwachen

Beobachte Arbeitsstand und Rückgaben gegen Taskvertrag, tatsächlichen Diff und vereinbarte Nachweise. Greife
ein, wenn ein Worker den Scope verlässt, eine vorgeschriebene Prüfung oder einen Referenzvergleich auslässt,
ohne Fortschritt hängt oder eine ausgeschlossene Wirkung vorbereitet. Begrenze oder stoppe seinen Auftrag,
statt mit weiteren unspezifischen Prompts Tokens zu verbrennen.

## Nebenbefunde festhalten

Behebe nichts, was der Lauf außerhalb des aktiven Taskvertrags bemerkt, und lass es auch keinen Worker
beheben. Halte jeden der folgenden Befunde vor dem nächsten Task als Entwurf fest, auch wenn der Scope des
Laufs das Anlegen weiterer Arbeit nicht einschließt:

- einen belegten Defekt im bestehenden Verhalten,
- ein mögliches oder bestätigtes Sicherheitsrisiko,
- nachweislich falsche Dokumentation.

Nenne im Entwurf den Befund, den Ort, den Nachweis und den Task, bei dem er gefunden wurde; unterstützt das
Planungssystem Labels, gib ihm `run-fund`. Überlass Ausarbeitung, Zuschnitt und Reife `shape`. Deckt ein
bestehender Task den Befund bereits ab, lege nichts an und nenne diesen Task. Fasse dasselbe Muster an
mehreren Stellen in einem Entwurf zusammen. Halte Verbesserungsideen, Refactoring, Stilfragen und mögliche
Erweiterungen nicht fest; sie sind keine Nebenbefunde.

Lass ein unbehobenes Sicherheitsrisiko nie an einen öffentlich einsehbaren Ort gelangen, weder in
Planungssystem, Task, Bericht, Commit-Nachricht, Branch-Namen, Pull Request noch Kommentar. Beurteile dafür die
Sichtbarkeit des Orts, an dem der Eintrag tatsächlich liegt: Ein Issue in einem öffentlichen Repo ist
öffentlich, auch wenn das Board, das es verwaltet, privat ist, und ein lokales Backlog teilt die Sichtbarkeit
seines Repos und seiner Remotes. Halte es nur dann als Entwurf fest, wenn dieser Ort belegt nicht öffentlich
ist, etwa über die verifizierte Sichtbarkeit des Repos. Ist er öffentlich oder lässt sich seine Sichtbarkeit
nicht belegen, halte nichts fest und protokolliere es nur als `risiko`. Schreibe auch an einem nicht
öffentlichen Ort keine Geheimnisse in den Eintrag.
