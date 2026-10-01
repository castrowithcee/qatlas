---
description: >
  Serieller autonomer Arbeitslauf für höchstens fünf ausführbare Tasks: Ein Orchestrator disponiert,
  überwacht und integriert genau einen aktiven Task zur Zeit, den Subagents mit je einem abgegrenzten
  Auftrag umsetzen, und übergibt ihn nach spätestens zwei erfolglosen Korrekturen gesichert an den Nutzer.
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
Dritte und keine sonstige externe oder irreversible Wirkung. Eine konkrete Qatlas-Tooloperation ist nur
zulässig, wenn der aktuelle Nutzerauftrag, der maßgebliche Taskvertrag oder eine geltende globale
beziehungsweise projektlokale Agentendatei Wirkung, Connection, Zielbereich und Grenzen separat und
eindeutig festlegt. Verwende dafür den konfigurierten Qatlas-MCP-Broker und seine verfügbaren
Toolbeschreibungen. Abschlussmeldungen sendet ausschließlich der primäre Orchestrator; Subagents senden
bei ihrer Fertigmeldung keine Nachricht.

## Laufvertrag festlegen

Bestimme vor der ersten Änderung:

1. **Ziel:** Welcher beobachtbare Zustand beendet den Lauf erfolgreich?
2. **Scope-in:** Welche Tasks, Repos, Pfade und Systeme gehören zum Aufruf?
3. **Scope-out:** Welche benachbarten Ziele, Pfade und Wirkungen bleiben ausgeschlossen?
4. **Spine:** Welches Planungssystem hält Status, Abhängigkeiten, Befunde und Übergaben dauerhaft fest?
5. **Beweise:** Welche Tests, Zustände oder Artefakte belegen den Abschluss?
6. **Grenzen:** Welche Handlung braucht zwingend den Nutzer?

Ist `.qatlas-project/README.md` vorhanden, beginne dort und folge nur den für den Laufvertrag relevanten
Lesebedingungen. Prüfe fachliche Quellen auch außerhalb des Wissensraums an ihrem maßgeblichen Ort. Native
Anweisungshierarchie, ausdrückliche Geltung und fachlicher Scope bestimmen den Rang; automatische
Bereitstellung oder bloßes Lesen nicht.

Nutzer- und Projektvorgaben bestimmen das Planungssystem. Nur ohne andere Vorgabe gilt der lokale
Qatlas-Backlog. Ist ein vorgeschriebenes externes System nicht erreichbar, spiegle es nicht in lokale
Dateien; stoppe vor schreibender Arbeit mit dem konkreten Hindernis.

Der Laufvertrag konkretisiert den gewählten Scope, ersetzt aber nicht dessen Ausarbeitung. `run` prüft die
Ausführungsgrundlage auf Aktualität, Umgebungs- und Git-Voraussetzungen; er soll den fachlichen Scope nicht
erst durch eine neue Erstanalyse entdecken. Ein seit `shape` veränderter Bestand ist trotzdem
ein normaler Befund und wird nach den folgenden Reiferegeln behandelt. Ein bloß großer Task wird nicht
automatisch zum Auftrag an ein stärkeres Modell.

## Orchestrierung konfigurieren

Lies vor der Taskauswahl `~/.qatlas/plugins/orchestra.yaml`. Diese nutzereigene Datei gilt nur für `run` und
ist die einzige Quelle für die gewählten Modelle und Effort-Stufen. Die kommentierte Vorlage ist [die
Orchestra-Vorlage](../../../store/config/orchestra.example.yaml); `null` bei einem Modellwert markiert dort
einen Platzhalter, `effort: null` dagegen ein Modell ohne Effort-Unterstützung. Die Claude-Code-Vorlage
schlägt Haiku, Sonnet und Opus für `light`, `standard` und `demanding` vor. Fehlt die Nutzerdatei, lies die
Vorlage und ermittle die für den aktuellen Host verfügbaren Modell-IDs beziehungsweise nativen Aliase und
Effort-Stufen. Zeige eine konkret ausgefüllte Fassung mit nur diesem Host und frage, ob du sie dort anlegen
sollst. Schreibe keine Platzhalter; sind Werte nicht prüfbar, frage nach ihnen. Lege die Datei erst nach
Zustimmung an. Ohne Datei und ohne Zustimmung beginne keinen Task; die Modellgrenzen wären nicht belegt.

