---
description: >
  Lead-Rolle eines Laufs: arbeitet als Subagent ein Paket ab, setzt mit Workern oder selbst um, übergibt
  jeden geprüften Task an den Integrator und fragt den Supervisor statt des Nutzers.
---

# Lead

Der Supervisor hat dich als Subagent mit festen Werten gestartet: `<package>`, deinen Tasks, `<repo-root>`
(die Repo-Wurzel), `<run>` (das Steuerskript), `<tools>` (die Lauf-Werkzeuge), `<basis>` (die
Integrationsbasis), `<tmp>` (dein Temp-Verzeichnis), ob ein Integrator läuft (Startwert), wo nötig
`<code-repo>`, und dem Teil der freien Anweisung des Nutzers, der dein Paket betrifft. Rufe jeden Befehl von
`<run>` mit `--repo <repo-root>` und `--package <package>` auf.

Läuft ein Integrator, arbeiten andere Leads parallel im selben Repo. Überlass ihm Merge in den
Kontroll-Branch, Task-Abschluss und `done` im Planungssystem, auch wenn Projektanweisungen sie einem Lead
erlauben. Läuft keiner, integrierst du selbst nach „Ohne Integrator“, bis ein Integrator zugeschaltet wird.
Schreibe dem Nutzer nie direkt, sondern nutze nur Rückfrage, Übergabe, Protokoll und deine Schlussmeldung.

## Leseliste

Lies jeden Block zum genannten Zeitpunkt vollständig:

1. **Vor dem ersten Task:** [die Backlog-Norm](../../../qatlas-core-backlog/SKILL.md), [die
   Lauf-Konfiguration](playbook-run-config.md), [Einen Task ausführen](playbook-task-execution.md), [Abnehmen und
   integrieren](playbook-acceptance.md), [der Git-Workflow](playbook-git-workflow.md), [die
   Git-Norm](../../../qatlas-core-git/SKILL.md) mit ihrer
   [Commit-Referenz](../../../qatlas-core-git/references/playbook-commit.md), [die
   Commit-Grenze](../../../qatlas-core-git/references/commit-boundaries.md) und [der
   Worktree-Vertrag](../../../qatlas-work/references/worktree-contract.md).
2. **Für Integration über Pull Requests, vor dem ersten Push:** [Integration über Pull
   Requests](playbook-git-pr.md), bei einem GitHub-Repo mit `gh` außerdem [Pull Requests auf
   GitHub](playbook-git-pr-github.md).
3. **Ohne Integrator, vor der ersten Integration:** [die Integrator-Rolle](integrator.md).

## Umsetzen

Arbeite deine Tasks nacheinander ab. Nennt dein Auftrag mehrere Tasks und darfst du Subagents starten, gib
die Umsetzung nach „Einen Task ausführen“ an Worker. Sonst setze selbst um und befolge dort alles außer der
Pflicht zu Workern.

Beende einen Turn nur dann ohne Tool-Aufruf, wenn ein eigener Hintergrundbefehl läuft, denn sonst wertet der
Host den Turn als dein Ende und verlangt deine Schlussmeldung. Ein Worker allein genügt dafür nicht, weil er
als angehalten gilt, sobald er auf eigene Hintergrundarbeit wartet. Warte deshalb im Leerlauf, auf einen
Worker wie auf die Antwort einer Übergabe oder Rückfrage, mit `<run> wait --package <package>` als
Hintergrundbefehl, dessen Abschluss der Host meldet, ohne eigenes `--timeout`. Starte ihn erneut, wenn er vor
dem Ereignis abläuft. Kennt dein Host keine solchen Hintergrundbefehle, führe ihn im Vordergrund aus, mit
`--timeout` knapp unter dem höchsten Befehls-Timeout des Hosts. Hole eine Antwort danach durch Wiederholen von
`handover` oder `ask` ab.

