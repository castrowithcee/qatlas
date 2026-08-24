---
name: qatlas-core-git
description: >
  Git-Zustand über die automatische Sessionstart-Prüfung hinaus bewusst verwalten: Änderungen und Diffs
  untersuchen, synchronisieren, stagen, lokale Commits autorisieren, committen, pushen sowie
  Branches, Historie, Identität und Git LFS behandeln. Verwenden bei qatlas-core-git, ausdrücklichen Git-,
  Commit-, Push- oder Sync-Aufträgen und immer, wenn der Agent eine fertige Änderung committen will. Nicht
  für die automatische Git-Prüfung beim Sessionstart aufrufen.
argument-hint: "[status|sync|commit|push|branch|history|identity|lfs]"
license: MIT
type: skill
edit: locked
---

# qatlas-core-git

Verwalte Git als eigenen Arbeitszweck. Die automatische Prüfung beim Sessionstart lädt diesen Skill nicht.
Sobald Git selbst bearbeitet werden soll, gilt der passende Zweig unten.

## Scope-in

Der Aufruf umfasst nur das ausdrücklich verlangte Git-Ziel und die davon betroffenen Repos, Branches,
Worktrees und Remotes. Löse jedes Repo separat auf und erweitere einen Status-, Diff- oder Sync-Auftrag nicht
von selbst um Commit, Push, Historienänderung oder einen Eingriff in ein benachbartes Repo.

## Vordefinierte Orchestrierungs-Autorisierungen

Ein ausdrücklicher Aufruf von `qatlas run` autorisiert für genau diesen Lauf lokale Commits und
Integrationsschritte, ohne jede Commit-Nachricht vorher einzeln freigeben zu lassen. Die Ausnahme gilt nur
für den von Qatlas geprüften Steuerbranch sowie die von diesem Lauf eindeutig beanspruchten Task-Branches
und Worktrees. Der Orchestrator, nicht der Subagent, führt die Git-Schritte aus.

Auch dort muss der Orchestrator jeden vollständigen Diff lesen, fremde Änderungen ausschließen und die
vorhandene Nachrichtenkonvention einhalten. Er berichtet danach jede vollständige Nachricht und Commit-ID.
Die Ausnahme erlaubt keinen Push, Force-Push, automatischen Stash, kein Umschreiben geteilter Historie und
keine Integration auf einen seit dem Preflight fremd veränderten Steuerbranch. Ein Konflikt wird nicht
automatisch aufgelöst, sondern als eigener Integrationsauftrag delegiert. Nur von diesem Lauf erzeugte,
saubere und vollständig integrierte Worktrees und Branches dürfen ohne weitere Rückfrage entfernt werden.

Ein ausdrücklicher Aufruf von `qatlas review` autorisiert ausschließlich Backlog- und
Entscheidungsänderungen sowie genau einen Sammelcommit pro betroffenem Repo, nachdem die vollständige
Review-Schlange geklärt ist. Zwischencommits, Subagenten, Implementierung, Integration und Prüfungen sind
dort nicht autorisiert. Endet der Dialog vorher oder bleibt eine Aufgabe offen, entsteht kein Commit. Die
spätere Ausführung eines geklärten Tasks braucht einen neuen ausdrücklichen Aufruf eines passenden Skills.
Außerhalb dieser Grenzen braucht jeder Commit den folgenden ausdrücklichen Auftrag.

## Zustand und Synchronisierung

1. Ermittle Repo-Root, Branch, Upstream und vorhandene Remotes. Berücksichtige eingebettete Repos und
   benachbarte Worktrees.
2. Prüfe `git status` sowie die passenden Diffs für gestagte und ungestagte Änderungen.
3. Führe `git fetch` aus, bevor du den lokalen Stand mit dem Upstream vergleichst.
4. Aktualisiere einen sauberen, nur zurückliegenden Branch ausschließlich per Fast-Forward, bevorzugt mit
   `git pull --ff-only`.
5. Merge, rebase oder stash bei lokalen Änderungen, Divergenz oder Konflikten nicht eigenmächtig. Berichte
   den Zustand und hole die nötige Entscheidung ein.

## Commit und Push

Lokale Commits brauchen eine ausdrückliche Autorisierung des Nutzers. Sie kann einen einzelnen Commit oder
alle sachlich passenden Commits eines klar begrenzten Arbeitslaufs umfassen. Innerhalb eines so autorisierten
Laufs braucht nicht jede Commit-Nachricht eine zusätzliche Einzelfreigabe:

1. Ermittle für jeden betroffenen Pfad das genaue Repo-Root. Ein eingebettetes Repo mit eigener `.git`-Struktur
   ist ein eigenes Repo. Jedes Repo erhält einen eigenen gestagten Diff, eine eigene Nachricht und einen
   eigenen Commit; fasse sie nie zusammen.
