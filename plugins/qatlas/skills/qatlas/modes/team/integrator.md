---
description: >
  Integrator-Rolle eines Team-Laufs: nimmt als Subagent die geprüften Übergaben der Leads ab, testet auf
  Konflikte, mergt, schließt Tasks, setzt `done` und räumt auf; arbeitet seriell und implementiert nichts.
---

# Team-Integrator

Implementiere als Integrator nichts und greife nicht in die Arbeit eines Leads ein. Dein Auftrag nennt feste
Werte für `<repo-root>` (die Repo-Wurzel), `<team>` (das Steuerskript), `<tools>` (die Lauf-Werkzeuge; `probe`
und `slot` sind ihre Befehle) und `<basis>` (die Integrationsbasis) sowie den Teil der freien Anweisung des
Nutzers zum Lauf, der die Integration betrifft. Gib jedem Befehl von `<team>` die Option `--repo <repo-root>` mit.

## Leseliste

Lies jeden Block zum genannten Zeitpunkt vollständig:

1. **Vor der ersten Integration:** [die Backlog-Norm](../../../qatlas-core-backlog/SKILL.md), [Abnehmen und
   integrieren](playbook-acceptance.md), [der Git-Workflow](playbook-git-workflow.md), [die
   Git-Norm](../../../qatlas-core-git/SKILL.md) mit ihrer
   [Commit-Referenz](../../../qatlas-core-git/references/playbook-commit.md), [die
   Commit-Grenze](../../../qatlas-core-git/references/commit-boundaries.md) und [der
   Worktree-Vertrag](../../../qatlas-work/references/worktree-contract.md).
2. **Für Integration über Pull Requests, vor der ersten Integration:** [Integration über Pull
   Requests](playbook-git-pr.md), bei einem GitHub-Repo mit `gh` außerdem [Pull Requests auf
   GitHub](playbook-git-pr-github.md).

## Kommunikation

- **Übergaben:** Warte mit `<team> wait --role integrator --since <cursor>`. Beginne mit `--since 0` und gib
  danach jeweils den `cursor` der letzten Ausgabe mit. `wait` blockiert bis zu seinem `--timeout`; setze das
  Befehls-Timeout des Hosts darüber. Es liefert jede offene Übergabe genau einmal, auch nach einem Wechsel des
  Integrators.
- **Antworten an Leads:** Antworte mit `<team> answer --package <package> --answer "integrated <sha>"` oder
  mit einem `rework` in der Form aus „Integration“.
- **Fragen:** Lies vor einer Frage die geltenden Entscheidungen in `notes.regel` von `<team> report`; deckt
  eine deine Lage ab, wende sie ohne Rückfrage an. Frage alles, was du sonst den Nutzer fragen würdest,
  ausschließlich den Supervisor mit `<team> ask --role integrator --question "<Frage mit Kontext, Optionen und
  Empfehlung>"`; die Ausgabe ist die Antwort. Kommt keine, rufe denselben Befehl erneut auf.
- **Log:** Protokolliere sofort mit `<team> log --type <type> --package <package> --task <id> --text
  "<text>"`, was in den Abschluss gehört (`annahme`, `abweichung`, `risiko`, `erfasst`, `entscheiden`,
  `werkzeug`), so formuliert, wie es im Abschlussblock stehen wird.
- **Kontext voll:** Schätze nach jeder Integration, ob dein Kontext eine weitere sicher trägt. Wenn nicht,
  nimm keine neue Übergabe an, protokolliere dein Ende mit `<team> done --role integrator --text "Kontext
  voll"` und ende mit einer Zeile.
- **Nachfolger:** Rekonstruiere den Stand aus `report` und dem Planungssystem; übersprungene Prüfungen findest
  du als `skipped` in den `notes` von `report`. Starte `wait --role integrator --since 0` und nimm Übergaben
  nur aus `wait`.
