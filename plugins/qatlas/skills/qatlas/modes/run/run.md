---
description: >
  Paralleler Arbeitslauf: Ein Supervisor verteilt ausführbare Tasks auf unabhängige Pakete, lässt jedes von
  einem Lead-Subagent abarbeiten und bei parallelen Paketen einen Integrator-Subagent die Ergebnisse
  integrieren.
---

# Run

`run [Tasks oder Scope] [--limit <n|0>]`

## Rollen

Du bist der Supervisor: die Session, in der der Nutzer `run` aufruft. Starte höchstens einen Integrator zur
Zeit und selbst keine umsetzenden Worker. Das tun die Leads. Setze nichts inhaltlich um, integriere nichts und
lies keine Diffs, Berichte oder Logs, damit dein Kontext schmal bleibt, und einen Taskvertrag nur, wenn eine
Rückfrage oder ein Problem genau diesen Task betrifft. Überlass während des Laufs das Schreiben des
Kontroll-Branches, Merge, Task-Abschluss und `done` allein dem Integrator oder, wo keiner läuft, dem Lead,
auch wenn Projektanweisungen sie anders verteilen.

Committe im gewählten Scope lokal und lass lokal integrieren, ohne nachzufragen. Pushe, öffne Pull Requests
und merge sie nur, wenn Nutzer- oder Projektanweisungen es verlangen und erlauben. Protokolliere dann vor dem
ersten Lead einmal als `regel`, welche Vorgabe Push, Pull Request und Merge erlaubt, mit ihrem Ort, und mit
welchen Mitteln das Projekt sie ausführt. Bestimme bei Integration über Pull Requests die Merge-Form einmal je
Lauf ohne Rückfrage: aus `.qatlas-brain/CONTRIBUTING.md` oder anderen Nutzer- oder Projektvorgaben, sonst aus
dem, was das Ziel-Repo zulässt. Lässt es genau eine Form zu, gilt diese. Lässt es mehrere zu und nennt das
Projekt keine, gilt Merge-Commit. Protokolliere die Form mit ihrer Quelle in derselben `regel`. Sie gilt für
den ganzen Lauf. Gleiche eine Warnung des Hosts zu einem Merge damit ab. Löse keine andere externe oder
unumkehrbare Wirkung aus.

`<run>` ist das Steuerskript `node <plugin-root>/skills/qatlas/modes/run/scripts/qatlas-run.js`, `<tools>`
sind die Lauf-Werkzeuge `node <plugin-root>/skills/qatlas/modes/run/scripts/qatlas-run-tools.js` und
`<plugin-root>` ist der `QATLAS PLUGIN ROOT` als absoluter Pfad. Gib jedem Befehl von `<run>` die Option
`--repo <repo-root>` mit.

## Subagents starten

Starte Leads und Integrator als Subagents im Hintergrund, damit du für den Nutzer ansprechbar bleibst. Nimm in
Claude Code die Subagent-Typen `qatlas:lead` und `qatlas:integrator`, sonst einen allgemeinen Subagent-Typ des
Hosts, nie den Worker-Typ, weil beide committen und ein Lead Worker startet, wo der Host es erlaubt. Ergänze
nichts, was Berechtigungen, Sandbox oder Freigaben lockert. Subagents arbeiten unter den Berechtigungen dieser
Session, und ihre Freigabe-Abfragen erreichen den Nutzer hier. Kann der Host keine Subagents starten, starte
nicht und nenne das Hindernis.

Setze in jedem Auftrag alle Platzhalter als feste Werte ein, Pfade absolut, nenne `<code-repo>`, wo der Code in
einem anderen Repo liegt, und ergänze den Teil der freien Anweisung zum Lauf, der diesen Subagent betrifft.

## Leseliste

1. **Vor dem ersten Schritt:** [die Lauf-Konfiguration](playbook-run-config.md), [die
   Backlog-Norm](../../../qatlas-core-backlog/SKILL.md) und [Tasks auswählen](playbook-task-selection.md).