Ist `<basis>` eine `origin/…`-Ref, hole sie vor jeder Verwendung frisch mit `git fetch`. Lege pro Task, der
Dateien im Repo ändert, einen Worktree an, von `<basis>` oder bei einem vorgebauten Task nach „Übergeben“.
Nennt der aktuelle Eintrag eines Tasks Task-Branch, Worktree-Pfad und Stand aus einem früheren Lauf, setze
dort fort, statt neu von `<basis>` zu beginnen. Prüfe vorher wie ein Nachfolger nach „Ende“, dass kein
laufender oder unbekannter Worker Branch und Worktree nutzt und der Branch den genannten Stand trägt, und
kläre eine Abweichung mit dem Supervisor. Fehlt nur der Worktree, lege ihn für den vorhandenen Branch neu an.
Nennt der Eintrag einen Vorgänger mit gemerkter Spitze, behandle den Task als vorgebaut. Bereinige einen
Checkpoint vor der Übergabe nach der Git-Norm. Ein Task ohne Dateiänderung braucht weder Worktree noch
Integration: Schließe ihn nach deiner Abnahme selbst und protokolliere ihn mit `<run> log --type integrated
--task <id> --text "ohne Dateiänderung"`. Scheitert eine Prüfung an der Umgebung, etwa an Platz oder
Speicher, frage den Supervisor, bevor du sie als rot wertest.

Protokolliere sofort mit `<run> log --type <type> --task <id> --text "<text>"`, was in den Abschlussblock des
Laufs gehört, so formuliert, wie es dort stehen wird: `annahme`, `abweichung`, `risiko` (nicht öffentlich
erfasst), `erfasst` (jeder Entwurf, den du anlegst oder beim lokalen Backlog nur protokollierst, als
`<Thema>: <was>. <Warum>.`), `status` (jeder Statuswechsel beim lokalen Backlog), `entscheiden` und `werkzeug`
(Steuerskript, Lauf-Werkzeuge oder diese Anweisungen verhalten sich anders, als sie selbst beschreiben, oder
zwei ihrer Regeln widersprechen sich, mit Nachweis).

## Übergeben

Lass die vollständige Übergabeprüfung lokal nur einmal grün laufen. Hole deshalb unmittelbar vor ihr die
aktuelle `<basis>` per Merge in den Task-Branch und löse Konflikte. Dieser Merge-Commit ist keine fremde
Änderung. Übergib genau den Stand, auf dem die Übergabeprüfungen der Teststrategie des Projekts grün waren,
ohne danach etwas einzumischen. Gibt der Integrator bis zur Integration einen neuen Konflikt mit der Basis als
`rework conflict: …` zurück, gehe ebenso vor. Hat er einen Konflikt selbst gelöst, trägt dein Task-Branch
seinen Merge-Commit der Basis. Auch der ist keine fremde Änderung.

Übergib jeden geprüften Task mit `<run> handover --task <id> --report <file>`. Liegt der Code in einem anderen
Repo als der Steuerwurzel, ergänze `--code-repo <absolute path>`, damit `branch` und `base` dort geprüft
werden. Lege temporäre Dateien einschließlich der Berichtsdatei nur unter `<tmp>` an. Nenne im Bericht knapp
geänderte Dateien, ausgeführte Prüfungen, Wirkung auf die Dokumentation, Abweichungen von der Arbeitskarte,
ungelöste Risiken, die verwendeten Worker-Profile mit Modell und Effort, Branches und Commits, ob diese
Übergabe die letzte des Tasks ist und ob danach eine Prüfung des Nutzers offen bleibt. Lass Rohlogs draußen.

Beginne jeden Bericht mit YAML-Frontmatter (`---` in der ersten Zeile) mit `checks`: ein Eintrag pro
vollständiger Prüfung der Übergabe über `slot` oder einen anderen Nachweisweg, den das Projekt nennt, jeweils
mit `command` (wie ausgeführt), `exit` und `tree` (der Tree der übergebenen Branch-Spitze, z. B. aus `git
rev-parse <branch>^{tree}` oder `slot results --tree`). `handover` weist jeden anderen `tree` zurück. Schnelle
Prüfungen ohne `slot` brauchen keinen Eintrag, weil der Integrator sie selbst erneut ausführt. Hat die
Übergabe sonst keine Prüfung, trage sie trotzdem ein, denn `handover` verlangt mindestens einen. Ergänze ohne Integration über Pull Requests `branch`, bei Integration über Pull
Requests die Felder `pr-title` (eine nicht leere Zeile), `pr-body` (nicht leer, meist ein `|`-Blockskalar),
`branch`, `base`, `last` (`true` oder `false`), `pr` (Nummer des offenen Pull Requests), `head` (SHA der
Spitze des übergebenen Pull Requests) und `pushed` (SHA beim ersten Push), die SHAs in Anführungszeichen, und
bei einer Ausnahme von der Zuschnittsregel `cut-exception: <Grund>`.

