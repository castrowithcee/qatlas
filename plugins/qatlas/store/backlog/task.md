---
description: >
  <Worum geht es bei dieser Aufgabe? Ein Satz.>
type: task
edit: shared
status: draft         # draft | ready | next | in-progress | review | waiting | done
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Aufgabe: <Titel>

<!-- Kanonische Vorlage für den lokalen Qatlas-Backlog. Nach
.qatlas/project/backlog/task-<id>-<slug>.md oder in ein Projekt kopieren; <id> sind sechs kollisionsgeprüfte
Hex-Zeichen. Eine Aufgabe passt in eine Session, bleibt auch mit erlaubten Links eigenständig und bildet
immer nur ihren aktuellen, weiterhin gültigen Stand ab. Reihenfolge und Abhängigkeiten stehen zusätzlich im
jeweiligen Index. Erst wenn alle für die eigenständige Ausführung nötigen Punkte geklärt oder ausdrücklich
als nicht relevant markiert und bei Arbeit an vorhandenem Bestand durch eine ausreichende
Ausführungsgrundlage belegt sind, wechselt der Task von draft zu ready. `next` folgt erst aus einer bewussten
Disposition. Bei leerer Queue dürfen aus dem aktuellen Scope automatisch höchstens fünf Tasks von ready nach
next überführt werden; beide sind nie gleichzeitige Eigenschaften. Der Nutzer darf diese Queue ändern oder
erweitern. Der maßgebliche Backlog-Vertrag bestimmt Benennung, Lebenszyklus und Konsolidierung unabhängig
davon, wie die Aufgabe entsteht. -->

## Warum
<!-- Entscheidungsrelevanter Kontext, keine Wiederholung des Titels. -->

## Ergebnis
<!-- Welches beobachtbare Ergebnis soll nach dieser Aufgabe vorliegen? -->

## Scope-in
<!-- Welche Ergebnisse, Systeme, Pfade und Arbeiten gehören zu dieser Aufgabe? -->

## Scope-out
<!-- Welche benachbarten Ziele, Systeme, Pfade und Arbeiten bleiben ausdrücklich ausgeschlossen? -->

## Kontext und Leitplanken
<!-- Erforderlicher Projektkontext, geltende Architektur- und Qualitätsgrenzen sowie relevante Daten-,
Sicherheits- oder Kompatibilitätsanforderungen. Stabile Repo-Quellen exakt nennen und nur den für die
Ausführung nötigen Inhalt zusammenfassen, nicht umfangreich duplizieren. -->

## Ausführungsgrundlage
<!-- Belegter Ist-Stand für Arbeit an einem vorhandenen System. Bei einer Aufgabe ohne vorhandenen Bestand
den nicht anwendbaren Punkt mit Begründung kennzeichnen. Erwartete Änderungsflächen sind eine begründete
Arbeitskarte, keine starre Allowlist; Scope-in und Scope-out bleiben die Autorität. -->

- **Ausgangszustand:** <Wie verhält sich der relevante Bestand heute?>
- **Bestehende Einstiegspunkte:** <Welche Komponenten, Pfade oder Schnittstellen tragen das Verhalten?>
- **Erwartete Änderungsflächen:** <Welche Implementierung, Konfiguration, Tests und Dokumentation sind
  voraussichtlich betroffen, jeweils mit Pfad oder System und Grund?>
- **Prüfpfade:** <Welche vorhandenen Befehle, Tests, Zustände oder Artefakte prüfen das Ergebnis?>
- **Ausführungsvoraussetzungen:** <Welche Laufzeiten, Werkzeuge, Zugänge und besonderen Bearbeitungsrechte,
  insbesondere für `edit: locked`, werden benötigt? Was ist verfügbar oder im Taskvertrag beschaffbar, was
  fehlt? Keine Secrets festhalten.>
- **Dokumentationswirkung:** <Genau eine Form: `Ändern: <Quellen und erwartete Aussage>`,
  `Prüfen: <Quellen und zu bestätigende Aussage>`, `Keine: <Begründung>` oder
  `Ungeklärt: <fehlende Information>`. Mit `Ungeklärt` bleibt der Task draft.>

## Abhängigkeiten
<!-- Voraussetzungen, Reihenfolge und betroffene Integrationsgrenzen. `- Keine.` eintragen, wenn unabhängig. -->

## Entscheidungsspielraum
<!-- Was darf der ausführende Agent selbst entscheiden? Welche Entscheidung bleibt ausdrücklich beim Nutzer? -->

## Vorgehen
<!-- Aktuelles Vorgehen, Einschränkungen und begründet ausgeschlossene Wege. Überholte Ablaufvarianten und
verworfene Versuche entfernen, sobald ihre Begründung nicht mehr entscheidungsrelevant ist. -->

- [ ] <Step>

## Prüfung
<!-- Erwartete automatische Tests, Typecheck, Build, Browserprüfung und erforderliche manuelle Prüfung.
Nicht relevante Prüfarten ausdrücklich so kennzeichnen. Die hier vereinbarte Prüfung und der oben
belegte vorhandene Prüfpfad dürfen sich nicht widersprechen. -->

## Erledigt, wenn
<!-- Beobachtbare Akzeptanzkriterien einschließlich der vereinbarten Dokumentationswirkung als Checkliste. -->

## Abschlussbericht
<!-- Einziger statusabhängiger Übergabepunkt, kein zusätzlicher Review-Abschnitt und kein Verlauf. Inhalt bei
jedem Übergang ersetzen und konsolidieren, nie frühere Laufberichte anhängen. Bei status: review nur die
aktuelle Entscheidung, Prüfung oder Abnahme, den belegten Ist-Stand, die Empfehlung, die Folge und den
wiederaufnehmbaren Arbeitsstand nennen. Bei status: waiting Grund, Wiederaufnahmesignal, belegten Stand und
nächsten Schritt nennen. Nach einer Klärung die dauerhafte Entscheidung im passenden fachlichen Abschnitt
einarbeiten und die erledigte Übergabe entfernen; nur ein noch nötiger aktueller Stand oder `- Keine.`
bleibt. Bei status: done endgültig ersetzen: `- Keine.`, wenn keine wichtigen Nachträge
entstanden sind, sonst nur wichtige Entscheidungen, Auffälligkeiten, Risiken, Warnungen oder Abweichungen.
Dauerhafte Projektwahrheiten und durch die Umsetzung falsch gewordene zugehörige Dokumentation zusätzlich
am fachlich maßgeblichen Ort aktualisieren und diesen hier nennen.
Keine Rohlogs, vollständigen Befehlsausgaben, verworfenen Versuche oder allgemeine Kommunikation. Auf jeden
vorhandenen Punkt im abschließenden Chat ausdrücklich hinweisen. -->