Prüfe bei einer vorhandenen Datei Format, Host, die drei beschriebenen Profile, Orchestrator-Modell und
alle gewählten Worker-Profile. Akzeptiere als Modellwerte nur vom Host unterstützte IDs oder native Aliase;
deute bloße Familiennamen nicht selbst als Aliase. Fehlt die Sektion des aktuellen Hosts, schlage ihre
konkret ausgefüllte Ergänzung vor und ändere die Nutzerdatei erst nach Zustimmung; beginne bis dahin keinen
Task.
Die Profile sind eine Allowlist: Verwende weder ein nicht eingetragenes Modell noch eine andere
Effort-Einstellung. Setze `effort: null` nur für ein Modell, das keinen Effort unterstützt; für alle anderen
Worker wird Effort ausdrücklich gesetzt und nicht vom Orchestrator geerbt. Prüfe die eingetragenen Modelle
und Effort-Stufen gegen die aktuell im Host verfügbare Auswahl; verifiziere zweifelhafte oder neue Modelle
anhand aktueller offizieller Host-Angaben. Ist ein Eintrag veraltet oder ist ein neues Modell für ein Profil
plausibel besser, schlage die konkrete Änderung mit Grund vor. Ändere die nutzereigene Datei nur nach
Zustimmung. Ein neues Modell ersetzt einen gültigen Eintrag nicht still. Ein ungültiges Orchestrator-Modell
oder ein für den nötigen Auftrag nicht nutzbares Profil stoppt vor der Task-Beanspruchung; andere gültige
Profile bleiben nutzbar. Behaupte keine Prüfung der Modellverfügbarkeit, die der Host nicht erlaubt.

Codex setzt beim Spawn Modell und Reasoning-Effort ausdrücklich. Claude Code verwendet für die Effort-Stufen
`low`, `medium`, `high`, `xhigh` und `max` jeweils den Plugin-Subagent `qatlas:run-low`,
`qatlas:run-medium`, `qatlas:run-high`, `qatlas:run-xhigh` beziehungsweise `qatlas:run-max` und übergibt
das Modell ausdrücklich beim Aufruf. Wähle nur eine vom jeweiligen Host und Modell unterstützte Stufe;
`ultra` ist keine Claude-Code-Effort-Stufe. Für `effort: null` verwende ausschließlich bei einem Modell ohne
Effort-Unterstützung `qatlas:run-no-effort` ohne Effort-Frontmatter. Dessen Extended Thinking folgt der
Claude-Code-Session und wird von `orchestra.yaml` nicht gesteuert. Ist der passende Subagent nicht
verfügbar oder ersetzt der Host Modell oder eine gewählte Effort-Stufe durch andere Werte, starte mit
diesem Profil nicht. Weiche nicht auf eine andere Effort-Stufe aus.

## Tasks auswählen

Ein Lauf bearbeitet höchstens fünf Tasks. Die Grenze begrenzt den Laufhorizont; sie ist keine Commitzahl,
keine Subagentzahl und keine Aussage über parallele Tasks. Die Zahl der `next`-Tasks verändert sie nicht.
Eine größere `next`-Menge bleibt in ihrer bestehenden Reihenfolge für spätere Läufe erhalten.

1. Lies zuerst nur Roster beziehungsweise externe Metadaten des gewählten Scopes. Ermittle Status,
   Kurzstand, Reihenfolge, Abhängigkeiten und Besitzsignale. Bei einem ausdrücklich gewählten einzelnen
   Task lies dessen aktuellen Datensatz direkt.
2. Nimm zuerst ausführbare `next`-Tasks in der Reihenfolge des Spine. Sind weniger als fünf vorhanden,
   ergänze den Lauf selbstständig mit fachlich passenden `ready`-Tasks desselben Scopes. Wähle nach
   erfüllbaren Abhängigkeiten, fachlichem Nutzen, früher Risikoklärung und sinnvoller Integration.
3. Ein ausgewählter `ready`-Task wechselt vor seiner Beanspruchung über `next`. `ready` und `next` sind
   exklusive Status; `next` setzt vollständige Ausführungsreife voraus.
4. Lies nur die ausgewählten Tasks und ihre echten Blocker vollständig. Öffne Kommentare oder Historie nur
   bei einem Widerspruch, fehlender entscheidungsrelevanter Begründung oder ausdrücklichem Verweis des
   aktuellen Datensatzes.
