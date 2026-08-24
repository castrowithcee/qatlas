---
description: >
  Prüffragen für ein dauerhaftes persönliches UI-Profil und projektspezifische Abweichungen einschließlich
  Komponenten, Zuständen, Responsive Design und Accessibility.
license: MIT
type: playbook
edit: locked
---

# UI-Profil prüfen

## Zwei Ebenen

1. **Dauerhaftes Profil:** wiederkehrende Tendenzen des Nutzers über Projekte hinweg.
2. **Projektprofil:** Marke, Zielgruppe und begründete Abweichungen dieser Anwendung.

Fehlt eine Projektabweichung, gilt ein vorhandenes dauerhaftes Profil. Erfinde keine neue visuelle Sprache
pro Seite oder Feature.

## Visuelle Grundlagen

- gewünschte Wirkung und ausdrücklich unerwünschte Stile
- helle, dunkle oder systemabhängige Darstellung
- Farbrollen einschließlich Text, Fläche, Rahmen, Akzent, Erfolg, Warnung und Gefahr
- Typografie, Größenhierarchie und Zeilenlängen
- Abstände, Dichte, Raster und maximale Inhaltsbreite
- Radien, Schatten, Rahmen, Icons und Bildsprache
- Bewegung, Dauer, Easing und Verhalten bei reduzierter Bewegung
- Breakpoints und Prioritäten auf kleinen Bildschirmen

Führe konkrete Werte als Design-Tokens. Komponenten verwenden semantische Tokens statt willkürlicher
Einzelwerte.

## Gemeinsamer Komponentenvertrag

Prüfe für jede interaktive Komponente mindestens:

- Default
- Hover
- sichtbaren Keyboard-Focus
- Active oder Selected
- Disabled
- Loading
- Error

Ergänze je nach Komponente Read-only, Empty, Success, Checked und Indeterminate. Größe, Kontrast,
Typografie, Radius, Schatten, Iconstil und Bewegung gelten auch für aufgeklappte oder schwebende Teile.

## Formulare

- sichtbare Labels; Pflichtfelder mit einem Sternchen in der semantischen Warnfarbe kennzeichnen; besteht ein
  Formular überwiegend aus Pflichtfeldern, stattdessen die optionalen Felder sichtbar als optional
  kennzeichnen; die Bedeutung nie ausschließlich über Farbe vermitteln
- geeignetes natives Eingabeelement, Name, Typ und Autocomplete
- client- und serverseitige Validierung mit verständlicher Fehlermeldung
- Fehlerzusammenfassung bei langen Formularen
- Erhalt sinnvoller Eingaben nach einem Fehler
- klare Pending-, Success- und Retry-Rückmeldung
- keine rein farbliche Bedeutungsübermittlung

## Auswahl und Schalter

- Label und klickbare Fläche eindeutig zuordnen.
- Checked, Unchecked, Indeterminate, Focus, Disabled und Error darstellen.
- Checkboxen für unabhängige Auswahl, Radios für genau eine Option und Switches nur für unmittelbar
  wirksame Ein/Aus-Zustände verwenden.
- Tastaturbedienung, Screenreader-Name und Touch-Ziel prüfen.

## Selects, Comboboxes und Dropdowns

- Native Selects bevorzugen, wenn Suche, Mehrfachauswahl oder besondere Darstellung nicht nötig sind.
- Auslöser und aufgeklappte Liste als ein zusammengehöriges Profil gestalten.
- Öffnen, Schließen, Escape, Tab, Pfeiltasten, Enter beziehungsweise Space und Typahead festlegen.
- Aktive, ausgewählte, deaktivierte und leere Optionen unterscheiden.
- Fokus beim Öffnen sinnvoll setzen und beim Schließen zum Auslöser zurückführen.
- Klick außerhalb, Scrollen, Touch, lange Listen, Viewport-Kollision und mobile Darstellung prüfen.
- Suche, Mehrfachauswahl, neue Werte und asynchrones Laden nur bei Produktbedarf ergänzen.

## Dialoge, Popover, Tooltips und Navigation

- Dialoge beschriften, Fokus innerhalb halten, Hintergrundinteraktion sperren und Fokus zurückgeben.
- Destruktive Aktionen deutlich benennen und nur bei echter Gefahr zusätzlich bestätigen.
- Popover und Tooltips per Tastatur erreichbar, schließbar, hoverbar und ausreichend persistent machen.
- Aktiven Navigationszustand, Breadcrumbs und Zurück-Verhalten konsistent halten.

## Seiten- und Datenzustände

Prüfe für jede wesentliche Oberfläche:

- initiales und erneutes Laden
- beim Betreten einer Seite und bei datenabhängigen Seitenwechseln bis zum Eintreffen der Inhalte ein
  layoutgetreues Skeleton UI zeigen; nicht interaktive Platzhalter bilden Position und ungefähre Abmessungen
  der erwarteten Textblöcke, Karten, Medien und Bedienelemente ab, damit die Seitenstruktur erkennbar bleibt,
  Aktivität sichtbar ist und Layout-Verschiebungen vermieden werden; die Platzhalter dürfen dezent pulsieren
  oder einen Shimmer-Effekt verwenden, bleiben bei reduzierter Bewegung jedoch statisch; bei Fehlern oder
  ungewöhnlich langen Ladezeiten durch eine verständliche Status- und Wiederholungsmöglichkeit ablösen
- leere Datenlage mit nächster sinnvoller Handlung
- Fehler mit verständlichem Wiederholungsweg
- fehlende Berechtigung und nicht gefundenen Inhalt
- langsame oder unterbrochene Verbindung, sofern relevant
- optimistische Änderung und Rücknahme bei Fehler, sofern eingesetzt

## Abnahmeprofil

- kleine und große Viewports
- Maus, Touch und reine Tastatur
- sichtbare Fokusreihenfolge
- semantische Namen und Labels
- Kontrast und Zoom
- reduzierte Bewegung
- alle aufgeklappten und überlagernden Komponenten

Das Ergebnis benennt geltende Vorgaben und bewusst offene Designentscheidungen. Eine Komponentenbibliothek
ersetzt dieses Profil nicht, kann es aber technisch umsetzen.
