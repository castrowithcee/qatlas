---
description: >
  Ablauf für Commit und Push: autorisieren, stagen, Nachricht formulieren, Identität klären, committen und
  nach aktuellem Fetch pushen.
license: MIT
type: playbook
edit: locked
---

# Commit und Push

## Commit

Ein klar begrenzter Umsetzungsauftrag autorisiert lokale Commits eigener Änderungen in den betroffenen Repos
und auf den für den Auftrag zulässigen Branches. Auch ein ausdrücklicher Commit-Auftrag kann einen einzelnen
Commit oder alle sachlich passenden Commits eines klar begrenzten Arbeitslaufs autorisieren. Weder jeder
Commit noch jede Commit-Nachricht braucht dann eine zusätzliche Einzelfreigabe:

1. Lies vor jedem Commit den gesamten Diff genau dieses Repos. Stage bewusst und führe nie ungesehen
   `git add -A` aus. Fremde oder nicht zuordenbare Änderungen bleiben ungestagt. Schneide Commits nach der
   [Commitgrenze](commit-boundaries.md).
2. Führe nach dem Staging `node <plugin-root>/scripts/qatlas-protection-check.js --target <repo-root>` aus;
   `<plugin-root>` ist der im Sessionkontext genannte `QATLAS PLUGIN ROOT`, ohne Hook drei Ebenen über diesem
   Ordner. Exit `0` heißt weiter; nenne dabei ausgegebene `warn`-Befunde. Exit `1` heißt nicht committen und
   den Befund melden. Exit `2` heißt vor dem Commit im Gespräch nachfragen. Exit `3` heißt, dass die Prüfung
   nicht laufen konnte; committe nicht und melde den Grund. In einem autonomen Lauf stoppt jeder Exit außer
   `0` nur den betroffenen Task.
3. Entwirf die Nachricht ausschließlich aus dem gestagten Diff dieses Commits. Sie beschreibt knapp, was
   sich ändert, und nur das nötige Warum, Risiko oder die Einschränkung. Die vorhandene Repo-Konvention
   geht jeder folgenden Vorgabe vor:
   - Standard ist ein kurzer, für sich verständlicher Betreff im Imperativ, der eine abgeschlossene
     Änderung nennt. Richtwert sind etwa 50 Zeichen; über 72 nur, wenn die Konvention es verlangt.
   - Ergänze einen Body, wenn ein nicht offensichtliches Warum, Risiko, eine Migration oder Einschränkung
     für das spätere Verständnis nötig ist. Er ist so lang wie diese Begründung und nicht länger; es gibt
     keine feste Zeilen- oder Punktgrenze, die sie abschneidet.
   - Schreibe keine Sessionchronik, Dateitour, Testergebnisliste oder offene Folgearbeit hinein. Was über
     den Commit hinausreicht, gehört in die betroffene Dokumentation, Entscheidung, Aufgabe, Pull Request
     oder die Antwort an den Nutzer.
   - Verwende keinen Co-Author-Trailer, kein Tool-Branding und keine „generated with“-Zeile.
4. Fehlt die Git-Identität, übernimm keinen echten Namen und keine echte E-Mail-Adresse aus dem Harness.
   Frage nach gewünschtem Namen und gewünschter Adresse sowie danach, ob sie global oder nur für dieses Repo
   gelten sollen.
5. Fehlt die Autorisierung oder verlangt der Nutzer eine Vorschau, zeige Betreff und jede weitere Zeile der
   geplanten Nachricht vollständig und warte auf Zustimmung. Arbeite Korrekturen ein und zeige jede
   überarbeitete Fassung erneut vollständig.
6. Committe innerhalb eines autorisierten Scopes ohne weitere Freigabe. Berichte danach jede vollständige
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

## Push

Pushe nur auf ausdrücklichen Auftrag. Führe davor `git fetch` aus und prüfe, ob der Upstream seit der
letzten Prüfung weitergelaufen ist. Integriere neue Änderungen nicht automatisch und pushe erst, wenn der
lokale Commit sicher auf dem geprüften Upstream aufbaut.
