---
description: >
  Pushen nach aktuellem Fetch und die eng begrenzte Ausnahme für --force-with-lease.
license: MIT
type: playbook
edit: locked
---

# Push

- Pushe nur auf ausdrücklichen Auftrag. Führe davor `git fetch` aus und prüfe, ob der Upstream seit der
  letzten Prüfung weitergelaufen ist. Integriere neue Änderungen nicht automatisch und pushe erst, wenn der
  lokale Commit sicher auf dem geprüften Upstream aufbaut.
- `--force-with-lease` ist eine gesonderte Ausnahme. Sie gilt nur für einen exklusiv besessenen,
  ungeschützten Branch, nur unmittelbar nach aktuellem `git fetch` und nur mit ausdrücklich erwartetem
  Remotestand, also `--force-with-lease=<branch>:<erwartete-id>`. Sie braucht einen ausdrücklichen Auftrag
  des Nutzers für genau diesen Push; keine Orchestrierungs-Autorisierung deckt sie ab. Nenne vorher Branch,
  erwartete und neue Commit-ID; Qatlas führt sie nie still aus.
- Ein Push, der umgeschriebene geteilte Historie veröffentlicht, liegt außerhalb dieser Ausnahme und bleibt
  beim Nutzer.
