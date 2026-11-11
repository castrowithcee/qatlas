---
description: >
  Taskergebnisse im Lauf selbst abnehmen, Fehlschläge einordnen, höchstens zwei Korrekturen zulassen, die
  Dokumentationswirkung klären und das Ergebnis integrieren.
---

# Abnehmen und integrieren

Nimm als Lead die Ergebnisse deiner Worker ab, bevor du einen Task übergibst. Nimm als Integrator jede
Übergabe unabhängig davon erneut ab und integriere sie.

## Abnahme prüfen

Werte eine Erfolgsmeldung des Umsetzers nicht als Beweis der Fertigstellung. Prüfe Ergebnis, Diff und
Nachweise selbst und über die Kriterien hinaus auch, ob das Ergebnis das Ziel des Tasks inhaltlich erfüllt.
Gleiche jede Abnahme und jede übergreifende Sicherheitsgrenze mit dem tatsächlichen Verhalten ab; grüne
Standardtests ersetzen weder ausdrücklich vereinbarte Randfälle noch einen Referenzvergleich. Prüfe
übergreifende Invarianten spätestens dann erneut, wenn alle Meilensteine integriert sind. Ordne jeden
Fehlschlag ein:

- **Ausführungsfehler:** Ein falscher Pfad, ein Tippfehler, Quoting oder ein ungeeignetes Flag hat die Lösung
  noch nicht getestet. Korrigiere den Aufruf einmal, gezielt. Tritt derselbe Fehler erneut auf, behandle ihn
  als fehlende Voraussetzung oder Lösungsfehler, nicht als unbegrenzte neue Runde.
- **Fehlende Voraussetzung:** Laufzeit, Tool, Berechtigung, Ressource oder Nutzereingabe fehlt. Starte kein
  Ersatzvorgehen. Sichere den Task sofort in `review` oder `waiting`.
- **Lösungsfehler:** Das Vorgehen wurde ausgeführt, erfüllt aber ein Abnahmekriterium nicht. Leite aus der
  Diagnose oder neuem Nachweis eine konkrete Korrektur ab.
- **Bekannter Flake:** Ein CI-Fehlschlag gilt nur dann als bekannter Flake und nicht als Lösungsfehler, wenn
  der fehlschlagende Test außerhalb des Diffs liegt und im Planungssystem als bekannter Flake mit Task-ID
  erfasst ist. Starte den fehlgeschlagenen Job dann höchstens einmal pro Pull Request neu und zähle den
  Wiederholungslauf im Abschluss. Ordne ein neues Auftreten dem bestehenden Task zu, statt es neu zu erfassen.
- **Neuer Flake:** Ein noch nicht erfasster CI-Fehlschlag gilt nur dann als neuer Flake, wenn (a) der
  fehlschlagende Test außerhalb des Diffs liegt, (b) er nur in einigen Jobs oder auf einigen Plattformen
  fehlschlägt, (c) die übrigen grün sind und (d) ein gezielter lokaler Lauf über `slot` grün ist. Erfasse
  ihn dann als Entwurf im Planungssystem, starte den fehlgeschlagenen Job höchstens einmal pro Pull Request
  neu, protokolliere den Wiederholungslauf mit der neuen Task-ID und den Entwurf als `erfasst`. Schlägt der
  Wiederholungslauf erneut fehl, behandle das als Lösungsfehler.

Behandle jeden anderen CI-Fehlschlag als Lösungsfehler. Nennt die Projektstrategie eine eigene Flake-Regel,
wende sie statt beider Flake-Regeln oben an; zähle auch dann Rot nie als Grün.

## Teststrategie des Projekts

Wie das Projekt testet, steht in `.qatlas-project/TESTING.md`; Qatlas legt nur den Nachweisvertrag fest.
Fehlt die Datei, folge den Voreinstellungen der Anweisungen. Halte in jedem Projekt diesen Vertrag ein:

- Integriere nur einen nachweislich geprüften Stand.
- Werte einen Nachweis nur für genau den Git-Tree, auf dem er entstand. Grünes CI auf dem übergebenen Head
  zählt, weil der Commit den Tree festlegt.
- Melde Rot nie als Grün und wiederhole keinen gültigen grünen Nachweis.
- Belege eine geteilte Ressource nie gleichzeitig mit anderen.
- Nutze `slot` als Standardweg für lokalen Nachweis.

Die Strategie beantwortet die Kernfragen zu `TESTING.md` aus [Reservierte Datei
füllen](../../../qatlas-core-filing/references/playbook-reserved-files.md) und für einen Lauf zusätzlich
diese:

1. Welche Pfadbereiche und welchen Zeitpunkt hat jede teure Prüfung?
2. Was zählt neben `slot` und CI als Nachweis, und wie prüft der Integrator ihn gegen den Tree? Ohne diese
   Prüfung wird nur `slot`-Nachweis übernommen.
3. Welche unversionierten Eingaben gehören in den Cache-Schlüssel (`slot --input <path>`), und wie lange
   bleibt ein Nachweis gültig (`slot --max-age <hours>`)?
4. Wie heißt die exklusive Ressource einer Prüfung, die etwas Unteilbares braucht (`slot --resource <name>`),
   und wie viele Test-Slots darf das Projekt nutzen (`slot --slots <count>`, höchstens die Zahl des Nutzers
   für den Host)? Slots gelten für den ganzen Host, exklusive Ressourcen je Repo.

## Höchstens zwei Korrekturen

