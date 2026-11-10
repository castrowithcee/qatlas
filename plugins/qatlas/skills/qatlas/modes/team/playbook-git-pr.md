---
description: >
  Integration eines Team-Tasks über Pull Requests, wenn Nutzer- oder Projektvorgaben es verlangen:
  Rollen von Lead und Integrator, Plattformschritte, Arbeitsbasis, CI, Landen, Merge Queue, Zuschnitt für
  Squash-Merge und Abschluss.
---

# Integration über Pull Requests

Wende dieses Verfahren nur an, wenn `.qatlas-project/CONTRIBUTING.md` oder Nutzer- oder Projektvorgaben eine
Integration über Pull Requests verlangen, zum Beispiel bei einem geschützten Kontroll-Branch; erkenne das an
diesen Vorgaben, nicht durch Raten. Dieses Verfahren ändert keine Berechtigung: Pushe, öffne einen Pull
Request oder merge nur, wenn Nutzer- oder Projektvorgaben dazu berechtigen; der Aufruf eines Modus berechtigt
zu keinem davon. Fehlen solche Vorgaben, beende den Task ohne Push mit einem integrationsreifen, lokal
gesicherten Task-Branch als Übergabe an `review` nach dem [Git-Workflow](playbook-git-workflow.md).

Ein Pull Request steht für die Review-Anfrage der Code-Plattform des Projekts, zum Beispiel einen Merge
Request auf GitLab. Als Lead: Pushe deinen Task-Branch, öffne den Pull Request, warte auf CI und übergib ihn.

## Plattformschritte

Entnimm den Projektvorgaben die Plattform und die Mittel für Push, Öffnen eines Pull Requests, Warten auf CI,
Merge und Löschen des Remote-Branches; für ein GitHub-Repo mit verfügbarem `gh` genügen die GitHub-Helfer
auch ohne eine solche Angabe. Prüfe vor dem ersten Push oder der ersten Landung, dass diese Mittel verfügbar
und für Push, Pull Request und Merge berechtigt sind, und stelle im Ziel-Repo fest, ob eine Merge Queue aktiv
ist und ob der Branch-Schutz vor dem Merge einen aktuellen Stand verlangt. Fehlt ein Mittel oder seine
Berechtigung, starte nicht und kläre es mit dem Nutzer, als Lead oder Integrator über den Supervisor. Halte
bei beiden Plattformschritten, gleich mit welchen Mitteln, diesen Vertrag ein:

- **Auf CI warten:** Warte, bis jede Prüfung des Pull Requests beendet ist. Ohne jede Prüfung hat das Projekt
  keine CI; dann ist der grüne vollständige lokale Test der Nachweis.
- **Landen:** Bestätige, dass der Head des Pull Requests der übergebene Stand oder dessen konfliktfreier
  Nachzug auf die Basis ist, warte auf CI, führe genau diesen Head per Squash-Merge zusammen und belege, dass
  der Squash-Commit die geprüfte Änderung trägt, ohne eigenen Helfer der Plattform mit `<tools> proof --merge
  <sha> --head <sha> --base <control-branch>`. Lösche erst dann den Remote-Branch; hat die Plattform ihn beim
  Merge schon gelöscht, ist das kein Fehler. Lande ohne CI erst, wenn der gemergte Stand durch den grünen
  vollständigen lokalen Test bestätigt ist.

## Ablauf

- **Zuschnitt für Squash-Merge:** Teile einen Task in so viele Pull Requests, wie die Commit-Grenze der
  Git-Norm ([Commit-Grenzen](../../../qatlas-core-git/references/commit-boundaries.md)) für ein
  zusammengeführtes Review verlangt; bündle nie unabhängige Meilensteine in einem Pull Request. Gib jedem
  Pull Request einen eigenen Task-Branch desselben Tasks mit eigenem Slug. Sorge dafür, dass ein
  vorbereitender Pull Request, zum Beispiel ein mechanisches Refactoring, vor der darauf aufbauenden Änderung
  integriert wird. Als Lead: Prüfe vor dem ersten Push den gesamten Diff des Pull Requests gegen die
  Commit-Grenze und teile ihn vorher.
- **CI:** Schreibe gepushte Historie nie um und rebase nie einen gepushten Branch. Als Lead: Behebe eine rote
  CI selbst mit Folge-Commits; sie zählen nicht gegen den Zuschnitt. Übergib jeden Pull Request eines Tasks
  einzeln und nur mit grüner CI oder, ohne CI, mit dem grünen vollständigen lokalen Test.
- **Landen:** Als Integrator: Öffne keinen Pull Request, sondern lande den des Leads. Verlangt der
  Branch-Schutz einen aktuellen Stand, ziehe die Basis konfliktfrei nach und warte erneut auf CI. Ist im
  Ziel-Repo eine Merge Queue aktiv, integriere über sie, statt selbst die Basis nachzuziehen.
- **Abschluss:** Das Landen des Pull Requests ersetzt die lokale Integration. Setze einen Task erst auf
  `done`, wenn alle seine Pull Requests gemergt sind und die Abnahme auf dem neuen `origin/<control-branch>`
  belegt ist.
- **Abhängige Arbeit:** Beginne einen abhängigen Task oder Pull Request nur vom integrierten
  `origin/<control-branch>`, nie auf einem Vorgänger-Branch, der nicht integriert ist; ein Squash-Merge
  schließt gestapelte Branches aus.
