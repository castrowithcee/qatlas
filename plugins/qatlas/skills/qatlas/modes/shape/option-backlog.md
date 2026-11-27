---
description: >
  Shape-Variante für einen bestehenden Task oder einen Backlog-Abschnitt: dessen Entwürfe einzeln reifen
  lassen und aus dessen offenen Epics weiterschneiden.
---

# Bestehende Arbeit zuschneiden

Bearbeite nur die bestehenden `draft`-Tasks des Scopes, jeweils an ihrem bestehenden Platz, und seine offenen
Epics. Lass Tasks in anderen Status unberührt. Einen `deferred`-Task nimmst du nach der Backlog-Norm nur auf, wenn der Aufruf ihn
ausdrücklich nennt.

## Bestand aufnehmen

1. Löse den Scope im maßgeblichen Planungssystem auf: einen Task, ein Projekt oder eine andere Teilmenge,
   die das Planungssystem eindeutig bestimmt. Frage nicht nach einem Scope, nur weil keiner angegeben wurde.
2. Bilde aus den Entwürfen in inhaltlich sinnvoller Reihenfolge die Gesprächs-Queue.
3. Lies einen Task erst vollständig, wenn er an der Reihe ist. Halte bei großem Bestand nur einen sinnvollen
   Ausschnitt und den aktuellen Task im Kontext. Die Größe des Bestands ist kein Grund, nach der Übersicht
   aufzuhören oder Entwürfe ungeprüft zu überspringen.

## Reifen lassen

Kläre die Entwürfe einzeln nach [Tasks zuschneiden](../../../qatlas-core-backlog/references/task-cutting.md).
Reihenfolge oder Abhängigkeit allein belegen keine
Unreife. Lässt sich eine Frage nur durch ein Arbeitsergebnis beantworten, das noch nicht existiert, bleibt
der Task `draft` mit der genauen fehlenden Information.

## Epics weiterschneiden

Schneide nach den Entwürfen aus jedem offenen Epic des Scopes, was inzwischen ausreichend verstanden ist,
über mehrere Bereiche zugleich. Kürze das Epic um den geschnittenen Teil und schließe ein leeres. Was noch
nicht schneidbar ist, bleibt mit dem, was dafür fehlt, im Epic.

## Abschluss

Beende erst, wenn jeder anfangs gewählte Entwurf `ready` ist, mit seiner konkreten, aktuell unbeantwortbaren
Frage `draft` bleibt oder nach der Backlog-Norm `deferred` ist und jedes offene Epic des Scopes geprüft ist.
Das Ergebnis des Abschlussblocks nennt, wie viele dieser Entwürfe nun `ready`, `draft` und `deferred` sind,
wie viele Tasks aus Epics entstanden und wie viele Epics offen bleiben.
Seine letzte Zeile nennt den ersten ausführbaren Scope.
