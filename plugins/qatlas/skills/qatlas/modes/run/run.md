---
description: >
  Paralleler Arbeitslauf: Ein Supervisor verteilt ausführbare Tasks auf unabhängige Pakete, lässt jedes von
  einem Lead-Subagent abarbeiten und einen Integrator-Subagent die Ergebnisse integrieren.
---

# Run

`run [Tasks oder Scope] [--limit <n|0>]`

## Rollen

Du bist der Supervisor: die Session, in der der Nutzer `run` aufruft. Starte genau einen Integrator zur Zeit
und selbst keine umsetzenden Worker; das tun die Leads. Setze nichts inhaltlich um, integriere nichts und lies
keine Diffs, Berichte oder Logs, damit dein Kontext schmal bleibt, und einen Taskvertrag nur, wenn eine
Rückfrage oder ein Problem genau diesen Task betrifft. Überlass während des Laufs das Schreiben des
Kontroll-Branches allein dem Integrator, ebenso Merge, Task-Abschluss und `done`, auch wenn Projektanweisungen
diese einem Lead erlauben.

Committe im gewählten Scope lokal und lass lokal integrieren, ohne nachzufragen. Pushe, öffne Pull Requests
und merge sie nur, wenn Nutzer- oder Projektanweisungen es verlangen und erlauben. Protokolliere dann vor dem
ersten Lead einmal als `regel`, welche Vorgabe Push, Pull Request und Merge erlaubt, mit ihrem Ort, und mit
welchen Mitteln das Projekt sie ausführt; gleiche eine Warnung des Hosts zu einem Merge damit ab. Löse keine
andere externe oder unumkehrbare Wirkung aus. Schreibe bei einem lokalen Backlog nur vor dem ersten Lead und
nach dem Ende des Integrators hinein; was du dazwischen schriebst, etwa einen Statuswechsel oder eine
festgehaltene Antwort, protokolliere mit `log --type status`.

`<run>` ist das Steuerskript `node <plugin-root>/skills/qatlas/modes/run/scripts/qatlas-run.js`, `<tools>`
sind die Lauf-Werkzeuge `node <plugin-root>/skills/qatlas/modes/run/scripts/qatlas-run-tools.js` und
`<plugin-root>` ist der `QATLAS PLUGIN ROOT` als absoluter Pfad. Gib jedem Befehl von `<run>` die Option
`--repo <repo-root>` mit.

## Subagents starten

Starte Leads und Integrator als Subagents im Hintergrund, damit du für den Nutzer ansprechbar bleibst, mit
einem allgemeinen Subagent-Typ des Hosts, nicht mit `qatlas:worker`, weil beide committen und ein Lead Worker
startet, wo der Host es erlaubt. Ergänze nichts, was Berechtigungen, Sandbox oder Freigaben lockert;
Subagents arbeiten unter den Berechtigungen dieser Session, und ihre Freigabe-Abfragen erreichen den Nutzer
hier. Kann der Host keine Subagents starten, starte nicht und nenne das Hindernis.

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
4. **Bevor du offene Tasks selbst als Übergabe sicherst:** [der Git-Workflow](playbook-git-workflow.md).
5. **Vor dem Abschlussblock:** [der Abschlussblock](../../references/playbook-closing-block.md) und, falls noch
   nicht gelesen, [Entscheidungen vorlegen](../../references/playbook-decision-card.md).

## Ohne Nutzer

Warte während des Laufs bei keinem Schritt auf eine Antwort des Nutzers; er ist nicht erreichbar. Das gilt
auch, wenn eine Meldung von Host oder Werkzeug auf den Nutzer verweist. Leite daraus keine weitere
Autorisierung ab: Korrekturbudget, Laufbudget und Grenzen des Laufs gelten unverändert.

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
   Projektanweisungen, sonst 5 GB. Liegt er darunter, führe den dort genannten Bereinigungsschritt aus; reicht
   das nicht oder ist keiner genannt, starte nicht und nenne das Hindernis.
2. **Planungssystem:** Ist ein vorgeschriebenes externes Planungssystem nicht erreichbar, starte nicht und
   nenne das Hindernis.
3. **Voriger Lauf:** Zeigt `<run> report` einen `cursor` über 0 und `ended: false`, rufe `<run> begin` auf,
   das den Lauf fortsetzt, und mache danach nach „Fortsetzen“ weiter. Verwirf den vorigen Lauf mit
   `<run> begin --discard` nur auf ausdrückliche Anweisung im Aufruf. Sonst beginne den Lauf mit `<run> begin`.
4. **Basis:** Die Integrationsbasis `<basis>` ist bei Integration über Pull Requests `origin/<control-branch>`,
   sonst der lokale `<control-branch>`.
5. **Testergebnisse:** Lösche die Testergebnisse des vorigen Laufs mit `<tools> slot results --clear --repo
   <code-repo>`; `<code-repo>` ist das Repo mit dem Code.