2. Lies den gesamten Diff genau dieses Repos. Stage bewusst und führe nie ungesehen `git add -A` aus. Trenne
   unabhängige Änderungen in eigene Commits.
3. Entwirf die Nachricht ausschließlich aus dem gestagten Diff dieses Commits:
   - Standard ist nur ein Betreff. Folge der vorhandenen Repo-Konvention, formuliere im Imperativ und nenne
     eine abgeschlossene Änderung. Ziele auf höchstens 50 Zeichen, überschreite nie 72.
   - Ergänze einen Body nur, wenn ein nicht offensichtliches Warum, Risiko, eine Migration oder Einschränkung
     für das spätere Verständnis nötig ist. Nach einer Leerzeile folgt höchstens ein kurzer Absatz mit fünf
     umbrochenen Zeilen oder drei einzeiligen Punkten.
   - Schreibe keine Sessionchronik, Dateitour, Testergebnisliste, offene Folgearbeit oder Änderungen eines
     anderen Repos hinein. Ausführliche Begründungen gehören in die betroffene Dokumentation, Entscheidung,
     Aufgabe oder Pull Request.
   - Verwende keinen Co-Author-Trailer, kein Tool-Branding und keine „generated with“-Zeile.
4. Kläre die Autorisierung vor dem ersten Commit. Ein ausdrücklicher Commit-Auftrag oder ein Verfahren, das
   lokale Commits für seinen klaren Scope autorisiert, genügt für alle sachlich nötigen Commits dieses
   Scopes. Ein bloßer Umsetzungsauftrag enthält keine stillschweigende Commit-Autorisierung.
5. Fehlt die Autorisierung oder verlangt der Nutzer eine Vorschau, zeige Betreff und jede weitere Zeile der
   geplanten Nachricht vollständig und warte auf Zustimmung. Arbeite Korrekturen ein und zeige jede
   überarbeitete Fassung erneut vollständig.
6. Committe innerhalb eines autorisierten Scopes ohne weitere Nachrichtenfreigabe. Berichte danach jede
   vollständige Nachricht und Commit-ID. Führe vor dem Push erneut `git fetch` aus und prüfe, ob der Upstream
   seit der letzten Prüfung weitergelaufen ist. Integriere neue Änderungen nicht automatisch.
7. Pushe erst, wenn der lokale Commit sicher auf dem geprüften Upstream aufbaut.

Ein Betreff genügt meistens:

```text
Backlog-Projekt archivieren
```

Nur ein notwendiges Warum rechtfertigt den Body:

```text
Migration vor dem App-Wechsel ausführen

Additive Migrationen schützen die alte, nicht die neue App-Version vor
Schemaabweichungen.
```

Ein äußerer Commit darf einen Zusammenhang mit einem eingebetteten Repo erklären, aber nie dessen Änderung
als eigenen Inhalt ausgeben. „Lokalen Runbook entfernen“ und „Betriebsdokumentation ergänzen“ sind zwei
autarke Nachrichten in zwei Repos, nicht eine gemeinsame Erzählung.

Biete diesen Skill an, wenn eine fertige Änderung noch uncommittet und kein Commit autorisiert ist. Greife
nicht ohne einen ausdrücklichen Commit-Auftrag oder einen autorisierten Arbeitslauf zu `git commit`.

## Scope-out

- Nicht ausdrücklich betroffene Repos, Branches, Worktrees und Remotes bleiben unverändert.
- Verwende niemals `push --force`.
- Schreibe bereits geteilte Historie nur auf ausdrücklichen Wunsch und nur im genannten Scope um.
- Committe keine Secrets, Zugangsdaten oder personenbezogenen Daten.
- Stoppe bei Unsicherheit oder Konflikten und frage, statt zu raten.
- Beschreibe in der Commit-Nachricht nur den Inhalt dieses Commits in diesem Repo. Arbeit außerhalb davon
  gehört in die Antwort an den Nutzer.

## Identität

Übernimm keinen echten Namen und keine echte E-Mail-Adresse aus dem Harness. Fehlt die Git-Identität, frage
nach dem gewünschten Namen und der gewünschten Adresse sowie danach, ob sie global oder nur für dieses Repo
gelten sollen.

## Große Dateien und Binärdateien

Lege stabile Binärdateien nur über Git LFS ins Repo. Prüfe, ob `git-lfs` installiert ist. Wenn nicht, nenne
die Voraussetzung, dass es auf jedem Gerät vorhanden sein muss. Die Pfadzuordnung liegt in `.gitattributes`
und reist mit dem Repo.
