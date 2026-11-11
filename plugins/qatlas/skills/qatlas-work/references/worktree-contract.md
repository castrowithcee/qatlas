---
description: >
  Vertrag für zentrale Git-Worktrees: Branch-Namen, Pfad, Kollisionen, Anlegen, Zuständigkeit und sicheres
  Aufräumen, gemeinsam genutzt von Qatlas Work Tree und Qatlas Run.
---

# Worktree-Vertrag

Git registriert alle Worktrees eines Repos gemeinsam; dieses Register ist die maßgebliche Quelle. Der Ordner
unter `~/.qatlas/state/worktrees/` ist nur der gemeinsame Speicherort für alle Agents desselben Nutzers.

## Anlegen

1. Stelle Git-Root, primären Arbeitsbaum, Branches, Worktrees und den vollständigen Status fest. Committe und
   stashe nichts. Lokale Änderungen bleiben in ihrem Arbeitsbaum und gelangen nicht in den neuen.
2. Folgt das Repo nachweislich einer eigenen Branch-Konvention aus Projektvorgaben oder durchgängig benannten
   Branches, gilt diese. Sonst heißt ein Task-Branch `task/<id>-<slug>`; `<id>` ist die Task-ID aus dem
   Planungssystem als ASCII-Slug, `<slug>` stammt aus dem Dateinamen oder Titel des Tasks. Arbeit ohne Task
   bekommt einen eindeutigen `work/<purpose>`-Branch. Ein Sub-Branch hängt `--<role>` an den Namen seines
   Task-Branches an, zum Beispiel `task/0042-export--tests`. Existiert bereits ein Branch `task` oder `work`,
   ersetzt `-` den Schrägstrich nach diesem Präfix. Was der Agent selbst benennt, nennt nie Qatlas, einen Agent, Host oder
   ein Modell, weil Branch-Namen in der Historie des Repos landen können.
3. Bestimme den Pfad mit `node <plugin-root>/scripts/qatlas-worktree-path.js <branch> --target <repo-root>`;
   `<plugin-root>` ist die im Sessionkontext genannte `QATLAS PLUGIN ROOT`. Bereits unter einem anderen Pfad
   registrierte Worktrees bleiben dort.
4. Prüfe Namens-, Branch- und Pfadkollisionen gegen das Git-Register und das Dateisystem. Überschreibe nichts.
   Gehört eine Kollision nicht eindeutig zur selben Arbeit, bilde einen unterscheidbaren Zweck oder halte an.
   Verwende einen vorhandenen Branch oder Worktree nur wieder, wenn er nachweislich zur selben offenen Arbeit
   gehört.
5. Ein vorhandener lokaler Branch beginnt an seiner eigenen Spitze und wird nie zurückgesetzt. Für einen
   eindeutigen Remote-Branch gleichen Namens darf ein lokaler Tracking-Branch angelegt werden. Für einen neuen
   Branch gilt der Startpunkt, der sich aus dem Auftrag oder dem Taskvertrag ergibt, sonst der aktuelle `HEAD`.
6. Lege den Worktree ausschließlich mit `git worktree add` an, ohne `-B` und `--force`, und prüfe den Eintrag
   danach über `git worktree list --porcelain`.

Ein Worktree enthält nur versionierte Dateien. Ignorierte Dateien, eingebettete Repos und lokaler Zustand wie
`.env` fehlen dort und werden nicht hineinkopiert. Prüfungen, die solche Inhalte brauchen, laufen im primären
Arbeitsbaum, solange dort kein anderer Schreiber arbeitet.

## Zuständigkeit

Der Namensraum eines Tasks umfasst seine Task-Branches, deren Sub-Branches und die daraus abgeleiteten
Worktrees. Er gehört dem Lead, der den Task beansprucht hat; nur dieser Lead legt darin Branches und Worktrees
an, integriert und entfernt sie. Ein Name begründet keine Zuständigkeit; maßgeblich bleiben der Anspruch und
das Git-Register. Worktrees gehören zu einem Arbeitsstück, nie zu einer Agent-Identität. Übergibt ein Lead
einen Task an einen anderen Integrationsverantwortlichen, geht der Namensraum mit: Nur Letzterer integriert
danach und räumt auf; der übergebende Lead rührt die übergebenen Branches und Worktrees nicht mehr an.

## Aufräumen

1. Lies das Register erneut und bestimme das Ziel eindeutig. Entferne nie den primären oder den aktuellen
   Arbeitsbaum.
2. Prüfe im Ziel Status, nicht verfolgte Dateien, Branch, Upstream und nicht integrierte Commits. Das
   Integrationsziel eines Sub-Branches ist sein Task-Branch, das eines Task-Branches der Kontroll-Branch.
   Prüfe mit `git merge-base --is-ancestor <branch> <target>`, ob die Branch-Spitze darin enthalten ist. Nach
   einem Squash-Merge schlägt diese Prüfung immer fehl; Integration bedeutet dann den Squash-Nachweis: Der
   Pull Request des Branches ist gemergt, sein Merge-Commit liegt auf dem Kontroll-Branch, und entweder hat
   `qatlas-run-tools.js land` ihn mit `proof` `tree` oder `patch-id` belegt, oder
   `git rev-parse <merge-commit>^{tree}` ist gleich `git rev-parse <branch>^{tree}` der zuletzt geprüften,
   unveränderten Branch-Spitze. Ist der Arbeitsbaum nicht sauber, das Ziel nicht eindeutig festgestellt oder
   keiner der beiden Nachweise erbracht, entferne nichts und zeige den konkreten Stand. Beanspruchte Arbeit
   eines laufenden oder unbekannten Workers bleibt.
3. Entferne einen sauberen, vollständig integrierten Arbeitsbaum mit `git worktree remove <path>` ohne
   `--force`. Entferne danach mit `rmdir` die leer gewordenen Zwischenordner einschließlich des Repo-Ordners;
   `~/.qatlas/state/worktrees/` selbst bleibt.
4. Lösche den lokalen Branch nach der Zielprüfung nur mit `git branch -d`. Schlägt der Befehl fehl, erzwinge
   das Löschen nicht; die einzige Ausnahme ist ein Branch mit erbrachtem Squash-Nachweis, den `git branch -D`
   entfernen darf. Remote-Branches werden nur auf ausdrücklichen Wunsch oder nach einer Regel des laufenden
   Verfahrens gelöscht; nenne verbleibende gesammelt im Abschluss.

Das Verwerfen eines unsauberen oder nicht integrierten Strangs ist eine eigene destruktive Handlung: Zeige den
genauen Stand und hole ausdrückliche Bestätigung für genau diesen Worktree ein. Lösche einen Worktree-Ordner
nie von Hand.
