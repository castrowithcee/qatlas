---
description: >
  Vertrag für zentrale Git-Worktrees: Branchnamen, Pfad, Kollisionen, Anlage, Eigentum und sicheres
  Aufräumen, gemeinsam für Qatlas Work Tree und Qatlas Run.
type: rule
edit: locked
license: MIT
---

# Worktree-Vertrag

Git registriert alle Worktrees eines Repos gemeinsam; dieses Register ist die maßgebliche Quelle. Der Ordner
unter `~/.qatlas/state/worktrees/` ist nur der gemeinsame Ablageort für alle Agenten desselben Nutzers.

## Anlegen

1. Ermittle Git-Root, primären Arbeitsbaum, Branches, Worktrees und vollständigen Status. Committe und stashe
   nichts. Lokale Änderungen bleiben in ihrem Arbeitsbaum und gelangen nicht in den neuen.
2. Folgt das Repo nachweislich einer eigenen Branch-Konvention aus Projektvorgaben oder durchgängig benannten
   Branches, gilt sie. Sonst heißt ein Task-Branch `task/<id>-<slug>`; `<id>` ist die Kennung aus dem Spine
   als ASCII-Slug, `<slug>` stammt aus dem Task-Dateinamen oder Titel. Arbeit ohne Task erhält einen
   eindeutigen `work/<zweck>`-Branch. Ein Unterbranch hängt an den Namen seines Task-Branches `--<rolle>` an,
   etwa `task/0042-export--tests`. Besteht bereits ein Branch `task` oder `work`, ersetzt `-` den Schrägstrich
   hinter diesem Präfix. Was der Agent selbst benennt, nennt nie Qatlas, einen Agenten, Host oder ein Modell,
   weil Branchnamen in die Historie des Repos gelangen können.
3. Ermittle den Pfad mit `node <plugin-root>/scripts/qatlas-worktree-path.js <branch> --target <repo-root>`;
   `<plugin-root>` ist der im Sessionkontext genannte `QATLAS PLUGIN ROOT`. Bereits registrierte Worktrees
   an einem anderen Pfad bleiben dort.
4. Prüfe Namens-, Branch- und Pfadkollisionen gegen das Git-Register und das Dateisystem. Überschreibe nichts.
   Gehört eine Kollision nicht eindeutig derselben Arbeit, bilde einen unterscheidbaren Zweck oder stoppe.
   Verwende einen vorhandenen Branch oder Worktree nur weiter, wenn er nachweislich derselben offenen Arbeit
   gehört.
5. Ein vorhandener lokaler Branch startet an seiner eigenen Spitze und wird nie zurückgesetzt. Bei einem
   eindeutig gleichnamigen Remote-Branch darf ein lokaler Tracking-Branch entstehen. Für einen neuen Branch
   gilt der aus Auftrag oder Spine folgende Startpunkt, sonst das aktuelle `HEAD`.
6. Lege den Worktree ausschließlich mit `git worktree add` an, ohne `-B` und `--force`, und prüfe den
   Eintrag danach über `git worktree list --porcelain`.

Ein Worktree enthält nur versionierte Dateien. Ignorierte Dateien, eingebettete Repos und lokaler Zustand
wie `.env` fehlen dort und werden nicht hineinkopiert. Prüfungen, die solche Inhalte brauchen, laufen im
primären Arbeitsbaum, solange dort kein anderer Schreiber arbeitet.

## Eigentum

Der Namensraum eines Tasks umfasst seinen Task-Branch, dessen Unterbranches und die daraus abgeleiteten
Worktrees. Er gehört dem Orchestrator, der den Task beansprucht hat; nur dieser legt darin Branches und
Worktrees an, integriert und entfernt sie. Ein Name belegt keine Eigentümerschaft; maßgeblich bleiben
Beanspruchung und Git-Register. Worktrees gehören einer Arbeit, nie einer Agentenidentität. Übergibt ein
Orchestrator einen Task an einen anderen Integrationsbesitzer, geht der Namensraum mit über: Nur dieser
integriert und räumt danach auf; der Übergebende fasst die übergebenen Branches und Worktrees nicht mehr an.

## Aufräumen

1. Lies das Register erneut und löse das Ziel eindeutig auf. Entferne niemals den primären oder den
   aktuellen Arbeitsbaum.
2. Prüfe im Ziel Status, ungetrackte Dateien, Branch, Upstream und nicht integrierte Commits. Das
   Integrationsziel eines Unterbranches ist sein Task-Branch, das eines Task-Branches der Steuerbranch.
   Prüfe mit `git merge-base --is-ancestor <branch> <ziel>`, ob die Branch-Spitze darin enthalten ist. Nach
   einem Squash-Merge schlägt diese Prüfung immer fehl; als Integration gilt dann der Squash-Nachweis: Der
   Pull Request des Branches ist gemergt, sein Merge-Commit liegt auf dem Steuerbranch, und
   `git rev-parse <merge-commit>^{tree}` gleicht `git rev-parse <branch>^{tree}` der zuletzt geprüften,
   unveränderten Branch-Spitze. Ist der Arbeitsbaum nicht sauber, das Ziel nicht eindeutig belegt oder
   keiner der beiden Nachweise erbracht, entferne nichts und zeige den konkreten Zustand. Beanspruchte
   Arbeit eines laufenden oder unbekannten Workers bleibt bestehen.
3. Entferne einen sauberen, vollständig integrierten Arbeitsbaum mit `git worktree remove <pfad>` ohne
   `--force`. Entferne danach mit `rmdir` die dadurch leer gewordenen Zwischenordner einschließlich des
   Repo-Ordners; `~/.qatlas/state/worktrees/` selbst bleibt.
4. Lösche den lokalen Branch nach der Zielprüfung nur mit `git branch -d`. Schlägt der Befehl fehl, erzwinge
   die Löschung nicht; einzige Ausnahme ist ein Branch mit erbrachtem Squash-Nachweis, den `git branch -D`
   entfernen darf. Remote-Branches werden nur auf ausdrücklichen Wunsch gelöscht; nenne verbliebene
   gesammelt im Abschluss.

Einen schmutzigen oder nicht integrierten Strang zu verwerfen, ist eine eigene destruktive Aktion: Zeige den
exakten Zustand und hole eine ausdrückliche Bestätigung für genau diesen Worktree ein. Lösche einen
Worktree-Ordner nie von Hand.
