---
description: >
  Zuschnitt von Tasks in jedem Planungssystem, mit und ohne Modus: Lösung wählen, eigenständig abnehmbare
  Ergebnisse trennen, Bereiche festlegen, in die Breite schneiden, bis zur Ausführungsreife klären und
  ungeschnittenen Umfang als Epic festhalten.
---

# Tasks zuschneiden

Schneide jeden Task so zu, dass er für sich verständlich und beobachtbar abnehmbar ist und ein kleineres
Worker-Modell ihn in der Regel als abgegrenzten Auftrag bewältigen kann.

Wähle die Lösung der Aufgabe vor dem Zuschnitt nach Ziel, Korrektheit und Folgekosten.
Die erwartete Größe spielt bei dieser Wahl keine Rolle. Größe ist ein Signal zum Teilen, nie ein Grund für eine schwächere Lösung.
Eine einfachere Lösung ist nur vorzuziehen, wenn sie das Ziel vollständig erreicht,
etwa weil der zusätzliche Umfang keiner belegten Anforderung dient oder eine spätere Änderung billig und umkehrbar bleibt.
Eine Lösung, die das Ziel nur teilweise erreicht, ist eine Scope-Reduktion und damit eine Entscheidung, die der Nutzer treffen muss.
Ein Umstand wie wenige betroffene Nutzer oder reine Testumgebungen kann nur Reihenfolge und
einen kurzlebigen Zwischenstand rechtfertigen, nie das Ziel selbst.

Trenne eigenständig abnehmbare Ergebnisse schon hier in eigene Tasks. Mehrere unabhängige
Tool- oder Endpunktgruppen, unterschiedliche Risiko- und Berechtigungsgrenzen oder ein erwarteter Umfang, der einen
Worker über viele Umsetzungs- und Prüfschritte bindet, sind Signale zum Teilen.
Mehr als etwa drei bis vier neue Operationen oder erwartete 500 bis 800 neue Zeilen dienen als Prüfwert. Die Zahlen sind keine starre
Grenze. Halte eng gekoppelte Schritte zusammen, wenn getrennte Abnahme künstlich wäre.
Jeder Task braucht eine eigene beobachtbare Fertigstellung und einen konkreten Prüfweg und hinterlässt einen konsistenten Zustand.
Prüfe jede Abhängigkeit gegen die Regel der Backlog-Norm und drücke eine bloße Reihenfolge nur über die Reihenfolge des Planungssystems aus.
Plane die Integration zwischen abhängigen Tasks.
Der Task, der das Ziel erreicht, gehört zum selben Zuschnitt. Lege ihn mit den anderen an, als `draft`,
wenn eine Frage offen bleibt, außer sein Umfang liegt noch ungeschnitten in einem Epic.
Wenn du einen bestehenden Task teilst, erhalte das bestätigte Ziel und die Abnahme der
ursprünglichen Arbeit vollständig, übernimm die geltenden Entscheidungen und Sicherheitsgrenzen konkret in
jeden neuen Vertrag und hinterlasse keinen leeren Resttask.

- Verhindert eine offene Frage schon einen sinnvollen Zuschnitt, kläre sie, bevor du den Task anlegst.
- Steht der Zuschnitt, aber Ergebnis, Scope, Vorgehen oder Abnahme bleiben konkret offen, lege einen `draft`
  an und halte die Frage im inhaltlich passenden Abschnitt fest. Lege keine allgemeine Sammlung offener Fragen an.
- Arbeite geklärte Antworten an ihrem inhaltlichen Platz ein, entferne überholte Alternativen und setze
  `ready` erst, wenn die Ausführungsreife erreicht ist.
- Lies jeden Ist-Wert der Ausführungsgrundlage, etwa Standardwerte, Grenzen, Namen oder Pfade, im aktuellen
  Code oder in der aktuellen Konfiguration ab. Übernimm ihn nicht aus Gedächtnis, Gespräch, Plan oder
  älteren Tasks.
- Übernimm die für den Gegenstand geltenden Vorgaben als konkrete Anweisungen und prüfbare Abnahme.
  Eine vollständige Wiederholung der Projektdokumentation ist ebenso falsch wie ein bloßer Link.
- Trägt ein Analyseergebnis mehrere Tasks, teile es im selben Zuschnitt nach Gegenstand, mit einem Abschnitt je
  Task, und übernimm in jeden Task seinen Ausschnitt nach „Umfang und Verweise“ der Backlog-Norm.
- Benenne übergreifende Sicherheits- und Zielgrenzen ausdrücklich, wo sie gelten,
  etwa die Bindung einer Objekt-ID an das gewählte Ziel, den Umgang mit fremdem Inhalt als Daten und nötige Berechtigungen.
  Verankere vorgeschriebene Referenzvergleiche und Randfallprüfungen in der Abnahme, damit ein grüner
  Standardtest sie nicht stillschweigend ersetzt.
- Beginne einen neuen Task ohne Planungsprotokoll und ohne frühere Übergaben.

## Bereiche und Breite

Trägt ein Vorhaben mehr als einen Bereich, schneide so, dass mehrere Agents oder Menschen parallel arbeiten
können, ohne dieselben Stellen zu ändern. Ein Vorhaben mit einem Bereich überspringt diesen Abschnitt.

- Halte die Bereiche mit ihren Grenzen und Schnittstellen in der `.qatlas-brain/ARCHITECTURE.md` des Projekts
  fest, bevor du Tasks anlegst, die sich auf sie berufen. Nennt sie die Bereiche schon, übernimm sie. Fehlt
  die Datei, lege sie nach [Reservierte Datei
  füllen](../../qatlas-core-filing/references/playbook-reserved-files.md) an. In einem Projekt ohne Code sind
  Bereiche Themen oder Ordner.
- Nenne in jedem Task seinen Bereich.
- Schneide in die Breite: Tasks aus mehreren Bereichen zugleich und nicht nur den nächsten Schritt eines
  Bereichs.
- Lege eine Schnittstelle zwischen zwei Bereichen als Vertrag fest, wo nötig in einem eigenen frühen Task mit
  dem Grundgerüst. Steht der Vertrag, ist ein Task dahinter ausführungsreif, bevor der Nachbarbereich gebaut
  ist.

## Reife und Rest

Kläre Ziel, Zuschnitt, Abnahme und Ausführungsgrundlage der zugeschnittenen Tasks durch eigene Prüfung und
gezielte Nutzerentscheidungen, wo möglich bis `ready`. Beende den Zuschnitt nicht mit vermeidbaren Entwürfen.
Eine wirklich offene Vertragsfrage, eine fehlende Erlaubnis oder eine noch nicht verfügbare
Grundlage bleibt unter dem Statusmodell sichtbar. Erfinde keine Gewissheit. Konkretisiere nur ausreichend
verstandene Tasks. Bestätigter Umfang, den du nicht schneidest, steht danach je Bereich in einem Epic nach der
Backlog-Norm und nicht nur im Gespräch oder in einer Datei. Ein `draft` ist ein geschnittener Task mit einer
konkreten offenen Frage. Umfang, dessen Zuschnitt in Tasks noch nicht feststeht, gehört ins Epic.
Es gilt keine feste Taskzahl, nur ausführbare Reife.

Bündele nur zusammengehörige oder abhängige Tasks, soweit das Planungssystem bündeln kann.
Pflege die inhaltlich ausführbare Reihenfolge mit.