6. **Teststrategie:** Fehlt `.qatlas-project/TESTING.md` in einem vorhandenen `.qatlas-project/`, lege sie
   nicht selbst an. Lege im Abschlussblock unter `Entscheiden` einen Vorschlag vor, der die Fragen der
   Teststrategie des Projekts aus [Abnehmen und integrieren](playbook-acceptance.md) beantwortet, soweit
   Manifeste, CI-Konfiguration und vorhandene Anweisungen sie belegen. Bis dahin gilt der Standard aus
   „Abnehmen und integrieren“.

## Pakete bilden

Verteile die ausgewählten Tasks des Scopes, ohne Scope des Backlogs, auf so viele Pakete, wie es unabhängige
Bereiche gibt: höchstens vier, mit `--limit <n>` höchstens `n`, mit `--limit 0` ohne feste Grenze. Ein Paket
ist die Zuständigkeit eines Leads für unveränderte Tasks; am Zuschnitt der Tasks änderst du nichts. Nimm
Abhängigkeiten, Kopplung, gemeinsame Dateien und Umfang aus den Angaben des lesenden Workers.

- **Kopplung:** Halte Abhängigkeiten und echte Kopplung über gemeinsame Invarianten, Migrationen oder
  Laufzeitressourcen innerhalb eines Pakets; lässt sich Kopplung nicht ausschließen, lege die Tasks in dasselbe
  Paket.
- **Gemeinsame Dateien:** Lege Tasks, die dieselbe zentrale Datei ändern, etwa ein Register, eine gemeinsame
  Testdatei oder dieselbe Dokumentation, in ein Paket, weil jede Integration dort für die anderen Pakete als
  Konflikt zurückkommt. Lass Pakete nur mechanisch geteilte Dateien gemeinsam nutzen, und nur, wo es sich
  nicht vermeiden lässt.
- **Serielle Integration:** Ergänze ein Paket aus einer reinen Abhängigkeitskette um unabhängige Tasks, damit
  sein Lead weiterarbeitet, während er auf eine Integration wartet. Gib einem übergreifenden Task, der viele
  Bereiche berührt, etwa einer Import- oder Pfadumstellung, ein eigenes Paket und starte es zuerst.
- **Größe:** etwa fünf Tasks, genau so viele, wie ein Lead nach Umfang, Kopplung und absehbarem Kontextbedarf
  in einem Lauf tragen kann, ohne seinen Kontext zu überlasten: mehr bei sehr kleinen, weniger bei großen
  Tasks. Fülle jedes Paket bis zu dieser Größe. Nimm weniger Pakete oder Tasks nur bei einer ausdrücklichen Mengenvorgabe, nie aus der Deutung von
  Wörtern wie „Pilot“ oder „Test“. Lass, was in kein Paket passt, in seiner Reihenfolge für Nachfüllen und
  spätere Läufe.

Das Laufbudget ist die Summe der Paketgrößen zu Beginn; jeder abgeschlossene oder gesichert an `review`
übergebene Task verbraucht einen Slot. Protokolliere jedes Paket mit `<run> plan --budget <n> --package
<package> --tasks <id,id,...>` und gib jedem späteren `plan` dasselbe Laufbudget mit. Sag dem Nutzer in einer
Zeile, wie viele Tasks und Leads starten und wie hoch das Laufbudget ist, und starte direkt.

## Leads und Integrator

Starte zuerst je Paket einen Lead mit diesem Auftrag:

> Du bist der Lead des Pakets <package> eines Laufs mit den Tasks <id,id,...>. Lies
> `<plugin-root>/skills/qatlas/modes/run/lead.md` vollständig und arbeite danach. Steuerskript: `<run>`,
> Lauf-Werkzeuge: `<tools>`, Repo-Wurzel: `<repo-root>`, Integrationsbasis: `<basis>`.

Starte danach den Integrator:

> Du bist der Integrator eines Laufs. Lies `<plugin-root>/skills/qatlas/modes/run/integrator.md` vollständig
> und arbeite danach. Steuerskript: `<run>`, Lauf-Werkzeuge: `<tools>`, Repo-Wurzel: `<repo-root>`,
> Integrationsbasis: `<basis>`.

Für einen Nachfolger ergänze den Hinweis, dass er übernimmt, beim Lead mit seinen verbleibenden Tasks. Gib
keinem Auftrag eigene Vorgaben zu Kontext oder vorzeitigem Ende mit.

## Überwachung

Warte mit `<run> wait --since <cursor> --min-free <GB>`: zuerst `--since 0`, danach mit dem `cursor` der
letzten Ausgabe; `<GB>` ist der Schwellenwert aus „Freier Platz“. Führe `wait`, das bis zu seinem `--timeout`
blockiert, im Hintergrund oder mit einem Befehls-Timeout des Hosts darüber aus. Überwache sonst nur über die
Abschlussmeldungen deines Hosts zu seinen Subagents, ohne eigene Monitore, Crons oder Warteschleifen.
Blockiert ein Stop-Hook des Hosts dein Stoppen, weil der Lauf aktiv ist und keine Hintergrundarbeit läuft,
fülle nach Lage Pakete nach, starte Nachfolger oder führe `<run> end` aus.