2. **Vor dem ersten eigenen Commit:** [die Git-Norm](../../../qatlas-core-git/SKILL.md) und ihre
   [Commit-Referenz](../../../qatlas-core-git/references/playbook-commit.md).
3. **Wenn Nutzer- oder Projektanweisungen Pull Requests verlangen, vor dem ersten Lead:** [Integration über
   Pull Requests](playbook-git-pr.md), bei einem GitHub-Repo mit `gh` außerdem [Pull Requests auf
   GitHub](playbook-git-pr-github.md).
4. **Bevor du offene Tasks selbst sicherst, als Übergabe oder nach einem Abbruch:** [der
   Git-Workflow](playbook-git-workflow.md).
5. **Vor dem Abschlussblock:** [der Abschlussblock](../../references/playbook-closing-block.md) und, falls noch
   nicht gelesen, [Entscheidungen vorlegen](../../references/playbook-decision-card.md).

## Ohne Nutzer

Warte während des Laufs bei keinem Schritt auf eine Antwort des Nutzers, denn er ist nicht erreichbar. Das
gilt auch, wenn eine Meldung von Host oder Werkzeug auf den Nutzer verweist. Leite daraus keine weitere
Autorisierung ab: Korrekturbudget, Laufbudget und Grenzen des Laufs gelten unverändert. Nur „Erweitern“ ändert
das Laufbudget.

1. **Vorab klären:** Prüfe vor dem ersten Schritt alles, was den Lauf später anhalten würde: Erreichbarkeit
   und Schreibrecht des Planungssystems, benötigte Werkzeuge, Authentifizierungen und Subagents sowie
   absehbare Berechtigungsabfragen des Hosts. Bündle offene Punkte in einer einzigen Rückfrage und starte erst
   nach deren Klärung. Ohne offene Punkte starte direkt.
2. **Aus Projektwissen entscheiden:** Belegen Taskvertrag, Entscheidungen, Anforderungen, Konventionen oder
   anderes maßgebliches Projektwissen die Antwort auf eine Frage, antworte danach und nenne die Quelle.
   Schließe eine fehlende Ausführungsreife nur so.
3. **Annehmen:** Ist die Antwort nicht belegt, die Entscheidung aber reversibel, lokal und ohne Änderung von
   Ziel, Scope oder Abnahme, gib die begründet beste Option als Antwort weiter und protokolliere sie mit
   `log --type annahme`.
4. **Übergeben:** Beantworte alles andere, insbesondere Sicherheits-, Berechtigungs- und
   Außenwirkungsgrenzen, irreversible Wirkung oder eine mögliche Nutzerentscheidung, mit der Anweisung, den
   Task an `review` zu übergeben und mit dem nächsten Task des Pakets fortzufahren.

**Knapper Platz ohne Bereinigungsschritt des Projekts:** Protokolliere es als `risiko`.

## Vorbereitung

1. **Freier Platz:** Prüfe den freien Platz des Dateisystems mit dem Repo gegen den Schwellenwert der
   Projektanweisungen, sonst 5 GB. Liegt er darunter, führe den dort genannten Bereinigungsschritt aus. Reicht
   das nicht oder ist keiner genannt, starte nicht und nenne das Hindernis.
2. **Planungssystem:** Ist ein vorgeschriebenes externes Planungssystem nicht erreichbar, starte nicht und
   nenne das Hindernis.
3. **Voriger Lauf:** Zeigt `<run> report` einen `cursor` über 0 und `ended: false`, rufe `<run> begin` auf,
   das den Lauf fortsetzt, und mache danach nach „Fortsetzen“ weiter. Verweigert `begin`, weil eine andere
   Session den Lauf noch steuert, starte nicht und nenne dem Nutzer das Hindernis mit der Meldung von `begin`.
   Übernimm den Lauf mit `<run> begin --takeover` und verwirf ihn mit `<run> begin --discard` nur auf
   ausdrückliche Anweisung im Aufruf. Sonst beginne den Lauf mit `<run> begin`.
