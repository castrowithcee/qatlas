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
3. Ein Status- oder Diffauftrag bleibt lokal und nennt die Abweichung zum Upstream als Stand des zuletzt
   geholten Remotes. Führe `git fetch` erst aus, wenn der Auftrag einen aktuellen Remotevergleich, eine
   schreibende Integration, einen Sync oder einen Push braucht, und nur für die betroffenen Remotes.
4. Aktualisiere einen sauberen, nur zurückliegenden Branch ausschließlich in einem ausdrücklich
   autorisierten Sync- oder Arbeitsablauf und ausschließlich per Fast-Forward, bevorzugt mit
   `git pull --ff-only`.
5. Merge, rebase oder stash bei lokalen Änderungen, Divergenz oder Konflikten nicht eigenmächtig. Berichte
   den Zustand und hole die nötige Entscheidung ein.

## Task, Commit, Review und Release

Diese vier Grenzen sind unabhängig voneinander. Keine legt die Anzahl oder den Zuschnitt einer anderen fest.

- **Task:** eine geplante Arbeitseinheit, kein Commit-Container. Sie ergibt so viele Commits, wie sachlich
  nötig sind: bei kleinem Umfang einen, bei größerem mehrere. Es gibt weder Ein-Commit-Zwang noch Zielzahl.
- **Commit:** ein kohärenter, prüfbarer und möglichst einzeln rückrollbarer Zustand. Auf dem
  Integrationspfad ist jeder Commit für sich verständlich und besteht die für ihn einschlägigen Prüfungen.
  Implementation und zugehörige Tests reisen im selben Commit. Ein eigenständiger Charakterisierungstest
  oder ein rein mechanisches Refactoring darf als eigener vorbereitender Commit vorausgehen. Unabhängige
  Änderungen erhalten eigene Commits.
- **Review:** der Umfang, den ein Mensch gemeinsam beurteilt, etwa ein Branch oder Pull Request. Er darf
  mehrere Commits umfassen und ist kein Grund, sie zusammenzufassen.
- **Release:** der Stand, der gemeinsam versioniert und ausgeliefert wird. Er folgt dem Release-Verfahren
  des Repos, nicht Task- oder Commitgrenzen.

## Meilensteine und Checkpoints

Sichere bei längerer oder riskanter Arbeit nach jedem kohärenten Meilenstein einen Commit, sofern Commits
für diesen Scope autorisiert sind. Sichere vor Übergabe oder Pause einen wiederaufnehmbaren Stand.

- Ein unfertiger Checkpoint entsteht nur auf einem exklusiven privaten Branch, und seine Nachricht weist
  ihn als unfertig aus. Er landet nie unbereinigt auf einem gemeinsamen Branch.
- Vor gemeinsamer Integration wird ein Checkpoint entweder zu sinnvollen Commits im Sinne der
  Commitgrenze bereinigt oder ausdrücklich als wertvolle Zwischenstufe erhalten.
- Bereinige nur Historie, die noch nicht geteilt ist. Geteilt ist ein gemeinsamer oder geschützter Branch
  sowie jeder Commit, auf dem andere aufbauen oder den sie integriert haben. Ein ausschließlich zur
  Sicherung gepushter exklusiver Branch ist nicht geteilt; ihn erneut zu pushen verlangt die
  `--force-with-lease`-Ausnahme unten.
- Prüfe nach einer Bereinigung, dass der Endstand inhaltlich dem geprüften Stand vor der Bereinigung
  entspricht, und prüfe jeden entstandenen Commit wie einen neuen.
- Ohne Commit-Autorisierung bleibt ein Zwischenstand uncommittet in seinem Arbeitsbaum; berichte Branch,
  Worktree und Zustand bei der Übergabe.

## Commit und Push

Lokale Commits brauchen eine ausdrückliche Autorisierung des Nutzers. Sie kann einen einzelnen Commit oder
alle sachlich passenden Commits eines klar begrenzten Arbeitslaufs umfassen. Innerhalb eines so autorisierten
Laufs braucht weder jeder Commit noch jede Commit-Nachricht eine zusätzliche Einzelfreigabe:

1. Ermittle für jeden betroffenen Pfad das genaue Repo-Root. Ein eingebettetes Repo mit eigener `.git`-Struktur
   ist ein eigenes Repo. Jedes Repo erhält einen eigenen gestagten Diff, eine eigene Nachricht und einen
   eigenen Commit; fasse sie nie zusammen.
2. Lies vor jedem Commit den gesamten Diff genau dieses Repos. Stage bewusst und führe nie ungesehen
   `git add -A` aus. Fremde oder nicht zuordenbare Änderungen bleiben ungestagt. Schneide Commits nach der
   Commitgrenze oben.
