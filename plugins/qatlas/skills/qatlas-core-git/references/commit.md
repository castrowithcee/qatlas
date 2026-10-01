---
description: >
  Commits zuschneiden, autorisieren, stagen, formulieren und als Checkpoints sichern, einschließlich der
  Grenzen zwischen Task, Commit, Review und Release.
license: MIT
type: playbook
edit: locked
---

# Commit

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
- Vor gemeinsamer Integration wird ein Checkpoint entweder nach [Historie](history.md) zu sinnvollen Commits
  im Sinne der Commitgrenze bereinigt oder ausdrücklich als wertvolle Zwischenstufe erhalten.
- Ohne Commit-Autorisierung bleibt ein Zwischenstand uncommittet in seinem Arbeitsbaum; berichte Branch,
  Worktree und Zustand bei der Übergabe.

## Autorisieren und committen

Ein klar begrenzter Umsetzungsauftrag autorisiert lokale Commits eigener Änderungen in den betroffenen Repos
und auf den für den Auftrag zulässigen Branches. Auch ein ausdrücklicher Commit-Auftrag kann einen einzelnen
Commit oder alle sachlich passenden Commits eines klar begrenzten Arbeitslaufs autorisieren. Weder jeder
Commit noch jede Commit-Nachricht braucht dann eine zusätzliche Einzelfreigabe:

1. Lies vor jedem Commit den gesamten Diff genau dieses Repos. Stage bewusst und führe nie ungesehen
   `git add -A` aus. Fremde oder nicht zuordenbare Änderungen bleiben ungestagt. Schneide Commits nach der
   Commitgrenze oben.
2. Entwirf die Nachricht ausschließlich aus dem gestagten Diff dieses Commits. Sie beschreibt knapp, was
   sich ändert, und nur das nötige Warum, Risiko oder die Einschränkung. Die vorhandene Repo-Konvention
   geht jeder folgenden Vorgabe vor:
   - Standard ist ein kurzer, für sich verständlicher Betreff im Imperativ, der eine abgeschlossene
     Änderung nennt. Richtwert sind etwa 50 Zeichen; über 72 nur, wenn die Konvention es verlangt.
   - Ergänze einen Body, wenn ein nicht offensichtliches Warum, Risiko, eine Migration oder Einschränkung
     für das spätere Verständnis nötig ist. Er ist so lang wie diese Begründung und nicht länger; es gibt
     keine feste Zeilen- oder Punktgrenze, die sie abschneidet.
   - Schreibe keine Sessionchronik, Dateitour, Testergebnisliste oder offene Folgearbeit hinein. Was über den Commit hinausreicht, gehört in die betroffene Dokumentation,
     Entscheidung, Aufgabe, Pull Request oder die Antwort an den Nutzer.
   - Verwende keinen Co-Author-Trailer, kein Tool-Branding und keine „generated with“-Zeile.
3. Fehlt die Git-Identität, folge zuerst [Identität](identity.md).
4. Fehlt die Autorisierung oder verlangt der Nutzer eine Vorschau, zeige Betreff und jede weitere Zeile der
   geplanten Nachricht vollständig und warte auf Zustimmung. Arbeite Korrekturen ein und zeige jede
   überarbeitete Fassung erneut vollständig.
5. Committe innerhalb eines autorisierten Scopes ohne weitere Freigabe. Berichte danach jede vollständige
   Nachricht und Commit-ID.

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

Ist für eine fertige, uncommittete Änderung weder ein Umsetzungs- noch ein Commit-Auftrag erkennbar, biete
den Commit an, statt ihn auszuführen.