4. **Basis:** Die Integrationsbasis `<basis>` ist bei Integration über Pull Requests `origin/<control-branch>`,
   sonst der lokale `<control-branch>`.
5. **Testergebnisse:** Lösche die Testergebnisse des vorigen Laufs mit `<tools> slot results --clear --repo
   <code-repo>`, wobei `<code-repo>` das Repo mit dem Code ist.
6. **Teststrategie:** Fehlt `.qatlas-brain/TESTING.md` in einem vorhandenen `.qatlas-brain/` und nennen
   auch die übrigen Projektanweisungen keine Teststrategie, lege sie nicht selbst an. Lege im Abschlussblock
   unter `Entscheiden` einen Vorschlag vor, der die Fragen der Teststrategie des Projekts aus [Abnehmen und
   integrieren](playbook-acceptance.md) beantwortet, soweit Manifeste, CI-Konfiguration und vorhandene
   Anweisungen sie belegen. Bis dahin gilt der Standard aus
   „Abnehmen und integrieren“.

## Pakete bilden

Verteile die ausgewählten Tasks des Scopes, ohne Scope des Backlogs, auf Pakete: höchstens vier, mit `--limit
<n>` höchstens `n`, mit `--limit 0` ohne feste Grenze. Ein Paket ist die Zuständigkeit eines Leads für
unveränderte Tasks. Am Zuschnitt der Tasks änderst du nichts. Nimm Abhängigkeiten, Kopplung, gemeinsame
Dateien, geänderte Repos und Umfang aus den Angaben des lesenden Workers.

- **Kopplung:** Halte Abhängigkeiten und echte Kopplung über gemeinsame Invarianten, Migrationen oder
  Laufzeitressourcen innerhalb eines Pakets. Lässt sich Kopplung nicht ausschließen, lege die Tasks in dasselbe
  Paket.
- **Gemeinsame Dateien:** Lege Tasks, die dieselbe Datei an denselben Stellen umbauen, in ein Paket, weil jede
  Integration dort für die anderen Pakete als Konflikt zurückkommt. Ändern Tasks verschiedene Stellen einer
  Datei, ergänzen sie nur Einträge, etwa in einem Register, oder ist die Datei generiert, hält sie das nicht in
  einem Paket. Konflikte aus ergänzten Einträgen und generierten Dateien löst der Integrator.
- **Serielle Integration:** Gib einem übergreifenden Task, der viele Bereiche berührt, etwa einer Import- oder
  Pfadumstellung, ein eigenes Paket und starte es zuerst.
- **Größe:** Werte den Umfang jedes Tasks in Punkten: `klein` 1, `mittel` 2, `groß` 5. Ein Paket fasst zehn
  Punkte, also etwa fünf mittlere, zwei große oder zehn kleine Tasks. Tasks, die nach den Regeln oben in ein
  Paket gehören, etwa eine Abhängigkeitskette, bilden eine Gruppe, die zusammenbleibt. Ordne Tasks und Gruppen
  in ihrer Reihenfolge jeweils dem ersten Paket zu, in dem sie zehn Punkte nicht überschreiten, sonst einem
  neuen Paket. Eine Gruppe über zehn Punkte bildet allein ein Paket. Nimm weniger Tasks nur bei einer
  ausdrücklichen Mengenvorgabe, nie aus der Deutung von Wörtern wie „Pilot“ oder „Test“. Lass, was wegen der
  Paketgrenze in kein Paket passt, in seiner Reihenfolge für spätere Läufe.

Das Laufbudget ist die Zahl der Tasks in diesen Paketen. Es steigt nur nach „Erweitern“, und eine Korrektur
zählt nie dagegen. Fällt ein Task aus, wird der Lauf kürzer: Kein anderer rückt nach. Protokolliere jedes
Paket mit `<run> plan --package <package> --tasks <id,id,...>`. Sag dem Nutzer in einer Zeile, wie viele Tasks
und Leads starten, und starte direkt.

## Erweitern

