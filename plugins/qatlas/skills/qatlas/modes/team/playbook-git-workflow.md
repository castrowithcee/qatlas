---
description: >
  Git-Workflow eines Team-Laufs: Zuständigkeit von Lead und Integrator, Worktrees und Kollisionsflächen,
  Planungssystem, Commits und Checkpoints, Integration, Übergabe und Tasks über mehrere Repos.
---

# Git-Workflow im Team

## Zuständigkeit

- **Kontroll-Branch:** der Branch, auf dem der Supervisor den Lauf beginnt und integrierte Ergebnisse landen.
  Während Leads oder Integrator laufen, schreibt ihn nur der Integrator; sein Arbeitsbaum, normalerweise der
  primäre, dient nur der Integration und den gemeinsamen Prüfungen. Behandle eine Änderung des Integrators dort
  nie als fremde Änderung.
- **Task-Branch:** die Arbeitslinie genau eines Tasks in einem eigenen Worktree nach dem Worktree-Vertrag;
  die Berechtigung des Laufs deckt ihr Anlegen ab. Er gehört dem Lead des Tasks, ab der Übergabe bis zur
  Antwort dem Integrator.
- Als Lead: Schreibe nur in Branches und Worktrees deiner eigenen Tasks. Ziehe, wechsle und committe im
  primären Arbeitsbaum nichts.
- Sorge dafür, dass ein Arbeitsbaum nie zwei gleichzeitige Schreiber hat und ein Branch nie in zwei Worktrees
  ausgecheckt ist. Auch ein Test-, Build- oder Formatierungslauf, der Dateien, Caches oder Ausgaben erzeugt,
  ist Schreiben.
- Worker legen keine Branches oder Worktrees an, wechseln sie nicht, ändern weder Repo-Konfiguration noch
  Hooks und stagen oder committen nichts.

## Kollisionsflächen

Ein Worktree trennt nur Arbeitsdateien, Index und `HEAD`. Refs, Objekte, Stash, Hooks und Repo-Konfiguration
teilen sich alle Worktrees eines Repos; Ports, Datenbanken, Build-Ausgaben, Caches und ignorierte Dateien sind
weitere Kollisionsflächen. Nutzt du als Lead eine solche Fläche parallel zu anderen, verwende eine eigene
Instanz oder serialisiere ihre Nutzung über `slot --resource`. Braucht ein Werkzeug echte Repo- oder
Sicherheitsisolation, nenne einen separaten Clone oder eine Sandbox als Voraussetzung. Lassen sich fremde
Änderungen nicht sicher trennen, gib den Task mit dem Befund an `review`.

## Planungssystem

- **Extern:** Als Lead: Beanspruche jeden Task unmittelbar vor der ersten schreibenden Ausführung, setze
  `review`, `waiting` oder `draft` selbst und lege Entwürfe selbst an. Ist ein Task inzwischen fremd
  beansprucht oder sein Anspruch unklar, ändere nichts daran und frage den Supervisor. `done` setzt nur der
  Integrator, nach Integration und Nachweis auf dem Kontroll-Branch.
- **Lokales Backlog im Repo:** Während Leads oder Integrator laufen, schreibt es nur der Integrator, auf dem
  Kontroll-Branch. Das Paket im Steuerskript ist der Anspruch des Leads. Als Lead oder Supervisor: Was du
  sonst ins Backlog schreiben würdest, protokolliere mit `log` (`status` für Statuswechsel samt Inhalt,
  `erfasst` für Entwürfe), mit Task-Branch, Worktree-Pfad und Stand. Der Supervisor trägt es nach dem Ende
  des Integrators ein.

## Commits und Checkpoints

- Gib einem Task so viele Commits, wie die Commit-Grenze verlangt.
- Als Lead: Committe im Worktree eines Tasks nur, solange dort kein Worker arbeitet, also nach dessen Rückgabe
  oder Stopp. Lass eine größere Umsetzung an zusammenhängenden Meilensteinen zurückgeben und sichere jeden
  geprüften Meilenstein als Commit, bevor die Arbeit weitergeht.
- Als Lead: Sichere vor `review`, `waiting` oder deinem Ende jeden nicht integrierten Stand als markierten
  Checkpoint auf dem Task-Branch und halte Task-Branch, Worktree-Pfad und Stand (integrationsreif oder
  Checkpoint) nach „Planungssystem“ fest. Ein Checkpoint ist nicht integrationsreif.
- Lege auch einen Checkpoint nach dem Commit-Verfahren der Git-Norm an, einschließlich ihrer Schutzprüfung.
  Wende vor jeder Übergabe an den Integrator auf jeden Checkpoint die Bereinigung der Git-Norm an. Stashe nie
  automatisch.

## Integrieren

- Als Integrator: Prüfe den vollständigen Commit- und Diff-Bereich jeder Übergabe gegen das Integrationsziel,
  ordne jede Änderung dem Auftrag zu und integriere keine nicht zuordenbare Arbeit. Integriere Task-Branches
  einzeln und prüfe vor jeder Integration erneut, ob die Spitze des Kontroll-Branches deinem zuletzt
  geprüften Stand entspricht. Hat jemand anderes sie verändert, stoppe die Integration und frage den
  Supervisor.
- Schreibe geteilte Historie nie um.
- Behalte Task-Branch und Worktree, bis die Integration bestätigt ist oder der Nutzer sie bewusst aufgibt.
  Entferne nach dem Worktree-Vertrag nur Worktrees und Branches, die dieser Lauf angelegt hat und die sauber
  und vollständig integriert sind.

## Tasks über mehrere Repos

Integriere zuerst das Repo mit der Pull-Request-Pflicht, dann den Anteil desselben Tasks im anderen Repo per
Fast-Forward, sonst per Merge-Commit; rebase keine fremden Branches. Ungepushte Commits erscheinen gebündelt
unter „Nicht gepusht“ im Abschlussblock.