3. Entwirf die Nachricht ausschließlich aus dem gestagten Diff dieses Commits. Sie beschreibt knapp, was
   sich ändert, und nur das nötige Warum, Risiko oder die Einschränkung. Die vorhandene Repo-Konvention
   geht jeder folgenden Vorgabe vor:
   - Standard ist ein kurzer, für sich verständlicher Betreff im Imperativ, der eine abgeschlossene
     Änderung nennt. Richtwert sind etwa 50 Zeichen; über 72 nur, wenn die Konvention es verlangt.
   - Ergänze einen Body, wenn ein nicht offensichtliches Warum, Risiko, eine Migration oder Einschränkung
     für das spätere Verständnis nötig ist. Er ist so lang wie diese Begründung und nicht länger; es gibt
     keine feste Zeilen- oder Punktgrenze, die sie abschneidet.
   - Schreibe keine Sessionchronik, Dateitour, Testergebnisliste, offene Folgearbeit oder Änderungen eines
     anderen Repos hinein. Was über den Commit hinausreicht, gehört in die betroffene Dokumentation,
     Entscheidung, Aufgabe oder Pull Request.
   - Verwende keinen Co-Author-Trailer, kein Tool-Branding und keine „generated with“-Zeile.
4. Kläre die Autorisierung vor dem ersten Commit. Ein ausdrücklicher Commit-Auftrag oder ein Verfahren, das
   lokale Commits für seinen klaren Scope autorisiert, genügt für alle sachlich nötigen Commits dieses
   Scopes. Ein bloßer Umsetzungsauftrag enthält keine stillschweigende Commit-Autorisierung.
5. Fehlt die Autorisierung oder verlangt der Nutzer eine Vorschau, zeige Betreff und jede weitere Zeile der
   geplanten Nachricht vollständig und warte auf Zustimmung. Arbeite Korrekturen ein und zeige jede
   überarbeitete Fassung erneut vollständig.
6. Committe innerhalb eines autorisierten Scopes ohne weitere Freigabe. Berichte danach jede vollständige
   Nachricht und Commit-ID.
7. Pushe nur auf ausdrücklichen Auftrag. Führe davor `git fetch` aus und prüfe, ob der Upstream seit der
   letzten Prüfung weitergelaufen ist. Integriere neue Änderungen nicht automatisch und pushe erst, wenn
   der lokale Commit sicher auf dem geprüften Upstream aufbaut.

Ein Betreff genügt meistens:

```text
Backlog-Projekt archivieren
```

Ein notwendiges Warum rechtfertigt den Body:

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

## Historie und Force-Push

- Verwende niemals `git push --force`, `-f` oder einen Refspec mit `+`.
- `--force-with-lease` ist eine gesonderte Ausnahme. Sie gilt nur für einen exklusiv besessenen,
  ungeschützten Branch, nur unmittelbar nach aktuellem `git fetch` und nur mit ausdrücklich erwartetem
  Remotestand, also `--force-with-lease=<branch>:<erwartete-id>`. Sie braucht einen ausdrücklichen Auftrag
  des Nutzers für genau diesen Push; keine Orchestrierungs-Autorisierung deckt sie ab. Nenne vorher Branch,
  erwartete und neue Commit-ID; Qatlas führt sie nie still aus.
- Schreibe geteilte Historie nicht eigenmächtig um. Verlangt der Nutzer es ausdrücklich, bleibe im genannten
  Scope. Ein Push, der solche Historie veröffentlicht, liegt außerhalb der Ausnahme oben und bleibt beim
  Nutzer.

## Scope-out

- Nicht ausdrücklich betroffene Repos, Branches, Worktrees und Remotes bleiben unverändert.
- Committe keine Secrets, Zugangsdaten oder personenbezogenen Daten, auch nicht über Git LFS.
- Stoppe bei Unsicherheit oder Konflikten und frage, statt zu raten.
- Beschreibe in der Commit-Nachricht nur den Inhalt dieses Commits in diesem Repo. Arbeit außerhalb davon
  gehört in die Antwort an den Nutzer.

## Identität

Übernimm keinen echten Namen und keine echte E-Mail-Adresse aus dem Harness. Fehlt die Git-Identität, frage
nach dem gewünschten Namen und der gewünschten Adresse sowie danach, ob sie global oder nur für dieses Repo
gelten sollen.

## Große Dateien und Binärdateien

Entscheide über Git LFS nach Repo-Policy, Dateigröße und Änderungshäufigkeit. Eine vorhandene Zuordnung in
`.gitattributes` oder eine Vorgabe der Projektanweisungen gilt. Kleine, selten geänderte Binärdateien wie
Icons sind ohne solche Vorgabe nicht LFS-pflichtig. Große oder häufig geänderte Binärdateien gehören in Git
LFS oder einen Dateispeicher.

Prüfe vor LFS-Nutzung, ob `git-lfs` installiert ist. Wenn nicht, nenne die Voraussetzung, dass es auf jedem
Gerät vorhanden sein muss. Die Pfadzuordnung liegt in `.gitattributes` und reist mit dem Repo. Führe LFS
nicht eigenmächtig neu ein; eine Migration bestehender Dateien in LFS kann Historie umschreiben und folgt
dann den Regeln oben.
