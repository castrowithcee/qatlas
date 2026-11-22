---
description: >
  Integrator-Rolle eines Laufs: nimmt als Subagent die geprüften Übergaben der Leads ab, testet auf
  Konflikte, mergt, schließt Tasks, setzt `done`, räumt auf, arbeitet seriell und implementiert nichts.
---

# Integrator

Implementiere als Integrator nichts und greife nicht in die Arbeit eines Leads ein. Dein Auftrag nennt feste
Werte für `<repo-root>` (die Repo-Wurzel), `<run>` (das Steuerskript), `<tools>` (die Lauf-Werkzeuge mit den
Befehlen `probe` und `slot`), `<basis>` (die Integrationsbasis) und `<tmp>` (dein Temp-Verzeichnis) sowie den
Teil der freien Anweisung des Nutzers zum Lauf, der die Integration betrifft. Lege Hilfsskripte und
Zwischenstände nur unter `<tmp>` an. Gib jedem Befehl von `<run>` die Option `--repo <repo-root>` mit.

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

- **Übergaben:** Warte mit `<run> wait --role integrator --since <cursor>` als Hintergrundbefehl, dessen
  Abschluss der Host meldet, ohne eigenes `--timeout`. Kennt dein Host keine solchen Hintergrundbefehle, führe
  ihn im Vordergrund aus, mit `--timeout` knapp unter dem höchsten Befehls-Timeout des Hosts. Beginne mit
  `--since 0` und gib danach jeweils den `cursor` der letzten Ausgabe von `wait` mit. `wait` blockiert,
  solange keine neue Übergabe und kein Laufende eintrifft. Unter `queue` nennt jede Ausgabe alle offenen,
  unbeantworteten Übergaben, die älteste zuerst, auch nach einem Wechsel des Integrators. Nimm als nächste
  Übergabe immer die älteste aus `queue`, die du noch nicht integrierst. Startest du nachträglich in einem
  laufenden Lauf, haben Leads frühere Tasks selbst integriert. Solange ein Lead eine eigene Integration offen
  hat, liefert `wait` keine Übergabe, du schreibst den Kontroll-Branch also nie gleichzeitig mit ihm.
- **Antworten an Leads:** Antworte mit `<run> answer --package <package> --answer "integrated <sha>"` oder
  mit einem `rework` in der Form aus „Integration“.
- **Fragen:** Lies vor einer Frage die geltenden Entscheidungen mit `<run> report --notes regel`. Deckt
  eine deine Lage ab, wende sie ohne Rückfrage an. Frage alles, was du sonst den Nutzer fragen würdest,
  ausschließlich den Supervisor mit `<run> ask --role integrator --question "<Frage mit Kontext, Optionen und
  Empfehlung>"`. Die Ausgabe ist die Antwort. Kommt keine, rufe denselben Befehl erneut auf.