Der erste Umsetzungsversuch zählt nicht als Korrektur, ebenso wenig seine geplante Fortsetzung nach einem
geprüften und gesicherten Meilenstein. Lass danach insgesamt höchstens zwei gezielte Korrekturversuche pro
Task zu, auch wenn mehrere Abnahmekriterien betroffen sind. Jede Korrektur braucht neuen Nachweis und eine
daraus abgeleitete Änderung; bloßes Umformulieren, ein anderer Subagent oder eine neue Session setzt den
Zähler nicht zurück.

Ist das Kriterium nach der zweiten Korrektur weiterhin nicht erfüllt:

1. Beende jede weitere Umsetzung dieses Tasks.
2. Sichere den aktuellen Diff, die belegte Ursache, die zwei geprüften Korrekturen und die weiterhin
   verletzte Abnahme kompakt im Task.
3. Setze den Task auf `review` und formuliere die konkrete Nutzerentscheidung zu Voraussetzung,
   Vorgehenswechsel, Scope oder Verschiebung.
4. Starte keinen Prüfer und keinen Ersatz-Subagent als verdeckte dritte Korrekturrunde.

Beginne keinen übrigen Task, der von diesem Ergebnis abhängt; lass nur nachweislich unabhängige Tasks
weiterlaufen.

## Dokumentationswirkung

Entscheide als Lead über die Dokumentationswirkung jedes Tasks und nimm nötige Änderungen vor der Übergabe in
den Task-Branch auf; prüfe sie als Integrator in der Abnahme. Der Aufruf von `run` gibt dafür nur
Projektdokumentation mit `edit: shared` frei. Ändere keine Datei mit `edit: locked`, sondern lege eine nötige
Änderung daran als Entscheidung vor: Hängt die Abnahme des Tasks an ihr, übergib ihn an `review`, sonst
protokolliere sie als `entscheiden`, damit sie im Abschlussblock unter `Entscheiden` steht. Dabei gilt:

- Dokumentiere nur Aussagen, die ein künftiger Maintainer kennen muss, um eine Anforderung zu erfüllen oder
  eine falsche Entscheidung zu vermeiden. Beschreibe keine Details, die Code und Tests ohne relevante
  Fehlentscheidung ohnehin zeigen, und wiederhole weder Taskhistorie, Abschlussbericht noch bestehende
  Regeln. Ohne eine solche Aussage aktualisiere keine Projektdokumentation.
- Korrigiere unmittelbar betroffene Dokumentation, die die Umsetzung falsch gemacht hat, am bestehenden
  maßgeblichen Ort mit der kleinsten nötigen Änderung und prüfe sie erneut.
- Führt die Umsetzung eine übergreifende Verpflichtung für künftige Arbeit im Scope ein oder legt sie eine
  verborgene Kopplung offen, die solche Arbeit binden muss, halte das in der bestehenden
  Projektdokumentation mit der kleinsten nötigen Aussage fest, vorzugsweise bei den betroffenen
  Entscheidungen, Anforderungen oder dem Domänenwissen in `.qatlas-project/`. Behandle die Aussage dann als
  geänderte maßgebliche Grundlage; ein Abschlussbericht allein genügt dafür nicht.
- Widerspricht maßgebliche inhaltliche Dokumentation dem beabsichtigten Ergebnis und könnte sie eine
  Nutzerentscheidung ausdrücken, setze den Task auf `review`, statt eine Seite stillschweigend zu
  überschreiben.
- Ändere inhaltlich unbeteiligte fehlerhafte Dokumentation nicht beiläufig; behandle sie als Nebenbefund.
- Behandle eine erklärte Dokumentationswirkung `Ändern` oder `Prüfen` als Abnahmekriterium. Lass `Keine` nur
  gelten, wenn der tatsächliche Diff keine verwandte Aussage entwertet.

## Integrieren und abschließen

Integriere als Integrator die Übergabe nach dem Git-Workflow, führe ihre gemeinsamen Prüfungen aus und halte
den Abschlussbericht aus dem Bericht des Leads nach dem maßgeblichen Vertrag am Task fest; ein gültiger
tree-gebundener Nachweis desselben Trees zählt als diese Prüfung. Setze `done` nur, wenn alle Kriterien auf
dem Kontroll-Branch belegt sind, und gleiche dabei den tatsächlichen Diff und das entstandene Verhalten mit
der Ausführungsgrundlage ab.

## An den Nutzer übergeben

Übergib einen Task erst an den Nutzer, wenn integriert ist, was geprüft und in sich stimmig ist:

- **Nur die Prüfung des Nutzers fehlt:** Sind alle Kriterien belegt, die sich ohne ihn belegen lassen, übergib
  den Task als Lead wie jeden anderen an den Integrator und nenne die offene Prüfung im Bericht. Setze ihn als
  Integrator nach der Integration auf `review` statt auf `done`. Verlangt der Taskvertrag die Prüfung vor der
  Integration, bleibt der Stand integrationsreif auf dem Task-Branch.
- **Ein Teil ist fertig:** Übergib als Lead jeden geprüften Meilenstein an den Integrator, als Übergabe, die
  nicht die letzte ist, bevor der Task an den Nutzer geht. Nur ein unfertiger Rest bleibt als Checkpoint auf
  dem Task-Branch.

Wähle den Status und schreibe die Übergabe nach „Übergabe an den Nutzer“ der Backlog-Norm. Frage als Lead vor
`review` zuerst den Supervisor, außer der Taskvertrag selbst weist die Prüfung dem Nutzer zu. Verhindert eine
externe Voraussetzung, Ressource oder Umgebung das Weiterarbeiten, gehört der Task nach dem maßgeblichen
Statusmodell auf `waiting`. Schreibe den Status nur so, wie „Planungssystem“ im Git-Workflow es regelt. Ändere
den Status nicht wegen einer nicht erfüllten internen Task-Abhängigkeit; die Reihenfolge im Planungssystem
genügt.
