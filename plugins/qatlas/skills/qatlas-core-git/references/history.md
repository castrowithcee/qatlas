---
description: >
  Historie bereinigen oder umschreiben: was als geteilt gilt, wann Checkpoints bereinigt werden dürfen und
  wie das Ergebnis geprüft wird.
license: MIT
type: playbook
edit: locked
---

# Historie

- Geteilt ist ein gemeinsamer oder geschützter Branch sowie jeder Commit, auf dem andere aufbauen oder den
  sie integriert haben. Ein ausschließlich zur Sicherung gepushter exklusiver Branch ist nicht geteilt; ihn
  erneut zu pushen verlangt die `--force-with-lease`-Ausnahme aus [Push](push.md).
- Verlangt der Nutzer ausdrücklich, geteilte Historie umzuschreiben, bleibe im genannten Scope.
- Prüfe nach einer Bereinigung, dass der Endstand inhaltlich dem geprüften Stand vor der Bereinigung
  entspricht, und prüfe jeden entstandenen Commit wie einen neuen.