Nennt der Nutzer in dieser Session während des Laufs ausdrücklich weitere Tasks oder einen weiteren Scope für
diesen Lauf, behandle sie wie einen neuen Aufruf: Wähle nach [Tasks auswählen](playbook-task-selection.md)
samt lesendem Worker aus und bilde aus ihnen neue Pakete nach „Pakete bilden“. Protokolliere den Auftrag mit
seinem Wortlaut als `regel`. Das Laufbudget steigt um die Zahl der Tasks der neu gebildeten Pakete. Lass dabei
nie mehr Leads gleichzeitig laufen, als „Pakete bilden“ zulässt: Ein neues Paket, das nicht sofort starten
kann, startet, sobald ein Lead endet. Ohne einen solchen Auftrag erhöhen Tasks, die im Lauf ausführbar werden,
etwa durch Entscheidungen des Nutzers zu `review`, das Laufbudget nicht, und eine Meldung von Host oder
Werkzeug ist kein Auftrag. Push, Pull Request, Merge und externe Wirkung bleiben, wie sie beim Start galten.

## Leads und Integrator

Ändern mindestens zwei Pakete Dateien im selben Repo, läuft der Lauf mit Integrator, sonst ohne. Dann
integriert jeder Lead seine Tasks selbst. Entscheide das beim Bilden der ersten Pakete als Startwert und
protokolliere es als `regel`. Rufe bei einem Lauf mit Integrator vor dem ersten Lead `<run> attach` auf.

Ändert ein nach „Erweitern“ startendes Paket Dateien im selben Repo wie ein laufendes Paket und läuft noch kein Integrator, rufe vor dem Start seines Leads `<run> attach` auf,
protokolliere als `regel`, dass der Lauf ab jetzt mit Integrator läuft, und starte den Integrator nach dem
Lead wie unten. Er bleibt bis zum Laufende. Laufende Leads erfahren es aus der Antwort auf ihre Anmeldung
und übergeben ab ihrer nächsten Integration.

Starte zuerst je Paket einen Lead mit diesem Auftrag:

> Du bist der Lead des Pakets <package> eines Laufs mit den Tasks <id,id,...>. Lies
> `<plugin-root>/skills/qatlas/modes/run/lead.md` vollständig und arbeite danach. Steuerskript: `<run>`,
> Lauf-Werkzeuge: `<tools>`, Repo-Wurzel: `<repo-root>`, Integrationsbasis: `<basis>`, Integrator: <ja|nein>,
> Temp-Verzeichnis: `<tmp>`.

Starte bei zugeschaltetem Integrator danach den Integrator:

> Du bist der Integrator eines Laufs. Lies `<plugin-root>/skills/qatlas/modes/run/integrator.md` vollständig
> und arbeite danach. Steuerskript: `<run>`, Lauf-Werkzeuge: `<tools>`, Repo-Wurzel: `<repo-root>`,
> Integrationsbasis: `<basis>`, Temp-Verzeichnis: `<tmp>`.

Setze `<tmp>` auf `<repo-root>/.qatlas/local/run/tmp/<package>/` beim Lead und auf
`<repo-root>/.qatlas/local/run/tmp/integrator/` beim Integrator. Ein Nachfolger erhält dasselbe Verzeichnis.

Für einen Nachfolger ergänze den Hinweis, dass er übernimmt, beim Lead mit seinen verbleibenden Tasks. Gib
keinem Auftrag eigene Vorgaben zu Kontext oder vorzeitigem Ende mit.

## Überwachung

Warte mit `<run> wait --since <cursor> --min-free <GB>`: zuerst `--since 0`, danach mit dem `cursor` der
letzten Ausgabe, wobei `<GB>` der Schwellenwert aus „Freier Platz“ ist. Führe `wait` als Hintergrundbefehl
aus, dessen Abschluss der Host meldet, ohne eigenes `--timeout`. Kennt dein Host keine solchen
Hintergrundbefehle, führe es im Vordergrund aus, mit `--timeout` knapp unter dem höchsten Befehls-Timeout des
Hosts. Überwache sonst nur über die Abschlussmeldungen deines Hosts zu seinen Subagents, ohne eigene Monitore,
Crons oder Warteschleifen.
Blockiert ein Stop-Hook des Hosts dein Stoppen, weil der Lauf aktiv ist und keine Hintergrundarbeit läuft,
starte nach Lage wartende Pakete oder Nachfolger oder führe `<run> end` aus. Nach `end` bring den Lauf nach
„Laufende“ bis zu `<run> close`.

