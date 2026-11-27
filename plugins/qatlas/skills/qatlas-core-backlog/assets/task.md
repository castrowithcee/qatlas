---
description: >
  Rumpf eines Tasks für jedes Planungssystem mit allen Abschnitten des Taskvertrags, vom Warum bis zum
  Abschlussbericht.
---

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
Ausführung nötigen Inhalt zusammenfassen, nicht umfangreich duplizieren. Hat das Projekt Bereiche, den Bereich
dieser Aufgabe als eigene Zeile `Bereich: <Name>` nennen. -->

## Ausführungsgrundlage
<!-- Belegter Ist-Stand für Arbeit an einem vorhandenen System. Bei einer Aufgabe ohne vorhandenen Bestand
den nicht anwendbaren Punkt mit Begründung kennzeichnen. -->

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
  `Ungeklärt: <fehlende Information>`.>

## Abhängigkeiten
<!-- Echte Voraussetzungen nach der Backlog-Norm, je mit dem benötigten Ergebnis, und betroffene
Integrationsgrenzen. `- Keine.` eintragen, wenn unabhängig. -->

## Entscheidungsspielraum
<!-- Was darf der ausführende Agent selbst entscheiden? Welche Entscheidung bleibt ausdrücklich beim Nutzer? -->

## Vorgehen
<!-- Aktuelles Vorgehen, Einschränkungen und begründet ausgeschlossene Wege. Überholte Ablaufvarianten und
verworfene Versuche entfernen, sobald ihre Begründung nicht mehr entscheidungsrelevant ist. -->

- [ ] <Schritt>

## Prüfung
<!-- Erwartete automatische Tests, Typecheck, Build, Browserprüfung und erforderliche manuelle Prüfung.
Nicht relevante Prüfarten ausdrücklich so kennzeichnen. Eine Prüfung durch den Nutzer, die vor der
Integration nötig ist, ausdrücklich so nennen. Die hier vereinbarte Prüfung und der oben belegte vorhandene
Prüfpfad dürfen sich nicht widersprechen. -->

## Erledigt, wenn
<!-- Beobachtbare Abnahmekriterien einschließlich der vereinbarten Dokumentationswirkung als Checkliste. -->

## Abschlussbericht

- Keine.
