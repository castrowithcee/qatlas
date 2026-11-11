---
description: >
  Arbeitsablauf mit Qatlas von Init über Goal, Shape und Run bis zur Pflege, mit Review als eigenem
  Einstieg.
---

# Arbeitsablauf

1. **Einrichten:** `qatlas-core init` legt Git-Repo, Projektzustand, Projektanweisungen und die Nutzer-Library
   an, ohne etwas Vorhandenes zu ersetzen. `qatlas-core doctor` prüft den Zustand jederzeit.
2. **Plan klären:** `qatlas goal <Idee>` macht aus einer Idee im Gespräch einen Plan mit beantworteten Fragen,
   den `shape` in Tasks zerlegt. Der Plan bleibt im Gespräch; eine Datei entsteht nur mit deiner Zustimmung.
3. **Shape:** `qatlas shape` hält bestätigtes Wissen aus dem geklärten Gesprächskontext fest und schneidet
   kleine, ausführungsreife Tasks zu; `qatlas shape <Datei>` tut das für eine Datei. `qatlas shape <Task>`
   schärft einen bestehenden Task, `qatlas shape backlog` ordnet bestehende Arbeit neu.
4. **Run:** `qatlas run` schneidet die ausführbaren Tasks in bis zu vier unabhängige Pakete, mit
   `--limit <n>` bis zu `n`, und lässt jedes parallel von einem eigenen Lead als Subagent abarbeiten. Leads
   verteilen Aufträge an Worker und prüfen deren Ergebnisse; ein Integrator nimmt jede Übergabe ab und
   committet lokal. Der Lauf arbeitet immer ohne erreichbaren Nutzer: Er entscheidet, nimmt an oder
   übergibt an `review`, nachdem integriert ist, was geprüft ist, und setzt einen unfertigen vorigen Lauf
   ohne Rückfrage fort. Push und Pull Requests nur, wenn Nutzer- oder Projektanweisungen sie verlangen und
   erlauben; nie Veröffentlichung, Deployment oder unumkehrbare Schritte.

Jeder Schritt braucht einen eigenen Aufruf; keiner startet von selbst den nächsten. `goal` ist optional, und
der direkte Einstieg mit `shape` ist gültig.

`qatlas review` ist ein eigener Einstieg neben diesem Ablauf: Es legt einzeln vor, was nur der Nutzer
entscheiden, prüfen oder tun kann, bei einer Prüfung Schritt für Schritt mit Ort und erwartetem Ergebnis,
hält die Antwort fest und setzt den Status. Es setzt nichts um und integriert nichts.

## Ohne die Schleife

Auch ohne diese Schleife arbeitet der Agent mit Qatlas: Er findet Wissen über die Navigation, legt Dokumente
nach den Regeln ab, arbeitet im maßgeblichen Planungssystem und prüft Git vor Eingriffen. Zur Beratung startet
`qatlas-council` unabhängige Perspektiven, ohne etwas umzusetzen.

## Pflege

Der Nutzer legt Rohmaterial in `.qatlas-project/zone-import/` ab und kündigt es an.