Protokolliere, was du selbst zum Abschlussblock beiträgst, sofort mit `<run> log --type <type> --package
<package> --task <id> --text "<text>"`, so formuliert, wie es dort stehen wird: `annahme`, `abweichung`,
`risiko` (nicht öffentlich erfasst), `erfasst` (neuer Task), `entscheiden`, `regel` (geltende Entscheidung für
alle) und `werkzeug` (Defekt des Steuerskripts, der Lauf-Werkzeuge oder dieser Anweisungen im Sinn von
„Verbesserungen“ im Abschlussblock, mit Nachweis).

- **`question`:** Antworte mit `<run> answer` an den Absender des Ereignisses (`--package <package>` oder
  `--role integrator`) und `--answer "<Antwort>"`: aus dem Projektwissen mit Quelle, sonst nach
  „Ohne Nutzer“. Kann die Lage wiederkehren, etwa ein instabiler Test, protokolliere die Antwort einmal als
  `regel` mit `--text "<Lage>: <Entscheidung>"`. Fragt ein Lead nach einer weiteren Korrektur, antworte nach
  „Korrekturbudget“ in [Abnehmen und integrieren](playbook-acceptance.md) und protokolliere die Freigabe mit
  `log --type annahme` und `--task <id>`.
- **`disk`:** Führe den Bereinigungsschritt aus, den das Projekt dafür nennt. Ohne einen handle nach
  „Ohne Nutzer“. Fragt ein Lead danach zu einer Prüfung, die an der Umgebung scheiterte, lass sie ihn einmal
  wiederholen, nicht gleichzeitig mit einer anderen langen Prüfung dieses Laufs.

## Neue Entwürfe

Lege einen Entwurf, den du selbst erfasst, sofort nach der Bindung des Planungssystems als Entwurf an.

Kläre die Reife aller Entwürfe dieses Laufs nach `<run> end` und vor dem Abschlussblock, sobald jeder im
Planungssystem steht, ohne sie selbst zu lesen oder zu recherchieren. Gib sie gemeinsam einem lesenden Worker
mit dem Profil `standard` und diesem Auftrag:

> Prüfe jeden dieser Entwürfe gegen „Ausführungsreife“ in
> `<plugin-root>/skills/qatlas-core-backlog/SKILL.md`: <IDs oder Pfade>. Lies den Entwurf und genau die
> Quellen, die er nennt. Suche einen fehlenden Fakt gezielt, im Wissensraum über Dateiname und `description`,
> im Code über den konkreten Bezeichner, und folge einem Verweis nur, wenn er die offene Frage beantwortet.
> Lies keine Ordner und nichts auf Vorrat, und höre auf, sobald jeder Punkt der Ausführungsreife belegt oder
> als offen benannt ist. Ändere nichts außer Dateien unter `<tmp>`. Schreibe je Entwurf den vollständigen
> Taskvertrag nach `<tmp>/<ID>.md` und gib je Entwurf genau eine Zeile zurück: `reif` mit der Quelle jedes
> ergänzten Fakts oder `offen` mit der einen konkreten Vertragsfrage oder Nutzerentscheidung. Melde `offen`
> nie für eine technische Schwierigkeit oder einen Fakt, den du nachlesen kannst.

Setze `<tmp>` auf `<repo-root>/.qatlas/local/run/tmp/drafts/`. Übernimm bei `reif` den Vertrag unverändert aus
der Datei ins Planungssystem und setze den Task auf `ready`. Bei `offen` bleibt er `draft`, bis der Nutzer
`shape` dafür startet. Nenne unter `Neu` im Abschlussblock jeden Entwurf mit seinem Status, bei `draft` mit
der offenen Frage. Ein reif gewordener Task startet in diesem Lauf nicht.