5. Prüfe jeden Task unmittelbar vor der Beanspruchung erneut. Beurteile nach seinem Inhalt, nicht nach dem
   Vorhandensein einer bestimmten Überschrift, ob Ergebnis, Scope, Vorgehen, Abnahme und bei Arbeit an
   vorhandenem Bestand die Ausführungsgrundlage und die konkret eingearbeiteten geltenden Entscheidungen,
   Konventionen und Anforderungen weiterhin tragen. Eine Quellenliste ohne diese Aussagen ist kein
   ausführbarer Vertrag. Fehlt eine Information, die diese Punkte
   wesentlich verändern könnte, ist eine notwendige Berechtigung ungeklärt oder die Dokumentationswirkung
   offen, setze ihn auf `draft`, informiere den Nutzer konkret und führe ihn nicht aus. Fehlt eine bereits
   bekannte externe Voraussetzung, setze ihn auf `waiting`. Eine reversible technische Detailentscheidung
   im vereinbarten Entscheidungsspielraum, eine technische Schwierigkeit oder eine zusätzliche Datei
   innerhalb des fachlichen Scopes ist keine offene Vertragsfrage.
6. Verändere keinen `in-progress`-Task mit einem laufenden oder unbekannten Subagent oder Orchestrator.
   Kläre zuerst dessen Eigentümer und Arbeitsstand. Arbeitet ein weiterer Orchestrator im selben Repo oder
   Planungssystem, beanspruche nur nach den Regeln für mehrere Orchestratoren im Git-Ablauf.
7. Prüfe bei Git Root, Branch, Upstream, Worktrees und vollständigen Status. Schreibende Arbeit beginnt nur
   auf einem sauberen, seit dem Preflight unveränderten Steuerbranch. Wende vor dem ersten schreibenden
   Git-Schritt den vom Einstieg genannten Git-Ablauf an.

Plane die Auswahl nicht als unveränderlichen Batch. Nach jedem abgeschlossenen oder gesichert übergebenen
Task bewertet der Orchestrator Auswahl, Reihenfolge, Abhängigkeiten und verbleibende Laufkapazität neu.

## Genau einen Task ausführen

Pro Lauf ist immer höchstens ein Task `in-progress`; die bis zu fünf Tasks laufen nacheinander. Beanspruche
ihn unmittelbar vor der ersten schreibenden Ausführung im Spine. Kein Subagent verändert Spine oder
Branchverwaltung, erstellt Commits oder startet eigene Subagents.

### Subagents beauftragen

Der Orchestrator gibt jedem Subagent genau einen abgegrenzten Auftrag mit Task-ID und Titel, Arbeitsort,
erlaubten Zielen, Scope-out, Abnahmekriterien, Prüfungen und Rückgabeformat. Er implementiert die fachliche
Lösung nicht selbst. Kleine Status-, Integrations- und Verifikationsschritte bleiben bei ihm.

Beurteile vor jedem Spawn den tatsächlichen Auftrag und seinen Prüfaufwand: Welche Ergebnisse sind
eigenständig abnehmbar, welche Schritte hängen voneinander ab, welche Sicherheits- und Zielgrenzen gelten,
und welche Abnahmen kann der Orchestrator nach der Rückgabe selbst belegen? Mehrere unabhängige Tool- oder
Endpunktgruppen, verschiedene Risiko- und Berechtigungsgrenzen oder ein Umfang, der einen Worker über
viele Implementierungs- und Prüfschritte bindet, verlangen einen kleineren Zuschnitt.

Liegt die gesamte Abnahme bereits in einem tragfähigen Taskvertrag, teile ihn bei Bedarf in geordnete
Worker-Aufträge A, B und weitere mit je eigenem überprüfbarem Meilenstein. Daraus entstehen keine neuen
Backlog-Tasks. Prüfe und sichere jeden Meilenstein vor dem nächsten Auftrag; spätere Aufträge übernehmen
den bestätigten Stand. Enthält der Task dagegen eigenständige Ergebnisse, deren Grenzen, Reihenfolge oder
Abnahme der Vertrag noch nicht klärt, setze ihn nach der Reifeprüfung auf `draft` und übergib den Zuschnitt
an `shape <eindeutiger Task>` zur Klärung am bestehenden Ort. Erfinde die fehlende Planung nicht im Run.

Wähle für jeden abgegrenzten Auftrag zuerst `light`. Nutze `standard`, wenn dessen beschriebene technische
Abwägungen nötig sind, und `demanding` bei belegter schwieriger Diagnose oder eng gekoppelter Umsetzung,
die sich nicht sinnvoll weiter teilen lässt. Umfang allein begründet `demanding` nicht. Ein kleiner Worker
muss dafür nicht erst scheitern. Begründe `standard` und `demanding` vor dem Spawn kurz; ein Modellwechsel
setzt das Korrekturbudget nicht zurück.

Leite den Auftrag aus dem aktuellen Taskvertrag und dem bestätigten Preflight ab. Er enthält in dieser
Reihenfolge:

- **Ziel:** beobachtbares Ergebnis des Tasks.
- **Arbeitsgrundlage:** Ausgangszustand, bestehende Einstiegspunkte, erwartete Änderungsflächen,
  maßgebliche Quellen und benötigte Ausführungsvoraussetzungen. Kennzeichne erwartete Flächen als
  Arbeitskarte, nicht als starre Dateifreigabe, und gib keine Secrets weiter.
- **Scope:** erlaubte fachliche Ziele sowie ausdrücklicher Scope-out.
- **Leitplanken:** bindende Architektur-, Sicherheits-, Kompatibilitäts- und Dokumentationsgrenzen sowie
  der Entscheidungsspielraum, jeweils als konkrete Arbeitsanweisung statt als bloßer Quellenlink. Prüfe
  insbesondere die Bindung fremder Objekt-IDs an das gewählte Ziel und den Umgang mit nicht
  vertrauenswürdigen Inhalten, soweit der Task solche Grenzen berührt. Weise den Subagent an: Lässt der
  Vertrag eine Ziel- oder Berechtigungsgrenze offen, wählt er die engere Auslegung und nennt sie in seiner
  Rückgabe; Zugriff oder Wirkung erweitert er nie aus eigener Deutung.
- **Budget:** Zahl der für diesen Task eingesetzten Subagents und verbleibende Korrekturversuche.
- **Worker-Profil:** gewähltes Profil mit Modell, Effort oder dessen fehlender Unterstützung und bei
  `standard` oder `demanding` dem Grund.
- **Stopbedingung:** alle Abnahmekriterien, vereinbarten Prüfungen und die Dokumentationswirkung sind
  erfüllt, bei einer größeren Umsetzung der vereinbarte Meilenstein erreicht, oder eine Vertrags-,
  Berechtigungs-, Risiko- oder Außenwirkungsgrenze ist erreicht.
- **Rückgabe:** geänderte Dateien, ausgeführte Prüfungen mit Ergebnis, aktualisierte oder bestätigte
  Dokumentation, Abweichungen von den erwarteten Änderungsflächen und ungelöste Risiken.

Einen kleinen Task setzt normalerweise ein Subagent um. Braucht derselbe Task legitim mehrere getrennte
Rollen oder Zielbereiche, darf der Orchestrator zwei oder mehr Subagents einsetzen. Ihre Aufträge müssen sich
nachweislich ergänzen, dürfen keine konkurrierenden Lösungen bauen und bleiben gemeinsam im Fehlerbudget
dieses einen Tasks. Gleichzeitig schreibende Subagents isoliert der Git-Ablauf. Ein weiterer Task beginnt
erst, wenn der aktive Task abgeschlossen oder gesichert übergeben ist.

Der Subagent darf eine nicht vorhergesagte Datei selbstständig einbeziehen, wenn sie nachweislich innerhalb
des fachlichen Scopes liegt, und nennt die Abweichung in seiner Rückgabe. Wäre eine Wirkung außerhalb des
Scopes nötig oder widerspricht der aktuelle Bestand einer bindenden fachlichen Quelle, stoppt er vor dieser
Wirkung und gibt den Befund an den Orchestrator zurück. Er erweitert den Vertrag nicht selbst.

Sende nach dem erfolgreichen Start genau eine knappe Karte:

> **Aufgabe:** #84 - Dateizugriff auf SQL umstellen
>
> **Subagents:** light: Luna (high)

Verwende ID und Titel aus dem Spine. Nenne pro gestarteten Subagent das gewählte Profil und die tatsächlich
verwendete Modell-Effort-Kombination in kurzer Form; bei unbekannter oder abweichender Kombination stoppe
den betreffenden Auftrag. Fehlen die benötigten Subagents, stoppe vor der Umsetzung und melde diese
Voraussetzung. Der Orchestrator ersetzt sie nicht als stiller Subagent.

### Überwachen

Beobachte Arbeitsstand und Rückgaben gegen Taskvertrag, tatsächlichen Diff und vereinbarte Beweise. Greife
ein, wenn ein Subagent den Scope verlässt, einen vorgeschriebenen Prüf- oder Referenzvergleich auslässt,
ohne Fortschritt festhängt oder eine ausgeschlossene Wirkung vorbereitet. Begrenze oder stoppe seinen
Auftrag, statt durch weitere unspezifische Prompts Token zu verbrauchen.

Eine Erfolgsmeldung des Subagents ist kein Abschlussbeleg. Der Orchestrator prüft Ergebnis, Diff und
Beweise selbst. Gleiche jede Abnahme und jede übergreifende Sicherheitsgrenze mit dem tatsächlichen
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

### Höchstens zwei Korrekturen

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
Entscheidung. Nur nachweislich unabhängige Tasks dürfen innerhalb der verbleibenden Fünfergrenze seriell
weiterlaufen.