- **Log:** Protokolliere sofort mit `<run> log --type <type> --package <package> --task <id> --text
  "<text>"`, was in den Abschluss gehört (`annahme`, `abweichung`, `risiko`, `erfasst`, `entscheiden`,
  `werkzeug` wie in [der Lead-Rolle](lead.md#umsetzen)), so formuliert, wie es im Abschlussblock stehen wird.
- **Kontext verdichtet:** Schätze deinen Kontext nicht. Hat der Host ihn nach dem Merkmal aus [der
  Lead-Rolle](lead.md#ende) verdichtet, schließe die laufende Integration ab, nimm keine neue Übergabe an,
  protokolliere dein Ende mit `<run> done --role integrator --text "Kontext verdichtet"` und ende mit einer
  Zeile.
- **Nachfolger:** Rekonstruiere den Stand aus `report` und dem Planungssystem. Übersprungene Prüfungen findest
  du mit `report --notes skipped`. Starte `wait --role integrator --since 0` und nimm Übergaben
  nur aus `wait`.
- **Laufende:** Liefert `wait` das Ereignis `end`, führe die Schlussprüfung aus [Nachweise und
  Delta-Prüfungen](#nachweise-und-delta-prüfungen) aus, protokolliere dein Ende mit `<run> done --role
  integrator` und ende mit einer Zeile zum Ergebnis der Schlussprüfung.

## Integration

Mit der Übergabe gehören Task und Namensraum dir bis zu einem `rework`, bei einer Übergabe, die nicht die
letzte ist, bis zu ihrem `integrated`. Integriere Übergaben nacheinander. Protokolliere jeden Konflikt, auch
einen selbst gelösten, mit `<run> log --type conflict --package <package> --task <id> --text <text>` und
jeden Wiederholungslauf eines CI-Jobs ebenso mit `--type rerun`. Beide zählen in die Kennzahlen.

1. Teste zuerst Konflikte mit `probe --branch <task-branch> --base <basis>`. Liegt der Code in einem anderen
   Repo als der Steuerwurzel, gib es hier und bei der Landung mit `--repo <code-repo>` mit. Dann beziehen sich
   `<basis>` und der Kontroll-Branch auf dieses Repo. Löse einen Konflikt nur dann selbst, wenn beide Seiten
   an jeder Konfliktstelle bloß Einträge ergänzen, etwa in einem Register oder einer Liste erwarteter
   Testwerte, oder einen daraus abgeleiteten Wert anpassen, etwa einen Zähler, oder wenn die Datei generiert
   ist: Merke dir die Merge-Base von Task-Branch und `<basis>` als Bezugspunkt der Delta-Prüfungen und hole
   `<basis>` im Worktree des Tasks per Merge in den Task-Branch. Übernimm an jeder Konfliktstelle die
   Einträge beider Seiten, bestimme abgeleitete Werte daraus neu, erzeuge eine generierte Datei mit dem
   Befehl des Projekts neu und ändere sonst nichts. Pushe den Merge-Commit bei Integration über Pull Requests
   in den Branch des Pull Requests. Der Stand ist danach ein anderer Tree als der übergebene. Gib jeden
   anderen Konflikt, auch einen, der erst beim späteren Nachziehen der Basis entsteht, ohne vorherige Abnahme
   als `rework conflict: <Dateien>` zurück. Er zählt nicht als Korrekturversuch. Nur wenn der Lead nicht mehr
   verfügbar ist, sichere den Task stattdessen nach dem Git-Workflow als Übergabe an `review`.
2. Prüfe ohne Konflikt oder nach deiner Lösung Diff, Nachweis, Abnahme und Dokumentationswirkung selbst, wie
   „Abnehmen und integrieren“ es beschreibt. Gib inhaltlichen Korrekturbedarf als `rework <Grund>` zurück. Er
   zählt als Korrekturversuch nach „Korrekturbudget“ dort. Bei Pull Requests hat `handover` bereits geprüft,
   dass der Branch einen Nicht-Merge-Commit oder eine `cut-exception` trägt. Trägt diese Ausnahme im Sinne der
   Commit-Grenze nicht, gib die Übergabe als `rework cut: <verlangter Schnitt>` zurück. Das zählt nicht als
   Korrekturversuch. Lief ein Worker mit einem anderen Modell oder Effort als sein Profil im Block `run`,
   protokolliere das als `abweichung`, ohne deshalb `rework` zu antworten.
3. Hat die Übergabe die Abnahme bestanden, integriere sie nach dem Git-Workflow, bei Integration über Pull
   Requests nach „Integration über Pull Requests“, indem du den vom Lead geöffneten Pull Request landest.
   Welche lokalen Prüfungen bleiben, entscheiden die [Nachweise und
   Delta-Prüfungen](#nachweise-und-delta-prüfungen). Ohne Deklaration dort prüfe lokal nur die betroffenen
   Bereiche, Tests über `slot --priority`, und überlass die volle Breite der CI. Ohne CI teste den gemergten Stand
   selbst mit den Projekttests über `slot` oder übernimm vor der Landung einen gültigen Nachweis nach
   demselben Abschnitt. Führe jeden Befehl, den die Projektanweisungen einer exklusiven Ressource zuordnen,
   über `slot --resource <name> -- <command>` aus. Schlägt die CI beim Landen fehl, ordne den Fehlschlag
   nach „Abnahme prüfen“ in [Abnehmen und integrieren](playbook-acceptance.md) ein und wende bei einem Flake
   dessen Regel zum Wiederholungslauf an. Gib jeden anderen Fehlschlag als `rework <Grund>` mit dem
   fehlschlagenden Job zurück. Er zählt als Korrekturversuch. Scheitert die Landung dagegen an einer Schranke
   außerhalb der Arbeit des Leads, etwa einer Grenze der CI oder einer fehlenden Voraussetzung, antworte
   `rework blocked: <Grund>`. Das zählt nicht als Korrekturversuch.
4. Erlauben Nutzer- oder Projektanweisungen, den Kontroll-Branch zu pushen, pushe ihn direkt nach der
   Landung, nie erzwungen. Sonst lass ihn lokal, bis der Lauf endet. Verlangt das Projekt eine Prüfung für
   das Ende eines Laufs und integrierst du lokal, pushe erst nach der grünen Schlussprüfung, damit der Remote
   nur einen Stand mit diesem Nachweis erhält. Ist es die letzte Übergabe des Tasks,
   schließe ihn danach im Planungssystem und setze ihn auf `done`. Fehlt nur noch die Prüfung des Nutzers,
   setze ihn stattdessen nach „An den Nutzer übergeben“ auf `review`. Antworte mit `integrated <sha>`, wobei
   `<sha>` der Integrationscommit auf dem Kontroll-Branch ist.

## Nachweise und Delta-Prüfungen

Die nativen Anweisungen des Projekts können Stufen deklarieren, etwa die schnellen gemeinsamen Prüfungen und
für jede teure Prüfung ihren Befehl und ihre Pfadbereiche (Pfadpräfixe oder Git-Pathspecs). Behandle eine
teure Prüfung ohne Bereiche als überall betroffen. Ohne jede Deklaration führe die gemeinsamen Prüfungen nach
Schritt 3 aus und überspringe keine.

- **Gleicher Tree:** Entspricht der Tree des `probe`-Ergebnisses (bei einem Fast-Forward der Tree des
  Branches) dem `tree` eines grünen (`exit: 0`) Eintrags in den `checks` der Übergabe und zeigt `slot results
  --tree <tree>` einen passenden Eintrag (oder besteht der vom Projekt genannte Pfad des Eintrags die
  Tree-Prüfung des Projekts), übernimm den Nachweis ohne neuen Lauf. Ohne CI darfst du dann landen. Bei
  grüner CI auf demselben Head lass die lokale `slot --priority`-Prüfung weg.
- **Anderer Tree:** Führe die schnellen gemeinsamen Prüfungen vollständig aus, über `slot` nach der Regel in
  [Einen Task ausführen](playbook-task-execution.md). Führe eine teure
  Prüfung nur aus, wenn `git diff --name-only <Merge-Base von Task-Branch und Basis> <aktuelle Basis>` einen
  ihrer Pfadbereiche berührt. Nimm nach einem selbst gelösten Konflikt die Merge-Base von vor deinem Merge.
  Protokolliere jede übersprungene Prüfung mit `<run> log --type skipped --task <id> --text "<Prüfung und
  Grund>"`.
- **Schlussprüfung:** Führe nach `end` einmal über `slot` auf dem Endstand jede teure Prüfung aus, die in
  diesem Lauf mindestens einmal übersprungen wurde, und jede Prüfung, die das Projekt für das Ende eines Laufs
  verlangt. Suche diese von den nativen Anweisungen des Projekts aus dort, wo es seine Prüfungen beschreibt.
  Ein bestimmter Dateiname ist nicht vorausgesetzt. Sind alle grün, hole einen Push nach, den Schritt 4 der
  Integration bis hierher aufschiebt. Ist eine rot, protokolliere jede rote mit `<run> log --type final
  --text "<Befehl>: <Befund in einem Satz>"`, pushe nicht und korrigiere nichts. Die Korrektur veranlasst der
  Supervisor. Lass bereits integrierte Tasks, wie sie sind.

Räume lokale Worktrees und Branches nach dem Worktree-Vertrag auf, mit dem Squash-Beleg der Landung als
Nachweis. Ist eine Merge-Queue aktiv, lösche den Remote-Branch nach dem Worktree-Vertrag, nachdem die Queue
gemergt hat.
