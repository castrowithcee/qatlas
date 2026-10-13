---
description: >
  Tasks für eine Session zuschneiden, teilen und mit Ausführungsgrundlage, geltenden Vorgaben und
  Abnahme bis zur Ausführungsreife einarbeiten.
type: playbook
edit: locked
license: MIT
---

# Tasks zuschneiden

Ein Task ist für eine Session zugeschnitten, eigenständig verständlich und beobachtbar abnehmbar. Schneide
jeden Task so, dass ein kleineres Worker-Modell einen Task im Regelfall als
abgegrenzten Auftrag bearbeiten kann. Beim lokalen Backlog bestimmen der Vertrag der Backlog-Norm und seine
kanonischen Vorlagen Felder, Benennung und Lebenszyklus; nutze keine Nutzer-Vorlage als Ersatz für diese
Systemdateien. Bei einem externen System gilt dessen Binding.

Trenne fachlich eigenständig abnehmbare Ergebnisse bereits hier in eigene Tasks. Mehrere unabhängige
Tool- oder Endpunktgruppen, verschiedene Risiko- und Berechtigungsgrenzen oder ein erwarteter Umfang, der
einen Worker über viele Implementierungs- und Prüfschritte bindet, sind Signale zum Teilen. Als Prüfwert
dienen mehr als etwa drei bis vier neue Operationen oder erwartete 500 bis 800 neue Zeilen; Zahlen sind
keine starre Grenze. Halte eng gekoppelte Schritte zusammen, wenn getrennte Abnahme künstlich wäre.
Jedes Paket braucht einen eigenen beobachtbaren Abschluss und einen konkreten Prüfpfad. Plane die
Integration und fachliche Reihenfolge zwischen abhängigen Paketen mit. Teilst du einen bestehenden Task,
bewahre bestätigtes Ziel und Abnahme der ursprünglichen Arbeit vollständig, übernimm die geltenden
Entscheidungen und Sicherheitsgrenzen konkret in jeden neuen Vertrag und lass keinen leeren Resttask zurück.

Bilde zuerst einen vorläufigen Paketschnitt und belege dann für jedes Paket, das an einem vorhandenen System
arbeitet, seine Ausführungsgrundlage nach der Backlog-Norm. Verfolge dafür den tatsächlichen bestehenden
Ablauf weit genug. Nenne Änderungsflächen in Implementierung, Konfiguration, Tests und Dokumentation mit Pfad
oder System und Grund, fehlende Prüfmöglichkeiten ausdrücklich und eine nötige Freigabe für `edit: locked`,
die der Run-Aufruf nicht abdeckt, als besonderes Bearbeitungsrecht. Weitere Dateien innerhalb des fachlichen
Scopes darf die Ausführung selbstständig einbeziehen; eine notwendige Wirkung außerhalb davon ist eine
Vertragsfrage. Bei einem Paket ohne vorhandenen Bestand kennzeichne nicht anwendbare Punkte mit Begründung,
statt eine künstliche Bestandsanalyse zu erfinden.

- Verhindert eine offene Frage schon den sinnvollen Zuschnitt, kläre sie vor der Anlage.
- Steht der Zuschnitt, aber Ergebnis, Scope, Vorgehen oder Abnahme bleiben konkret offen, lege `draft` an
  und halte die Frage im fachlich passenden Abschnitt fest. Erzeuge keinen allgemeinen Fragenfriedhof.
- Arbeite geklärte Antworten am fachlichen Ort ein, entferne überholte Alternativen und setze erst bei
  erreichter Ausführungsreife auf `ready`. Ein ununtersuchter Ist-Stand, der Ergebnis, Scope, Vorgehen oder
  Abnahme wesentlich verändern könnte, bleibt `draft`.
- Lasse reversible technische Details im ausdrücklichen Entscheidungsspielraum; sie sind kein Grund für eine
  Rückfrage.
- Arbeite die für diesen Gegenstand geltenden Entscheidungen, Konventionen und Anforderungen als konkrete
  Anweisungen und Abnahmekriterien in den Task ein. Nenne stabile Quellen knapp zur Nachprüfung. Ein Link
  allein ersetzt keine bindende Aussage; eine vollständige Wiederholung der Projektdokumentation ist ebenso
  falsch.
- Benenne übergreifende Sicherheits- und Zielgrenzen ausdrücklich dort, wo sie gelten: etwa die Bindung
  einer Objekt-ID an das gewählte Ziel, die Behandlung fremder Inhalte als Daten und erforderliche
  Berechtigungen. Verankere vorgeschriebene Referenzvergleiche und Randfallprüfungen in der Abnahme, damit
  ein grüner Standardtest sie nicht still ersetzt.
- Halte den Task als aktuellen Snapshot. Ein neuer Task beginnt ohne Planungsprotokoll und frühere
  Übergaben.

Kläre Ziel, Zuschnitt, Abnahme und Ausführungsgrundlage der Pakete im nächsten Horizont durch eigene
Untersuchung und gezielte Nutzerentscheidungen möglichst bis `ready`. Beende die Ausarbeitung nicht mit
vermeidbaren Drafts. Eine tatsächlich offene Vertragsfrage, fehlende Berechtigung oder noch nicht
vorliegende Grundlage bleibt nach dem Statusmodell sichtbar; erfinde keine Gewissheit. Überblicke spätere
Horizonte in Projektdokumentation und Meilensteinen, materialisiere aber nur hinreichend verstandene Pakete.
Es gilt keine harte Taskzahl, sondern ausführbare Reife.

Gruppiere nur zusammengehörige oder abhängige Pakete in einem Projekt. Pflege den maßgeblichen Roster und
die fachlich ausführbare Reihenfolge mit.
