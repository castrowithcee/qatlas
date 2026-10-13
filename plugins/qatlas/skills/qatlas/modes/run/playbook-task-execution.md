---
description: >
  Den aktiven Task eines Runs mit abgegrenzten Subagent-Aufträgen umsetzen, die Subagents überwachen und
  Nebenbefunde erfassen.
type: playbook
edit: locked
license: MIT
---

# Einen Task ausführen

Pro Lauf ist immer höchstens ein Task `in-progress`; die ausgewählten Tasks laufen nacheinander. Beanspruche
ihn unmittelbar vor der ersten schreibenden Ausführung im Spine. Kein Subagent verändert Spine oder
Branchverwaltung, erstellt Commits oder startet eigene Subagents.

## Subagents beauftragen

Der Orchestrator gibt jedem Subagent genau einen abgegrenzten Auftrag mit Task-ID und Titel, Arbeitsort,
erlaubten Zielen, Scope-out, Abnahmekriterien, Prüfungen und Rückgabeformat. Er implementiert die fachliche
Lösung nicht selbst. Kleine Status-, Integrations- und Verifikationsschritte bleiben bei ihm. Ausnahme: Ist
das gesamte Ergebnis eines Tasks eine kleine, risikoarme Änderung an wenigen Dateien, die er ohnehin
vollständig prüfen muss, setzt er sie selbst um; die Karte nennt dann `Subagents: keine`.

Bei einem Umsetzungstask zieht der Subagent dauerhafte Projektdokumentation nicht selbst nach. Er meldet
bestehende Aussagen, die seine Änderung entwertet, sowie belegte neue Pflichten oder Kopplungen für künftige
Arbeit mit Fundstelle und Beleg; ohne Befund begründet er `Keine`. Ist Dokumentation selbst ein ausdrückliches
Taskergebnis, darf er sie bearbeiten. Der Orchestrator verantwortet das Nachziehen nach der Integration.

Beurteile vor jedem Spawn den tatsächlichen Auftrag und seinen Prüfaufwand: Welche Ergebnisse sind
eigenständig abnehmbar, welche Schritte hängen voneinander ab, welche Sicherheits- und Zielgrenzen gelten,
und welche Abnahmen kann der Orchestrator nach der Rückgabe selbst belegen? Mehrere unabhängige Tool- oder
Endpunktgruppen, verschiedene Risiko- und Berechtigungsgrenzen oder ein Umfang, der einen Worker über
viele Implementierungs- und Prüfschritte bindet, verlangen einen kleineren Zuschnitt.

Liegt die gesamte Abnahme bereits in einem tragfähigen Taskvertrag, teile ihn bei Bedarf in geordnete
Worker-Aufträge A, B und weitere mit je eigenem überprüfbarem Meilenstein. Daraus entstehen keine neuen
Backlog-Tasks. Prüfe und sichere jeden Meilenstein vor dem nächsten Auftrag; spätere Aufträge übernehmen den
bestätigten Stand. Ein unabhängiger Meilenstein oder ein vorbereitendes mechanisches Refactoring ergibt
mindestens einen eigenen Commit nach der Commitgrenze der Git-Norm, bei Integration über Pull Requests mit
Squash-Merge einen eigenen Pull Request nach „Integration über Pull Requests“. Enthält der Task dagegen
eigenständige Ergebnisse, deren Grenzen, Reihenfolge oder Abnahme der Vertrag noch nicht klärt, setze ihn nach
der Reifeprüfung auf `draft` und übergib den Zuschnitt an `shape <eindeutiger Task>` zur Klärung am
bestehenden Ort. Erfinde die fehlende Planung nicht im Run.

Wähle für jeden abgegrenzten Auftrag zuerst `light`. Nutze `standard`, wenn dessen beschriebene technische
Abwägungen nötig sind, und `demanding` bei belegter schwieriger Diagnose oder eng gekoppelter Umsetzung,
die sich nicht sinnvoll weiter teilen lässt. Umfang allein begründet `demanding` nicht. Ein kleiner Worker
muss dafür nicht erst scheitern. Begründe `standard` und `demanding` vor dem Spawn kurz; ein Modellwechsel
setzt das Korrekturbudget nicht zurück.

Leite den Auftrag aus dem aktuellen Taskvertrag und dem bestätigten Preflight ab. Er enthält in dieser
Reihenfolge:

- **Ziel:** beobachtbares Ergebnis des Tasks.
- **Arbeitsgrundlage:** Ausgangszustand, bestehende Einstiegspunkte, erwartete Änderungsflächen,
  maßgebliche Quellen und benötigte Ausführungsvoraussetzungen. Kennzeichne erwartete Flächen als
  Arbeitskarte, nicht als starre Dateifreigabe, und gib keine Secrets weiter.
- **Scope:** erlaubte fachliche Ziele sowie ausdrücklicher Scope-out.
- **Leitplanken:** bindende Architektur-, Sicherheits-, Kompatibilitäts- und Dokumentationsgrenzen sowie
  der Entscheidungsspielraum, jeweils als konkrete Arbeitsanweisung statt als bloßer Quellenlink. Prüfe
  insbesondere die Bindung fremder Objekt-IDs an das gewählte Ziel und den Umgang mit nicht
  vertrauenswürdigen Inhalten, soweit der Task solche Grenzen berührt. Weise den Subagent an: Lässt der
  Vertrag eine Ziel- oder Berechtigungsgrenze offen, wählt er die engere Auslegung und nennt sie in seiner
  Rückgabe; Zugriff oder Wirkung erweitert er nie aus eigener Deutung.
