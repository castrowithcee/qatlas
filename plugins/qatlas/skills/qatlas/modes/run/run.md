---
description: >
  Serieller autonomer Arbeitslauf für standardmäßig höchstens fünf ausführbare Tasks: Ein Orchestrator
  disponiert, überwacht und integriert genau einen aktiven Task zur Zeit, den Subagents mit je einem
  abgegrenzten Auftrag umsetzen, und übergibt ihn nach spätestens zwei erfolglosen Korrekturen gesichert an
  den Nutzer.
type: playbook
edit: locked
license: MIT
---

# Arbeit ausführen

Aus einem ausdrücklich gewählten Task-, Projekt- oder Backlog-Scope entstehen integrierte, belegte
Ergebnisse oder konkrete menschliche Übergaben. Der initiale Agent ist der Orchestrator. Er hält Scope,
Spine, Taskauswahl, Subagents, Beweise, Integration und Stopbedingungen; die Subagents setzen die fachliche
Arbeit um.

Der Aufruf allein autorisiert im gewählten Scope Subagents, lokale Änderungen, Prüfungen, isolierte
Worktrees und lokale Commits. Er autorisiert keinen Push, Publish, kein Deployment, keine Nachricht an
Dritte und keine sonstige externe oder irreversible Wirkung. Er erhält die Freigabe für gesperrte
Projektdokumentation nach dem gemeinsamen Vertrag. Abschlussmeldungen sendet ausschließlich der primäre
Orchestrator; Subagents senden bei ihrer Fertigmeldung keine Nachricht.

## Aufruf

`run [Task, Projekt oder Backlog] [--limit <n|all>] [--fly] [Laufvorgabe]`

- **Ohne `--limit`:** Die Taskgrenze ist fünf.
- **`--limit <n|all>`:** Setzt die Taskgrenze auf `n` oder bei `all` auf alle ausführbaren Tasks des
  Scopes. Liegt sie über fünf, prüfe nach jedem abgeschlossenen oder gesichert übergebenen Task, ob dein
  Kontext einen weiteren vollständigen Task samt Integration und Abschlussbericht noch sicher trägt. Ist er
  bereits verdichtet worden oder reicht er absehbar nicht, beende den Lauf regulär an dieser Taskgrenze.
- **`--fly`:** Der Nutzer ist während des Laufs nicht erreichbar; es gilt [`--fly` im Run](flag-fly.md).

## Leseliste

Die Blöcke wiederholen nichts aus dieser Datei und einander; was du nicht liest, fehlt dir in diesem Lauf.
Lies jeden vollständig zum genannten Zeitpunkt:

1. **Vor dem ersten Schritt:** [die Backlog-Norm](../../../qatlas-core-backlog/SKILL.md), [Orchestrierung
   prüfen](../../references/playbook-orchestra-config.md) und [Tasks
   auswählen](../../references/playbook-task-selection.md). Mit `--fly` zusätzlich die Flag-Datei aus
   „Aufruf“ und [Ohne Nutzer entscheiden](../../references/playbook-autonomy.md).
2. **Wenn `orchestra.yaml` fehlt, ungültig ist oder ein Modell zweifelhaft erscheint:** [Orchestrierung
   einrichten](../../references/playbook-orchestra.md).
3. **Vor dem ersten schreibenden Git-Schritt:** [den Git-Ablauf](../../references/playbook-git-workflow.md),
   [die Git-Norm](../../../qatlas-core-git/SKILL.md) und ihre
   [Commit-Referenz](../../../qatlas-core-git/references/playbook-commit.md).
4. **Bevor ein Task-Branch oder Worktree entsteht:** [den
   Worktree-Vertrag](../../../qatlas-work/references/worktree-contract.md).
5. **Wenn mehrere Subagents gleichzeitig schreiben, ein Task übernommen oder wieder aufgenommen wird oder
   weitere Orchestratoren im selben Repo oder Planungssystem arbeiten:** [Parallele Arbeit im
   Run](../../references/git-parallel.md).
