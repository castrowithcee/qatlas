---
description: >
  Umfangsgrenzen für Markdown-Dateien im Wissensraum und für Dokumentation außerhalb davon: Grenze je
  Datei mit Zählweise und Ausnahmen, Vorgehen bei einer Überschreitung und Meldung einer notwendig
  längeren Datei.
---

# Umfangsgrenzen

## Grenzen

- `PROJECT.md`: höchstens 1.000 Wörter.
- Jede andere Markdown-Datei im Wissensraum: höchstens 3.500 Wörter.

Zähle das Frontmatter mit. Ausgenommen sind die Zonen und `templates/`. Für Dokumentation, die du außerhalb
des Wissensraums anlegst, gilt die Grenze jeder anderen Datei, solange das Projekt keine eigene nennt.

## Bei einer Überschreitung

Gehe in dieser Reihenfolge vor:

1. **Prüfen:** Ist die Länge berechtigt, etwa durch eine einzelne Tabelle? Dann bleibt die Datei, und du
   meldest sie (siehe unten).
2. **Straffen:** Kürze Erzählung, Wiederholung und Beispiele ohne eigenen Wert. Teile nicht vorher, sonst
   entstehen aus einer aufgeblähten Datei mehrere aufgeblähte.
3. **Teilen:** Schneide nach Gegenstand, nicht nach Datum:
   - Bei einer reservierten Datei verlagere Details in den gleichnamigen Ordner in Kleinschreibung, etwa
     `conventions/`, und behalte die Datei als Einstieg, der dorthin verweist.
   - Jede andere Datei teile in mehrere Dateien desselben Ordners, je Gegenstand eine.

## Notwendig längere Datei

Bleibt eine Datei notwendig länger, nenne dem Nutzer Datei, Wortzahl und Grund im selben Zug, in einem Modus
mit Abschlussblock dort.