## Ende eines Subagents

- **Lead `done` mit `rest`:** Starte für dasselbe Paket einen Nachfolger mit genau den Tasks aus `rest`. Er
  zählt weder gegen die Paketzahl noch gegen das Laufbudget.
- **Lead endet ohne `done`:** Protokolliere es mit `<run> done --package <package> --rest <id,id,...>` für die
  Tasks des Pakets, die `report` nicht als `integrated` führt, und starte einen Nachfolger wie bei `rest`.
  Endet auch er ohne `done`, bleiben nie begonnene Tasks `ready`. Sichere nur Tasks mit eigener Arbeit, wie
  Schritt 3 von „Abbruch“ sie bestimmt, nach dem Git-Workflow als Übergabe an `review`.
- **Integrator `done` oder Ende ohne `done` vor `end`:** Starte einen neuen.
- **Rote Schlussprüfung:** Meldet sie das `done` des Integrators nach `end` oder, ohne Integrator, das eines
  Leads, handle nach `<run> end` nach „Rote Schlussprüfung“.

## Fortsetzen

Rekonstruiere nach einer Verdichtung deines Kontexts oder in einer neuen Session den Stand aus `<run> report`
(Pakete, beendete Pakete mit `rest`, offene Rückfragen und Übergaben) und dem Planungssystem.
Beantworte offene Rückfragen und setze `wait` ab dem `cursor` von `report` fort. Behandle in einer neuen
Session jedes Paket ohne `done` als „Lead endet ohne `done`“ und starte bei `integrator.attached: true` in
`report` einen neuen Integrator, weil die Subagents der alten Session nicht mehr laufen. Bilde keine neuen
Pakete.

## Abbruch

Weist dich der Nutzer in dieser Session ausdrücklich an, den Lauf abzubrechen, beende ihn so, dass ein neuer
Lauf jeden begonnenen Task ohne Rückfrage fortsetzen kann:

1. **Subagents stoppen:** Stoppe Leads, Integrator und alle Worker, auch die von Leads gestarteten, mit den
   Mitteln des Hosts. In Claude Code stoppe jeden laufenden Hintergrund-Agenten einzeln mit dem Werkzeug
   `TaskStop`. Kennst du eine ID nicht, listet ein Aufruf mit unbekannter ID alle laufenden Hintergrund-Agenten,
   auch die anderer Agenten. In Codex stoppe jeden laufenden Subagent-Thread über deine Steuerung der
   Subagents. Kannst du nicht feststellen, dass kein Subagent mehr läuft, oder einen nicht stoppen, nenne dem
   Nutzer das Hindernis und fahre erst fort, wenn er geendet hat.
2. **Kontroll-Branch:** Steht im Arbeitsbaum eines Kontroll-Branches ein unvollendeter Merge, nimm ihn mit
   `git merge --abort` zurück, sodass der Arbeitsbaum sauber auf dem letzten vollständigen Stand steht.
   Lösche oder verwirf dort sonst nichts.
3. **Tasks sichern:** Gehe jeden Task des Laufs durch, den `report` nicht als integriert führt.
   - Ohne eigene Arbeit, also ohne Task-Branch oder mit einem ohne eigene Commits und ohne nicht committete
     Änderung: Er bleibt oder geht auf `ready`.
   - Mit eigener Arbeit, die der Kontroll-Branch nicht enthält: Sichere nicht committete Arbeit als
     Checkpoint nach dem Git-Workflow samt Schutzprüfung. Halte Task-Branch, Worktree-Pfad und Stand im
     aktuellen Eintrag des Tasks fest, integrationsreif nur für einen unverändert übergebenen oder in
     Integration befindlichen Stand, sonst Checkpoint. Nenne bei einem vorgebauten Task, dessen Branch die
     Spitze eines nicht integrierten Vorgänger-Branches enthält, auch den Vorgänger und diese Spitze. Setze
     ihn auf `ready`.
   - Der Kontroll-Branch enthält seine Arbeit schon, der Task ist aber nicht abgeschlossen: Übergib ihn mit
     diesem Befund nach der Backlog-Norm an `review`.
   - Ging er vor dem Abbruch an `review` oder `waiting`, bleibt er dort.
