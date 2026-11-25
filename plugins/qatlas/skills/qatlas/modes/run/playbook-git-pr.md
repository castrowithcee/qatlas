---
description: >
  Integration eines Tasks über Pull Requests, wenn Nutzer- oder Projektvorgaben es verlangen:
  Rollen von Lead und Integrator, Plattformschritte, Arbeitsbasis, CI, Landen, Merge Queue, Zuschnitt je
  Merge-Form und Abschluss.
---

# Integration über Pull Requests

Wende dieses Verfahren nur an, wenn `.qatlas-brain/CONTRIBUTING.md` oder Nutzer- oder Projektvorgaben eine
Integration über Pull Requests verlangen, zum Beispiel bei einem geschützten Kontroll-Branch. Erkenne das an
diesen Vorgaben, nicht durch Raten. Dieses Verfahren ändert keine Berechtigung: Pushe, öffne einen Pull
Request oder merge nur, wenn Nutzer- oder Projektvorgaben dazu berechtigen. Der Aufruf eines Modus berechtigt
zu keinem davon. Fehlen solche Vorgaben, beende den Task ohne Push mit einem integrationsreifen, lokal
gesicherten Task-Branch als Übergabe an `review` nach dem [Git-Workflow](playbook-git-workflow.md).

Ein Pull Request steht für die Review-Anfrage der Code-Plattform des Projekts, zum Beispiel einen Merge
Request auf GitLab. Als Lead: Pushe deinen Task-Branch, öffne den Pull Request und übergib ihn.

## Plattformschritte

Entnimm den Projektvorgaben die Plattform und die Mittel für Push, Öffnen eines Pull Requests, Warten auf CI,
Merge und Löschen des Remote-Branches. Für ein GitHub-Repo mit verfügbarem `gh` genügen die GitHub-Helfer
auch ohne eine solche Angabe. Prüfe vor dem ersten Push oder der ersten Landung, dass diese Mittel verfügbar
und für Push, Pull Request und Merge berechtigt sind, und stelle im Ziel-Repo fest, ob eine Merge Queue aktiv
ist und ob der Branch-Schutz vor dem Merge einen aktuellen Stand verlangt. Fehlt ein Mittel oder seine
Berechtigung, starte nicht und kläre es mit dem Nutzer, als Lead oder Integrator über den Supervisor. Halte
bei beiden Plattformschritten, gleich mit welchen Mitteln, diesen Vertrag ein:

- **Auf CI warten (Integrator):** Warte, bis jede Prüfung des Pull Requests beendet ist. Ohne jede Prüfung
  hat das Projekt keine CI. Dann ist der grüne vollständige lokale Test der Nachweis.
- **Landen:** Bestätige, dass der Head des Pull Requests der übergebene Stand, dessen konfliktfreier Nachzug
  auf die Basis oder dessen Nachzug mit einem Konflikt ist, den du als Integrator nach deiner Rolle selbst
  gelöst hast, warte auf CI und führe genau diesen Head in der Merge-Form zusammen, die der Lauf als `regel`
  festhält. Belege die Landung ohne eigenen Helfer der Plattform je Form: einen Merge-Commit mit `git
  merge-base --is-ancestor <head> origin/<control-branch>`, einen Squash-Merge mit `<tools> proof --merge
  <sha> --head <sha> --base <control-branch>`, einen Rebase-Merge ebenso mit dem letzten umgesetzten Commit
  als `--merge` und `--parent <Basis-Spitze vor dem Merge>`. Lösche erst dann den Remote-Branch. Hat die
  Plattform ihn beim Merge schon gelöscht, ist das kein Fehler. Lande ohne CI erst, wenn der gemergte Stand
  durch den grünen vollständigen lokalen Test bestätigt ist.

## Ablauf

- **Zuschnitt:** Bei Merge-Commit und Rebase-Merge gib dem Task einen Pull Request mit seinem
  Commit-Zuschnitt nach der Git-Norm. Nur bei Squash-Merge teile einen Task in so viele Pull Requests, wie
  die Commit-Grenze der Git-Norm ([Commit-Grenzen](../../../qatlas-core-git/references/commit-boundaries.md))
  für ein zusammengeführtes Review verlangt. Bündle dann nie unabhängige Meilensteine in einem Pull Request. Gib jedem Pull Request
  einen eigenen Task-Branch desselben Tasks mit eigenem Slug. Sorge dafür, dass ein vorbereitender Pull
  Request, zum Beispiel ein mechanisches Refactoring, vor der darauf aufbauenden Änderung integriert wird.
  Als Lead: Prüfe vor dem ersten Push den gesamten Diff des Pull Requests gegen die Commit-Grenze und teile
  ihn vorher.
- **CI:** Schreibe gepushte Historie nie um und rebase nie einen gepushten Branch. Als Lead: Übergib jeden
  Pull Request eines Tasks einzeln mit dem grünen vollständigen lokalen Test auf dem gepushten Head, ohne auf
  CI zu warten. Zieh nicht erneut nach, wenn nach dem Test ein Konflikt mit der Basis entsteht. Meldet der
  Integrator eine rote CI, behebe sie mit Folge-Commits, die nicht gegen den Zuschnitt zählen, und übergib
  erneut.
- **Landen:** Als Integrator: Öffne keinen Pull Request, sondern lande den des Leads. Verlangt der
  Branch-Schutz einen aktuellen Stand, ziehe die Basis konfliktfrei nach und warte erneut auf CI. Ist im
  Ziel-Repo eine Merge Queue aktiv, integriere über sie, statt selbst die Basis nachzuziehen.
- **Abschluss:** Das Landen des Pull Requests ersetzt die lokale Integration. Setze einen Task erst auf
  `done`, wenn alle seine Pull Requests gemergt sind und die Abnahme auf dem neuen `origin/<control-branch>`
  belegt ist.
- **Abhängige Arbeit:** Pushe einen vorgebauten Task erst, wenn du ihn nach der
  [Lead-Rolle](lead.md#übergeben) auf das integrierte `origin/<control-branch>` umgesetzt hast. Öffne nie
  einen Pull Request auf einem nicht integrierten Vorgänger-Branch.