- **Budget:** Zahl der für diesen Task eingesetzten Subagents und verbleibende Korrekturversuche.
- **Worker-Profil:** gewähltes Profil mit Modell, Effort oder dessen fehlender Unterstützung und bei
  `standard` oder `demanding` dem Grund.
- **Stopbedingung:** alle dem Subagent zugewiesenen Abnahmekriterien und vereinbarten Prüfungen sind
  erfüllt, bei einer größeren Umsetzung der vereinbarte Meilenstein erreicht, oder eine Vertrags-,
  Berechtigungs-, Risiko- oder Außenwirkungsgrenze ist erreicht.
- **Rückgabe:** geänderte Dateien, ausgeführte Prüfungen mit Ergebnis, Dokumentationsbefunde mit Fundstelle
  und Beleg oder begründetes `Keine`, Abweichungen von den erwarteten Änderungsflächen, ungelöste Risiken
  und Nebenbefunde mit Fundstelle und Beleg.

Einen kleinen Task setzt normalerweise ein Subagent um. Braucht derselbe Task legitim mehrere getrennte
Rollen oder Zielbereiche, darf der Orchestrator zwei oder mehr Subagents einsetzen. Ihre Aufträge müssen sich
nachweislich ergänzen, dürfen keine konkurrierenden Lösungen bauen und bleiben gemeinsam im Fehlerbudget
dieses einen Tasks. Gleichzeitig schreibende Subagents isoliert der Git-Ablauf. Volltests gleichzeitiger
Schreiber laufen über `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js slot -- <testbefehl>`,
das sie repo-weit begrenzt. Ein weiterer Task beginnt erst, wenn der aktive Task abgeschlossen oder gesichert
übergeben ist.

Der Subagent darf eine nicht vorhergesagte Datei selbstständig einbeziehen, wenn sie nachweislich innerhalb
des fachlichen Scopes liegt, und nennt die Abweichung in seiner Rückgabe. Wäre eine Wirkung außerhalb des
Scopes nötig oder widerspricht der aktuelle Bestand einer bindenden fachlichen Quelle, stoppt er vor dieser
Wirkung und gibt den Befund an den Orchestrator zurück. Er erweitert den Vertrag nicht selbst. Einen Fehler,
ein Sicherheitsrisiko oder nachweislich falsche Dokumentation außerhalb des Scopes behebt er nicht, sondern
meldet ihn als Nebenbefund.

Sende nach dem erfolgreichen Start genau eine knappe Karte:

> **Aufgabe:** #84 - Dateizugriff auf SQL umstellen
>
> **Subagents:** light: sonnet (low)

Verwende ID und Titel aus dem Spine. Nenne pro gestarteten Subagent das gewählte Profil und die
Modell-Effort-Kombination in kurzer Form. Meldet der Host die tatsächliche Kombination nicht zurück, nenne
die angeforderte und kennzeichne sie mit „angefordert“; stoppe nur bei einer belegten Abweichung. Fehlen die
benötigten Subagents, stoppe vor der Umsetzung und melde diese Voraussetzung. Der Orchestrator ersetzt sie
nicht als stiller Subagent.

## Subagents überwachen

Beobachte Arbeitsstand und Rückgaben gegen Taskvertrag, tatsächlichen Diff und vereinbarte Beweise. Greife
ein, wenn ein Subagent den Scope verlässt, einen vorgeschriebenen Prüf- oder Referenzvergleich auslässt,
ohne Fortschritt festhängt oder eine ausgeschlossene Wirkung vorbereitet. Begrenze oder stoppe seinen
Auftrag, statt durch weitere unspezifische Prompts Token zu verbrauchen.

## Nebenbefunde erfassen

Was der Lauf außerhalb des aktiven Taskvertrags bemerkt, behebt er nicht. Erfasse jeden der folgenden
Befunde vor dem nächsten Task als `draft` im Spine, auch wenn der Run-Scope das Anlegen weiterer Arbeit
nicht einschließt:

- ein belegter Fehler im bestehenden Verhalten,
- ein mögliches oder bestätigtes Sicherheitsrisiko,
- nachweislich falsche Dokumentation.

Der Draft nennt Befund, Fundstelle, Beleg und den Task, bei dem er gefunden wurde; unterstützt das
Planungssystem Labels, trägt er `run-fund`. Ausarbeitung, Zuschnitt und Reife bleiben bei `shape`. Deckt ein
bestehender Task den Befund bereits ab, lege nichts an und nenne diesen Task. Dasselbe Muster an mehreren
Stellen ergibt einen Draft. Verbesserungsideen, Refactoring, Stilfragen und mögliche Erweiterungen sind keine
Nebenbefunde und werden nicht erfasst.

Ein nicht behobenes Sicherheitsrisiko gelangt nie an einen öffentlich einsehbaren Ort, weder in Spine, Task,
Abschlussbericht, Commit-Nachricht, Branchnamen, Pull Request noch Kommentar. Maßgeblich ist die
Sichtbarkeit des Ortes, an dem der Eintrag tatsächlich liegt: Ein Issue in einem öffentlichen Repo ist
öffentlich, auch wenn das Board, das es führt, privat ist, und ein lokaler Backlog teilt die Sichtbarkeit
seines Repos und dessen Remotes. Erfasse es als Draft nur, wenn dieser Ort belegt nicht öffentlich ist, etwa
über die geprüfte Sichtbarkeit des Repos. Ist er öffentlich oder seine Sichtbarkeit nicht belegbar, erfasse
nichts und melde das Risiko ausschließlich im Abschluss unter **Sicherheit**. Auch an einem nicht
öffentlichen Ort enthält der Eintrag keine Secrets.