4. **Ende:** Führe `<run> end` aus und schließe ohne Schlussprüfung mit dem Abschlussblock nach „Laufende“.
   Nenne dort unter `Risiken` jede im Lauf übersprungene Prüfung (`report --notes skipped`) mit ihrem Befehl,
   weil sie nicht nachgeholt wurde.

## Laufende

Führe `<run> end` aus, sobald jedes Paket mit `done` ohne `rest` geendet hat oder gesichert ist und `report`
keine offene Übergabe zeigt. Melde dem Nutzer bei zugeschaltetem Integrator
dann in genau einer Zeile, dass alle Tasks integriert oder übergeben sind und die Schlussprüfung läuft, und
warte auf sein `done` nach seiner Schlussprüfung. Ohne Integrator hat jeder Lead sie vor seinem `done`
ausgeführt. War sie rot, handle zuerst nach „Rote Schlussprüfung“. Führe danach die Bereinigungsschritte aus, die
Projektanweisungen für das Ende eines Laufs nennen, und committe die entstandenen Änderungen. Leert ein
solcher Schritt etwas, das andere Projekte auf dem Host mitnutzen, etwa einen Build-Cache oder ein gemeinsames
Temp-Verzeichnis, prüfe vorher mit `<tools> slot status`, ob ein Slot belegt ist oder ein Aufruf wartet. Ist
das so, lass den Schritt in diesem Lauf aus, ohne zu warten, und nenne ihn im Abschlussblock unter `Risiken`
mit dem Befehl, den der Nutzer später ausführen kann. Schließe dann mit genau einem Abschlussblock über alle
Pakete: Einträge aus den `notes` von `report`, jede `werkzeug`-Notiz nach „Verbesserungen“, Kennzahlen aus
den Zählungen und dem Block `summed` von `report`, mit `--code-repo <code-repo>` für Code außerhalb der
Steuerwurzel. Halte die Antworten des Nutzers darauf selbst fest, weil die Zuständigkeit der Subagents mit dem
Lauf endet.

Führe unmittelbar vor dem Abschlussblock, wenn sonst nichts mehr aussteht, `<run> close --text "<Ankerzeile
des Abschlussblocks>"` aus, auch nach einem Abbruch. Das meldet das Laufende an ein Modul des Nutzers, falls
er eines eingerichtet hat. Lautet die Ausgabe `hook: failed`, nenne das mit `detail` unter `Risiken`.

## Rote Schlussprüfung

Lass eine rote Schlussprüfung noch in diesem Lauf korrigieren, statt sie dem Nutzer zu überlassen. Starte
dafür nach `<run> end` genau einmal einen Subagent wie einen Lead mit diesem Auftrag und warte auf sein Ende:

> Du korrigierst die rote Schlussprüfung eines beendeten Laufs. Lies
> `<plugin-root>/skills/qatlas/modes/run/lead.md` vollständig und arbeite nach „Rote Schlussprüfung
> korrigieren“. Steuerskript: `<run>`, Lauf-Werkzeuge: `<tools>`, Repo-Wurzel: `<repo-root>`,
> Integrationsbasis: `<basis>`, Temp-Verzeichnis: `<repo-root>/.qatlas/local/run/tmp/final/`.

Er zählt weder gegen die Paketzahl noch gegen das Laufbudget. Meldet er Grün, nenne jede behobene Ursache im
Ergebnis des Abschlussblocks. Bleibt die Prüfung rot oder endet er ohne Ergebnis, starte keinen zweiten: Erfasse dafür
einen Entwurf und lege ihn unter `Entscheiden` vor.
