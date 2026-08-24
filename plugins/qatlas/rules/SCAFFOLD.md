---
description: >
  Immer geladene Weiche zum Qatlas-Scaffold und seinem vollständigen Vertrag vor schreibender Arbeit
  unter __qatlas__/.
license: MIT
type: rule
edit: locked
---

# Scaffold

Diese Regel gilt, sobald im Projekt `__qatlas__/` existiert oder der Einstiegsskill es anlegt. Der Ordner
ist Qatlas' versionierte, projekttypneutrale Zustands- und Arbeitsschicht und kein gewöhnlicher
Projektinhalt. Der Agent pflegt sie; Projektindizes für Memory und Backlog werden beim Sessionstart separat
als Zustand injiziert.

Bevor du außerhalb von `__qatlas__/backlog/` eine Datei im Scaffold erstellst, inhaltlich änderst,
umbenennst, verschiebst oder löschst, lies vollständig `<plugin-root>/rules/references/scaffold.md`. Der
Vertrag bestimmt Funktionsdateien, Funktionsordner, Zonen, Versionierung und Schutz vorhandener
Nutzerdateien. Reines Lesen, Suchen und Chat brauchen ihn nicht. Für `backlog/` gilt stattdessen dessen
eigene Rule und vollständiger Vertrag.

Ist dieser Block unvollständig oder nur als Vorschau vorhanden, lies vor der Arbeit die im Block genannte
Quelldatei vollständig.