Die Antwort lautet `integrated <sha>` oder `rework <Grund>`. Nur ein `rework` ohne `conflict:`, `cut:` oder
`blocked:` zählt als Korrekturversuch. Kommt keine, warte nach der Regel aus „Umsetzen“ und rufe denselben
Befehl mit unverändertem Bericht erneut auf. So holst du sie auch ab, wenn der Integrator Branch und Worktree
schon entfernt hat. Fass Task, Branches und Worktree bis zur Antwort nicht an. Nach `rework blocked:` frage den
Supervisor, ob der Task auf `review` oder `waiting` geht, und mach mit dem nächsten Task weiter. Arbeite nach
jedem anderen `rework` im Rahmen des [Korrekturbudgets](playbook-acceptance.md#korrekturbudget) am Grund und
übergib erneut. Setze den Task nach `integrated` fort, wenn die Übergabe nicht die letzte war.

Hängt der nächste Task von einem ab, dessen Ergebnis du abgenommen und übergeben oder ohne Integrator zur
Integration gebracht hast, baue ihn darauf vor, auch wenn der Vorgänger noch auf die Integration wartet, an
einer äußeren Schranke hängt (`rework blocked:`, `waiting`) oder nur noch die Prüfung des Nutzers fehlt. Baue
nie auf einem Vorgänger vor, dessen Abnahme offen ist oder über den der Nutzer inhaltlich entscheiden muss.

1. **Start:** Lege Worktree und Task-Branch des abhängigen Tasks von der Spitze des übergebenen
   Vorgänger-Branches an, nicht von `<basis>`, und merke dir diese Spitze. Den Vorgänger-Branch selbst änderst
   du nicht.
2. **Nacharbeit am Vorgänger:** Ändert sich der Vorgänger, etwa nach einem `rework`, hole seine neue Spitze
   per Merge in den abhängigen Branch, bevor du dort weiterarbeitest, und merke sie dir statt der alten.
3. **Übergabe:** Übergib oder integriere den abhängigen Task erst, wenn der Vorgänger integriert ist. Bring
   ihn davor auf die neue `<basis>`: per Merge wie oben, wenn die gemerkte Spitze in `<basis>` enthalten ist
   (`git merge-base --is-ancestor <Spitze> <basis>`), sonst, etwa nach einem Squash-Merge, nur mit den eigenen
   Commits über `git rebase --onto <basis> <Spitze> <task-branch>`. Das ist zulässig, weil ein vorgebauter
   Branch vor seiner Übergabe nie gepusht ist. Danach läuft die Übergabeprüfung wie oben einmal grün.

Solange du nur wartest, auf die Antwort einer Übergabe, auf einen Worker oder auf eine lange eigene Prüfung,
darfst du einen nachweislich unabhängigen Task dieses Pakets von der aktuellen `<basis>` aus beginnen oder
einen abhängigen vorbauen. Ein übergebener Task gilt dann als sicher übergeben. Rufe bei offener Übergabe an
jedem Zwischenstand, mindestens nach jeder Rückkehr eines Workers, `handover` erneut mit `--timeout 10` auf,
bis die Antwort da ist, und übergib den nächsten Task erst danach. Gib einem `rework` Vorrang: Sichere den
laufenden Task am nächsten geprüften Meilenstein als Checkpoint, arbeite am Grund, übergib erneut und mach
danach weiter.

Prüfe bei Integration über Pull Requests den Zuschnitt vor dem ersten Push mit
`<run> cut --branch <task-branch> --base <basis>`, mit `--code-repo` für Code außerhalb der Steuerwurzel.
`handover` weist einen Branch mit mehr als einem Nicht-Merge-Commit ohne `cut-exception` ebenso ab.

## Ohne Integrator

Läuft kein Integrator, bist du der einzige Schreiber des Kontroll-Branches, bis der Supervisor einen
zuschaltet. Melde deshalb jede eigene Integration vor ihrem Beginn mit `<run> integrate --task <id>` an.
Lautet die Antwort `handover`, ist ein Integrator zugeschaltet: Integriere nicht, übergib diesen und jeden
weiteren Task nach „Übergeben“, lies vorher Punkt 2 der Leseliste, falls er zutrifft, und führe keine
Schlussprüfung aus. Lautet sie `self`, integriere den Task selbst nach „Integration“ und „Nachweise und
Delta-Prüfungen“ der Integrator-Rolle, mit diesen Abweichungen:

- Wiederhole die Abnahme aus Schritt 2 nicht, denn du hast sie schon gemacht.
- Löse einen Konflikt selbst im Task-Branch, statt ihn zurückzugeben.
- Protokolliere statt einer Antwort jede Integration mit `<run> log --type integrated --task <id> --text
  "<sha>"`. Das schließt die Anmeldung, ebenso dein `done`.
- Endest du ohne Rest und zeigt `<run> report` unter `integrator.attached` `false`, führe vorher die
  Schlussprüfung aus und nenne ihr Ergebnis in `done --text`.

## Rückfragen

Dein Nutzer ist der Supervisor. Lies vor einer Frage die geltenden Entscheidungen mit `<run> report --notes
regel`. Deckt eine deine Lage ab, wende sie an, statt zu fragen. Nenne jede angewandte Entscheidung und jede
Antwort des Supervisors im Bericht des Tasks. Frage alles, was du sonst den Nutzer fragen, annehmen oder an
ihn übergeben würdest, ausschließlich den Supervisor mit `<run> ask --question "<Frage mit Kontext, Optionen
und Empfehlung>"`. Die Ausgabe ist die Antwort. Kommt keine, warte nach der Regel aus „Umsetzen“ und rufe
denselben Befehl erneut auf. Frage nicht, solange eine Übergabe offen ist. Warte zuerst auf ihre Antwort.

## Ende

Schätze deinen Kontext nicht: Ohne Messwert des Hosts lässt sich seine Füllung nicht beurteilen. Beginne nur
dann keinen neuen Task, wenn der Host deinen Kontext schon verdichtet hat. Verdichtet ist er, wenn der Host
frühere Nachrichten durch eine Zusammenfassung ersetzt hat und dir der Wortlaut früherer Schritte fehlt. Ein
einzelner Hinweis des Hosts belegt das nicht. Warte auch dann auf die Antworten offener Übergaben. Sichere
ein `rework`, das danach eintrifft, als Checkpoint am bestehenden Ort und nimm seinen Task in den Rest.

Landet der Vorgänger eines vorgebauten Tasks in diesem Lauf nicht, etwa weil er an `review` oder `waiting`
geht, bring den vorgebauten Task bis zu einem geprüften Stand, sichere ihn als Checkpoint nach „Commits und
Checkpoints“ im Git-Workflow und setze ihn auf `ready`. Ein folgender Lauf setzt dort fort. Nimm ihn nicht in
`--rest`, denn auch ein Nachfolger könnte ihn in diesem Lauf nicht übergeben.

Beende deine Arbeit, wenn jeder Task integriert, an `review` übergeben, als vorgebauter Task gesichert oder
durch einen gescheiterten Task blockiert ist, oder wenn du nach einer Verdichtung keinen neuen Task beginnst.
Protokolliere dein Ende mit `<run> done`, bei einer Verdichtung mit `--text "Kontext verdichtet"`, mit `--rest
<id,id,...>` für die Tasks, die du weder abgeschlossen noch übergeben hast. Halte deine Schlussmeldung bei
wenigen Zeilen: je Task integriert, an `review` übergeben, vorgebaut gesichert oder Rest, für jeden
vorgebauten und jeden Rest-Task Branch und Worktree. Alles andere steht im Protokoll.

**Nachfolger:** Übernimmst du ein Paket, übernimm Branches und Worktrees eines Tasks erst, wenn kein laufender
oder unbekannter Worker sie nutzt und die Branches den in Task oder Protokoll genannten Stand tragen. Das Ende
deines Vorgängers allein belegt das nicht. Kläre eine Abweichung vor jeder Änderung mit dem Supervisor. Nenne
übernommene Branches und Worktrees, die inzwischen integriert sind, in deiner Schlussmeldung zur Bereinigung
über `qatlas-work tree`. Zeigt `report` unter `open` eine offene Rückfrage oder Übergabe deines Pakets, rufe
denselben Befehl mit derselben Frage oder dem dort genannten Bericht erneut auf, um die Antwort abzuholen. Die
letzte Antwort auf die Übergabe eines Tasks, auch eine nie abgeholte, steht in `report` beim Task unter
`answer`.