## Integrieren und abschließen

Integriere die Arbeit des aktiven Tasks, führe seine gemeinsamen Prüfungen aus und pflege Task,
Abschlussbericht und Spine nach dem maßgeblichen Vertrag. Setze ihn erst auf `done`, wenn alle Kriterien auf
dem Steuerbranch belegt sind. Gleiche dabei den tatsächlichen Diff und das entstandene Verhalten gegen die
Ausführungsgrundlage ab:

- Lasse direkt betroffene Dokumentation, die durch die Umsetzung falsch geworden ist, innerhalb desselben
  Tasks korrigieren und erneut prüfen.
- Führt die Umsetzung eine übergreifende Pflicht für künftige Arbeit im Scope ein oder legt sie eine
  verdeckte Kopplung offen, die solche Arbeit binden muss, halte sie in der vorhandenen Projektdokumentation
  fest, vorrangig bei den betroffenen Entscheidungen, Anforderungen oder dem Fachwissen in
  `.qatlas-project/`. Sie gilt damit als geänderte maßgebliche Grundlage; ein Abschlussbericht allein reicht
  dafür nicht.
- Ändert die Umsetzung autorisiert eine maßgebliche Grundlage, ermittle deren betroffene offene Tasks und
  gleiche ihre konkreten Vorgaben gezielt ab. Ändere Ziel oder Abnahmekriterien nur mit der dafür nötigen
  Entscheidung.
- Widerspricht eine maßgebliche fachliche Dokumentation dem beabsichtigten Ergebnis und könnte sie eine
  Nutzerentscheidung ausdrücken, setze den Task auf `review`, statt eine Seite still zu überschreiben.
- Ändere sachlich unabhängige fehlerhafte Dokumentation nicht opportunistisch und melde sie konkret. Erfasse
  sie nur dann als eigenen Task, wenn der gewählte Run-Scope oder Taskvertrag das Anlegen weiterer Arbeit im
  maßgeblichen Planungssystem ausdrücklich einschließt; andernfalls bleibt sie eine benannte Folgearbeit für
  `shape`.
- Eine deklarierte Dokumentationswirkung `Ändern` oder `Prüfen` ist ein Abnahmekriterium. `Keine` bleibt nur
  gültig, wenn der tatsächliche Diff keine zugehörige Aussage entwertet.

Muss der Nutzer entscheiden, prüfen oder handeln, setze den Task auf `review`. Verhindert eine externe
Voraussetzung, Ressource oder Umgebung die Fortsetzung, setze ihn nach dem maßgeblichen Statusmodell auf
`waiting`. Eine unerfüllte interne Task-Abhängigkeit verändert den Status nicht; die Reihenfolge im Spine
genügt.

Beginne erst danach mit dem nächsten ausgewählten Task. Wiederhole Auswahl, Umsetzung und Integration, bis
fünf Tasks bearbeitet sind oder eine Stopbedingung eintritt.

## Stopbedingungen

Beende den Lauf, sobald eine dieser Bedingungen gilt:

- Fünf Tasks wurden abgeschlossen oder gesichert übergeben.
- Der gewählte Scope ist vollständig und belegt abgeschlossen.
- Es gibt im Scope weder ausführbares `next` noch ausführbares `ready`.
- Ein fehlgeschlagener Task blockiert die verbleibende Arbeit.
- Es bleibt nur Arbeit mit unerfüllten Abhängigkeiten, `waiting`, `draft` oder menschlicher Übergabe.
- Eine Scope-, Risiko-, Außenwirkungs- oder Berechtigungsgrenze ist erreicht.
- Beanspruchung, Eigentümerschaft oder Integrationsbesitz eines benötigten Tasks ist nicht eindeutig belegt.
- Der Steuerbranch wurde seit dem Preflight fremd verändert.

Sichere vor dem Ende Spine, Abschlussberichte und erlaubte lokale Commits. Berichte Ergebnis, maßgebliche
Beweise und konkrete menschliche Übergaben knapp. Nenne pro bearbeitetem Task geänderte Dateien,
ausgeführte Prüfungen, Dokumentationswirkung, Abweichungen von der erwarteten Arbeitskarte und ungelöste
Risiken sowie die eingesetzten Worker-Profile mit Modell und Effort; Rohlogs bleiben draußen. Bleiben
vorhandene Drafts als nächste Arbeit, nenne `shape <eindeutiger Task>` für einen oder `shape backlog`
für mehrere. Eine neue Idee geht an `shape` ohne Task-Scope. Starte den Modus nicht selbst. Pushe nichts.
