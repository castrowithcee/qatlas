---
description: >
  Integration eines Run- oder Sentinel-Tasks über Pull Requests, wenn Nutzer- oder Projektvorgaben sie
  verlangen: Arbeitsbasis, Konfliktprobe, Merge Queue, Zuschnitt bei Squash-Merge und Abschluss.
type: playbook
edit: locked
license: MIT
---

# Integration über Pull Requests

Dieses Vorgehen greift nur, wenn Nutzer- oder Projektvorgaben eine Integration über Pull Requests verlangen,
etwa bei einem geschützten Steuerbranch; erkenne das an diesen Vorgaben, nicht durch Raten. Es ändert keine
Autorisierung: Der Aufruf eines Modus autorisiert weder Push noch Pull Request noch Merge, das tun nur Nutzer-
oder Projektvorgaben. Fehlt sie, endet der Task mit einem integrationsreifen, lokal gesicherten Task-Branch
als Übergabe nach „Übergeben“ des Git-Ablaufs, ohne Push.

- **Arbeitsbasis:** Arbeite im Task-Worktree ab frisch geholtem `origin/<steuerbranch>`. Der primäre
  Arbeitsbaum bleibt unberührt: kein Pull, Switch oder Commit dort durch den Lauf.
- **Vor dem Öffnen oder Aktualisieren eines Pull Requests:** Führe `git fetch` aus, probe Konflikte mit
  `node <plugin-root>/skills/qatlas/scripts/qatlas-run-tools.js probe`, merge den aktuellen
  `origin/<steuerbranch>` in den Task-Branch, löse Konflikte nach den Konfliktregeln des Git-Ablaufs, prüfe
  erneut und pushe erst dann. Rebase einen bereits gepushten Branch nie. Dieser Merge-Commit schreibt keine
  Historie um und ist keine fremde Veränderung. Warte auf die CI mit `ci-wait` desselben Skripts.
- **Merge Queue:** Ist im Ziel-Repo eine GitHub Merge Queue aktiv, integriere den Pull Request über sie,
  statt die Basis selbst nachzuziehen.
- **Zuschnitt bei Squash-Merge:** Ein Task ergibt so viele Pull Requests, wie die Commitgrenze der Git-Norm
  für ein gesquashtes Review verlangt; ein Pull Request bündelt nie unabhängige Meilensteine. Jeder
  Pull Request erhält einen eigenen Task-Branch desselben Tasks mit eigenem Slug. Ein vorbereitender
  Pull Request, etwa ein mechanisches Refactoring, wird vor der darauf aufbauenden Änderung integriert.
  Prüfe vor dem Öffnen den gesamten Diff des Pull Requests gegen die Commitgrenze und teile ihn, bevor du
  pushst.
- **Abschluss:** Der Merge des Pull Requests ersetzt die lokale Integration. Der Task ist erst `done`, wenn
  alle seine Pull Requests gemergt sind und die Abnahme auf dem neuen `origin/<steuerbranch>` belegt ist.
- **Abhängige Arbeit:** Ein Squash-Merge schließt gestapelte Branches aus. Ein abhängiger Task oder
  Pull Request startet dann erst ab dem integrierten `origin/<steuerbranch>`, nie auf einem nicht
  integrierten Vorgänger-Branch.
