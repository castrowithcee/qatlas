---
description: >
  Taskergebnisse selbst abnehmen, Fehlschläge klassifizieren, höchstens zwei Korrekturen zulassen und
  Ergebnis samt Dokumentationswirkung integrieren.
type: playbook
edit: locked
license: MIT
---

# Abnehmen und integrieren

Dieses Vorgehen gilt für jeden, der ein Taskergebnis abnimmt und integriert: den Orchestrator eines Runs und
den Sentinel.

## Abnahme prüfen

Eine Erfolgsmeldung des Umsetzenden ist kein Abschlussbeleg. Wer abnimmt, prüft Ergebnis, Diff und
Beweise selbst und neben den Kriterien auch, ob das Ergebnis das Ziel des Tasks inhaltlich vollständig
erfüllt. Gleiche jede Abnahme und jede übergreifende Sicherheitsgrenze mit dem tatsächlichen
Verhalten ab; grüne Standardtests ersetzen weder ausdrücklich vereinbarte Randfälle noch einen
Referenzvergleich. Prüfe übergreifende Invarianten spätestens bei der Integration aller Meilensteine
erneut. Klassifiziere jeden Fehlschlag:

- **Ausführungsfehler:** Ein falscher Pfad, Tippfehler, Quoting oder ungeeigneter Flag hat die Lösung noch
  nicht geprüft. Korrigiere den Aufruf einmal gezielt. Wiederholt sich derselbe Fehler, behandle ihn als
  fehlende Voraussetzung oder Lösungsfehler, nicht als unbegrenzte neue Runde.
- **Fehlende Voraussetzung:** Runtime, Werkzeug, Berechtigung, Ressource oder Nutzereingabe fehlen. Starte
  keinen Ersatzansatz. Sichere den Task unmittelbar für `review` oder `waiting`.
- **Lösungsfehler:** Der Ansatz wurde ausgeführt, erfüllt aber ein Abnahmekriterium nicht. Leite aus Diagnose
  oder neuer Evidenz eine konkrete Korrektur ab.
- **Bekannter Flake:** Ein CI-Fehlschlag zählt nur dann nicht als Lösungsfehler, wenn der fehlschlagende Test
  außerhalb des Diffs liegt und als bekannter Flake mit Task-ID im Planungssystem erfasst ist. Starte den
  fehlgeschlagenen Job dann höchstens einmal pro Pull Request neu und nenne den Rerun mit dieser Task-ID im
  Abschluss. Ordne eine neue Fundstelle dem bestehenden Task zu, statt sie neu zu erfassen. Jeder andere
  CI-Fehlschlag bleibt ein Lösungsfehler.

## Höchstens zwei Korrekturen

Der initiale Umsetzungsversuch zählt nicht als Korrektur, ebenso wenig seine planmäßige Fortsetzung nach
einem geprüften und gesicherten Meilenstein. Danach sind pro Task insgesamt höchstens zwei
gezielte Korrekturversuche erlaubt, auch wenn mehrere Abnahmekriterien betroffen sind. Jede Korrektur braucht
neue Evidenz und eine daraus abgeleitete Änderung; bloßes Umformulieren, ein anderer Subagent oder eine neue
Session setzt den Zähler nicht zurück.

Ist das Kriterium nach der zweiten Korrektur weiterhin nicht erfüllt:

1. Stoppe jede weitere Umsetzung dieses Tasks.
2. Sichere den aktuellen Diff, die belegte Ursache, die zwei geprüften Korrekturen und die noch verletzte
   Abnahme kompakt im Task.
3. Setze den Task auf `review` und formuliere die konkrete Nutzerentscheidung zu Voraussetzung,
   Ansatzwechsel, Scope oder Zurückstellung.
4. Starte keinen Checker oder Ersatz-Subagent als verdeckte dritte Korrekturrunde.

Hängen verbleibende Tasks von diesem Ergebnis ab, stoppe den gesamten Lauf und übergib dem Nutzer die
Entscheidung. Nur nachweislich unabhängige Tasks dürfen innerhalb der verbleibenden Taskgrenze seriell
weiterlaufen.

## Integrieren und abschließen

Integriere die Arbeit des aktiven Tasks, führe seine gemeinsamen Prüfungen aus und pflege Task,
Abschlussbericht und Spine nach dem maßgeblichen Vertrag. Setze ihn erst auf `done`, wenn alle Kriterien auf
dem Steuerbranch belegt sind. Gleiche dabei den tatsächlichen Diff und das entstandene Verhalten gegen die
Ausführungsgrundlage ab. Wer integriert, entscheidet über die Dokumentationswirkung und zieht nötige
Änderungen vor dem Taskabschluss nach:

- Dokumentiere nur Aussagen, die ein künftiger Bearbeiter kennen muss, um eine Anforderung einzuhalten oder
  eine Fehlentscheidung zu vermeiden. Beschreibe keine Details, die Code und Tests bereits ohne relevante
  Fehlentscheidung erkennen lassen, und wiederhole weder Taskverlauf, Abschlussbericht noch bestehende
  Regeln. Ohne eine solche Aussage ziehe keine Projektdokumentation nach.
- Korrigiere direkt betroffene Dokumentation, die durch die Umsetzung falsch geworden ist, am bestehenden
  maßgeblichen Ort mit der kleinsten nötigen Änderung und prüfe sie erneut.
- Führt die Umsetzung eine übergreifende Pflicht für künftige Arbeit im Scope ein oder legt sie eine
  verdeckte Kopplung offen, die solche Arbeit binden muss, halte sie in der vorhandenen Projektdokumentation
  mit der kleinsten nötigen Aussage fest, vorrangig bei den betroffenen Entscheidungen, Anforderungen oder
  dem Fachwissen in `.qatlas-project/`. Sie gilt damit als geänderte maßgebliche Grundlage; ein
  Abschlussbericht allein reicht dafür nicht.
- Widerspricht eine maßgebliche fachliche Dokumentation dem beabsichtigten Ergebnis und könnte sie eine
  Nutzerentscheidung ausdrücken, setze den Task auf `review`, statt eine Seite still zu überschreiben.
- Ändere sachlich unabhängige fehlerhafte Dokumentation nicht opportunistisch; sie ist ein Nebenbefund.
- Eine deklarierte Dokumentationswirkung `Ändern` oder `Prüfen` ist ein Abnahmekriterium. `Keine` bleibt nur
  gültig, wenn der tatsächliche Diff keine zugehörige Aussage entwertet.

Muss der Nutzer entscheiden, prüfen oder handeln, setze den Task auf `review`. Verhindert eine externe
Voraussetzung, Ressource oder Umgebung die Fortsetzung, setze ihn nach dem maßgeblichen Statusmodell auf
`waiting`. Eine unerfüllte interne Task-Abhängigkeit verändert den Status nicht; die Reihenfolge im Spine
genügt.
