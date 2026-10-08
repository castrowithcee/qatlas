---
description: >
  Arbeitsablauf mit Qatlas von der Einrichtung über Goal, Shape, Run und Review bis zur Pflege.
type: meta
edit: locked
license: MIT
---

# Arbeitsablauf

1. **Einrichten:** `qatlas-core setup` legt Projektzustand, Projektanweisungen, Nutzerbibliothek und
   globale Einstellungen an, ohne Vorhandenes zu ersetzen. `qatlas-core doctor` prüft später den Stand.
2. **Plan klären:** `qatlas goal <Idee>` macht im Gespräch aus einer Idee einen Plan mit beantworteten
   Fragen, den `shape` in Tasks zerlegt. Dabei entsteht nichts Dauerhaftes.
3. **Ausarbeiten:** `qatlas shape <Idee oder Datei>` hält bestätigtes Wissen fest und schneidet kleine,
   ausführungsreife Tasks. `qatlas shape backlog` ordnet vorhandene Arbeit neu.
4. **Ausführen:** `qatlas run` arbeitet standardmäßig höchstens fünf Tasks nacheinander ab; `--limit` ändert
   die Zahl, `--fly` lässt den Lauf ohne erreichbaren Nutzer arbeiten. Ein Orchestrator vergibt
   Aufträge an Subagents, prüft deren Ergebnisse und committet lokal. Push, Publish, Deployment und
   irreversible Schritte autorisiert ein Run nie. `qatlas sentinel` verteilt unabhängige Tasks auf bis zu
   vier gleichzeitige Orchestratoren in nebeneinanderliegenden tmux-Panes.
5. **Abnehmen:** `qatlas review` führt Schritt für Schritt mit Ort und erwartetem Ergebnis durch konkrete
   Prüfungen und klärt einzeln Entscheidungen und Handlungen, die nur der Nutzer treffen kann.

Jeder Schritt braucht einen eigenen Aufruf; keiner startet den nächsten von selbst. `goal` ist optional,
ein direkter Einstieg mit `shape` ist gültig.

## Ohne Loop

Auch ohne diese Schleife arbeitet der Agent mit Qatlas: Er findet Wissen über die Navigation, legt Dateien
regelkonform ab, arbeitet im maßgeblichen Planungssystem und prüft Git vor Eingriffen. Zur Beratung startet
`qatlas-council` unabhängige Perspektiven, ohne etwas umzusetzen.

## Pflege

Rohmaterial legt der Nutzer in `.qatlas-project/zone-import/` ab und kündigt es an. Plugin-Updates können
projektbezogene Hinweise mitbringen, die der Sessionstart meldet und `qatlas-core doctor` anzeigt.