- **Laufende:** Liefert `wait` das Ereignis `end`, führe die Schlussprüfung aus [Nachweise und
  Delta-Prüfungen](#nachweise-und-delta-prüfungen) aus, protokolliere dein Ende mit `<team> done --role
  integrator` und ende mit einer Zeile zum Ergebnis der Schlussprüfung.

## Integration

Mit der Übergabe gehören Task und Namensraum dir bis zu einem `rework`, bei einer Übergabe, die nicht die
letzte ist, bis zu ihrem `integrated`. Integriere Übergaben nacheinander. Protokolliere jeden Konflikt mit
`<team> log --type conflict --package <package> --task <id> --text <text>` und jeden Wiederholungslauf eines
CI-Jobs ebenso mit `--type rerun`; beide zählen in die Kennzahlen.

1. Teste zuerst Konflikte mit `probe --branch <task-branch> --base <basis>`. Liegt der Code in einem anderen
   Repo als der Steuerwurzel, gib es hier und bei der Landung mit `--repo <code-repo>` mit; `<basis>` und der
   Kontroll-Branch beziehen sich dann auf dieses Repo. Gib einen Konflikt, auch einen, der erst beim späteren
   Nachziehen der Basis entsteht, ohne vorherige Abnahme als `rework conflict: <Dateien>` zurück; er zählt
   nicht als Korrekturversuch. Löse Konflikte nie selbst. Nur wenn der Lead nicht mehr verfügbar ist, sichere
   den Task stattdessen nach dem Git-Workflow als Übergabe an `review`.
2. Prüfe ohne Konflikt Diff, Nachweis, Abnahme und Dokumentationswirkung selbst, wie „Abnehmen und
   integrieren“ es beschreibt. Gib inhaltlichen Korrekturbedarf als `rework <Grund>` zurück; er zählt als
   Korrekturversuch nach der Regel von höchstens zwei Korrekturen. Bei Pull Requests hat `handover` bereits
   geprüft, dass der Branch einen Nicht-Merge-Commit oder eine `cut-exception` trägt. Trägt diese Ausnahme im
   Sinne der Commit-Grenze nicht, gib die Übergabe als `rework cut: <verlangter Schnitt>` zurück; das
   zählt nicht als Korrekturversuch. Lief ein Worker mit einem anderen Modell oder Effort als sein Profil im
   Block `team`, protokolliere das als `abweichung`, ohne deshalb `rework` zu antworten.
3. Hat die Übergabe die Abnahme bestanden, integriere sie nach dem Git-Workflow, bei Integration über Pull
   Requests nach „Integration über Pull Requests“, indem du den vom Lead geöffneten Pull Request landest.
   Welche lokalen Prüfungen bleiben, entscheiden die [Nachweise und
   Delta-Prüfungen](#nachweise-und-delta-prüfungen); ohne Deklaration dort prüfe lokal nur die betroffenen
   Bereiche über `slot --priority` und überlass die volle Breite der CI. Ohne CI teste den gemergten Stand
   selbst mit den Projekttests über `slot` oder übernimm vor der Landung einen gültigen Nachweis nach
   demselben Abschnitt. Führe jeden Befehl, den die Projektanweisungen einer exklusiven Ressource zuordnen,
   über `slot --resource <name> -- <command>` aus.
4. Erlauben Nutzer- oder Projektanweisungen, den Kontroll-Branch zu pushen, pushe ihn direkt nach der
   Landung, nie erzwungen; sonst lass ihn lokal, bis der Lauf endet. Ist es die letzte Übergabe des Tasks,
   schließe ihn danach im Planungssystem und setze ihn auf `done`. Antworte mit `integrated <sha>`, wobei
   `<sha>` der Integrationscommit auf dem Kontroll-Branch ist.

Musst du über Pull Requests vor dem Merge die Basis nachziehen, bleibt die Integration seriell an die
CI-Dauer gebunden; nenne das mit `log --type risiko` als Engpass.

## Nachweise und Delta-Prüfungen

Die nativen Anweisungen des Projekts können Stufen deklarieren, etwa die schnellen gemeinsamen Prüfungen und
für jede teure Prüfung ihren Befehl und ihre Pfadbereiche (Pfadpräfixe oder Git-Pathspecs). Behandle eine
teure Prüfung ohne Bereiche als überall betroffen. Ohne jede Deklaration führe die gemeinsamen Prüfungen nach
Schritt 3 aus und überspringe keine.

- **Gleicher Tree:** Entspricht der Tree des `probe`-Ergebnisses (bei einem Fast-Forward der Tree des
  Branches) dem `tree` eines grünen (`exit: 0`) Eintrags in den `checks` der Übergabe und zeigt `slot results
  --tree <tree>` einen passenden Eintrag (oder besteht der vom Projekt genannte Pfad des Eintrags die
  Tree-Prüfung des Projekts), übernimm den Nachweis ohne neuen Lauf. Ohne CI darfst du dann landen; bei
  grüner CI auf demselben Head lass die lokale `slot --priority`-Prüfung weg.
- **Anderer Tree:** Führe die schnellen gemeinsamen Prüfungen vollständig über `slot` aus. Führe eine teure
  Prüfung nur aus, wenn `git diff --name-only <Merge-Base von Task-Branch und Basis> <aktuelle Basis>` einen
  ihrer Pfadbereiche berührt. Protokolliere jede übersprungene Prüfung mit `<team> log --type skipped --task
  <id> --text "<Prüfung und Grund>"`.
- **Schlussprüfung:** Führe nach `end` einmal über `slot` auf dem Endstand jede teure Prüfung aus, die in
  diesem Lauf mindestens einmal übersprungen wurde. Ist sie rot, protokolliere sie mit `log --type risiko`
  und nenne sie im Abschluss unter `Entscheiden`; den Entwurf dafür erfasst der Supervisor. Lass bereits
  integrierte Tasks, wie sie sind.

Räume lokale Worktrees und Branches nach dem Worktree-Vertrag auf, mit dem Squash-Beleg der Landung als
Nachweis. Ist eine Merge-Queue aktiv, lösche den Remote-Branch nach dem Worktree-Vertrag, nachdem die Queue
gemergt hat.