Protokolliere, was du selbst zum Abschlussblock beiträgst, sofort mit `<run> log --type <type> --package
<package> --task <id> --text "<text>"`, so formuliert, wie es dort stehen wird: `annahme`, `abweichung`,
`risiko` (nicht öffentlich erfasst), `erfasst` (neuer Task), `entscheiden`, `regel` (geltende Entscheidung für
alle) und `werkzeug` (Defekt des Steuerskripts oder der Lauf-Werkzeuge, mit Nachweis).

- **`question`:** Antworte mit `<run> answer` an den Absender des Ereignisses (`--package <package>` oder
  `--role integrator`) und `--answer "<Antwort>"`: aus dem Projektwissen mit Quelle, sonst nach
  „Ohne Nutzer“. Kann die Lage wiederkehren, etwa ein instabiler Test, protokolliere die Antwort einmal als
  `regel` mit `--text "<Lage>: <Entscheidung>"`.
- **`disk`:** Führe den Bereinigungsschritt aus, den das Projekt dafür nennt; ohne einen handle nach
  „Ohne Nutzer“. Fragt ein Lead danach zu einer Prüfung, die an der Umgebung scheiterte, lass sie ihn einmal
  wiederholen, nicht gleichzeitig mit einer anderen langen Prüfung dieses Laufs.

## Neue Entwürfe

Lass jeden Entwurf dieses Laufs `draft`, bis der Nutzer `shape` dafür startet. Lege einen Entwurf, den du
selbst erfasst, bei einem externen Planungssystem sofort nach dessen Bindung als Entwurf an; beim lokalen
Backlog trage jeden Entwurf nach „Laufende“ ein.

## Ende eines Subagents

- **Lead `done` mit `rest`:** Starte für dasselbe Paket einen Nachfolger mit genau den Tasks aus `rest`; er
  zählt weder gegen die Paketzahl noch gegen das Laufbudget.
- **Lead endet ohne `done`:** Protokolliere es mit `<run> done --package <package> --rest <id,id,...>` für die
  Tasks des Pakets, die `report` nicht als `integrated` führt, und starte einen Nachfolger wie bei `rest`.
  Endet auch er ohne `done`, sichere die offenen Tasks nach dem Git-Workflow als Übergabe an `review`.
- **Integrator `done` oder Ende ohne `done` vor `end`:** Starte einen neuen.
- **Integrator `done` nach `end`:** Ist seine Schlussprüfung rot, erfasse dafür einen Entwurf.

**Nachfüllen:** Endet ein Paket und ist das Laufbudget nicht aufgebraucht, bilde aus den verbleibenden Tasks
ein neues, von allen laufenden unabhängiges Paket nach der Größenregel, höchstens so groß wie das Restbudget,
mit neuem Namen, protokolliere es mit `plan` und starte seinen Lead. Lass nie mehr Leads gleichzeitig laufen, als
„Pakete bilden“ zulässt.

## Fortsetzen

Rekonstruiere nach einer Verdichtung deines Kontexts oder in einer neuen Session den Stand aus `<run> report`
(Pakete, Laufbudget, beendete Pakete mit `rest`, offene Rückfragen und Übergaben) und dem Planungssystem.
Beantworte offene Rückfragen und setze `wait` ab dem `cursor` von `report` fort. Behandle in einer neuen
Session jedes Paket ohne `done` als „Lead endet ohne `done`“ und starte einen Integrator, weil die Subagents
der alten Session nicht mehr laufen. Bilde keine Pakete über das restliche Laufbudget hinaus.

## Laufende

Führe `<run> end` aus, sobald kein Nachfüllen mehr möglich ist, jedes Paket mit `done` ohne `rest` geendet hat
oder gesichert ist und `report` keine offene Übergabe zeigt. Warte dann auf das `done` des Integrators nach
seiner Schlussprüfung. Trage danach bei einem lokalen Backlog die protokollierten Statuswechsel und Entwürfe
ein (`status` und `erfasst` in den `notes` von `report`), führe die Bereinigungsschritte aus, die
Projektanweisungen für das Ende eines Laufs nennen, und committe die entstandenen Änderungen. Schließe dann
mit genau einem Abschlussblock über alle Pakete: Einträge aus den `notes` von `report`, jede `werkzeug`-Notiz
unter `Verbesserungen`, Kennzahlen aus den Zählungen von `report`. Halte die Antworten des Nutzers darauf
selbst fest, weil die Zuständigkeit des Integrators mit dem Lauf endet.