6. **Vor dem ersten Subagent-Auftrag:** [Einen Task ausführen](playbook-task-execution.md).
7. **Vor der ersten Abnahme:** [Abnehmen und integrieren](../../references/playbook-acceptance.md).
8. **Bei Zweifel am Commitzuschnitt und vor einem Checkpoint:**
   [die Commitgrenze](../../../qatlas-core-git/references/commit-boundaries.md).
9. **Verlangen Nutzer- oder Projektvorgaben Pull Requests, vor dem ersten Push:** [Integration über Pull
   Requests](../../references/playbook-git-pr.md).
10. **Vor dem Abschlussbericht:** [den Abschlussblock](../../references/playbook-closing-block.md).

## Laufvertrag festlegen

Bestimme vor der ersten Änderung:

1. **Ziel:** Welcher beobachtbare Zustand beendet den Lauf erfolgreich?
2. **Scope-in:** Welche Tasks, Repos, Pfade und Systeme gehören zum Aufruf?
3. **Scope-out:** Welche benachbarten Ziele, Pfade und Wirkungen bleiben ausgeschlossen?
4. **Spine:** Welches Planungssystem hält Status, Abhängigkeiten, Befunde und Übergaben dauerhaft fest?
5. **Beweise:** Welche Tests, Zustände oder Artefakte belegen den Abschluss?
6. **Grenzen:** Welche Handlung braucht zwingend den Nutzer?

Ist ein vorgeschriebenes externes Planungssystem nicht erreichbar, stoppe vor schreibender Arbeit mit dem
konkreten Hindernis.

Der Laufvertrag konkretisiert den gewählten Scope, ersetzt aber nicht dessen Ausarbeitung. `run` prüft die
Ausführungsgrundlage auf Aktualität, Umgebungs- und Git-Voraussetzungen; er soll den fachlichen Scope nicht
erst durch eine neue Erstanalyse entdecken. Ein seit `shape` veränderter Bestand ist trotzdem
ein normaler Befund und wird nach den Reiferegeln der Taskauswahl behandelt. Ein bloß großer Task wird nicht
automatisch zum Auftrag an ein stärkeres Modell.

## Ablauf

1. Prüfe die Orchestrierung und wähle die Tasks aus.
2. Beanspruche genau einen Task, lass ihn umsetzen, nimm ihn ab und integriere ihn.
3. Erfasse Nebenbefunde, bevor du den nächsten ausgewählten Task beginnst.
4. Wiederhole Auswahl, Umsetzung und Integration, bis die Taskgrenze erreicht ist oder eine Stopbedingung
   eintritt.

## Stopbedingungen

Beende den Lauf, sobald eine dieser Bedingungen gilt:

- Die Taskgrenze ist erreicht: So viele Tasks wurden abgeschlossen oder gesichert übergeben.
- Bei erhöhter Taskgrenze trägt der Kontext des Orchestrators keinen weiteren vollständigen Task.
- Der gewählte Scope ist vollständig und belegt abgeschlossen.
- Es gibt im Scope weder ausführbares `next` noch ausführbares `ready`.
- Ein fehlgeschlagener Task blockiert die verbleibende Arbeit.
- Es bleibt nur Arbeit mit unerfüllten Abhängigkeiten, `waiting`, `draft` oder menschlicher Übergabe.
- Eine Scope-, Risiko-, Außenwirkungs- oder Berechtigungsgrenze ist erreicht.
- Beanspruchung, Eigentümerschaft oder Integrationsbesitz eines benötigten Tasks ist nicht eindeutig belegt.
- Der Steuerbranch wurde seit dem Preflight fremd verändert.

## Abschluss

Sichere vor dem Ende Spine, Abschlussberichte, Nebenbefunde und erlaubte lokale Commits. Der Nutzer setzt
einen Lauf meist in einer neuen Session fort. Jede Übergabe steht deshalb mit ihrer Task-ID im Spine, und
der Abschluss ist ohne den Laufverlauf verständlich. Berichte Ergebnis und maßgebliche Beweise knapp. Nenne
pro bearbeitetem Task geänderte Dateien, ausgeführte Prüfungen, Dokumentationswirkung, Abweichungen von der
erwarteten Arbeitskarte und ungelöste Risiken sowie die eingesetzten Worker-Profile mit Modell und Effort;
Rohlogs bleiben draußen.
