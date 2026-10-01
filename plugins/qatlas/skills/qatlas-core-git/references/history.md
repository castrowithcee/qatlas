---
description: >
  Historie bereinigen, umschreiben und per --force-with-lease veröffentlichen: was als geteilt gilt, wann
  die Ausnahme greift und wie das Ergebnis geprüft wird.
license: MIT
type: rule
edit: locked
---

# Historie

- Geteilt ist ein gemeinsamer oder geschützter Branch sowie jeder Commit, auf dem andere aufbauen oder den
  sie integriert haben. Ein ausschließlich zur Sicherung gepushter exklusiver Branch ist nicht geteilt; ihn
  erneut zu pushen verlangt die `--force-with-lease`-Ausnahme unten.
- Verlangt der Nutzer ausdrücklich, geteilte Historie umzuschreiben, bleibe im genannten Scope.
- Prüfe nach einer Bereinigung, dass der Endstand inhaltlich dem geprüften Stand vor der Bereinigung
  entspricht, und prüfe jeden entstandenen Commit wie einen neuen.
- `--force-with-lease` ist eine gesonderte Ausnahme. Sie gilt nur für einen exklusiv besessenen,
  ungeschützten Branch, nur unmittelbar nach aktuellem `git fetch` und nur mit ausdrücklich erwartetem
  Remotestand, also `--force-with-lease=<branch>:<erwartete-id>`. Sie braucht einen ausdrücklichen Auftrag
  des Nutzers für genau diesen Push; keine Orchestrierungs-Autorisierung deckt sie ab. Nenne vorher Branch,
  erwartete und neue Commit-ID; Qatlas führt sie nie still aus.
- Ein Push, der umgeschriebene geteilte Historie veröffentlicht, liegt außerhalb dieser Ausnahme und bleibt
  beim Nutzer.
