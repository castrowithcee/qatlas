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

Ist ein vorgeschriebenes externes Planungssystem nicht erreichbar, stoppe vor schreibender Arbeit mit dem
konkreten Hindernis.

Der Laufvertrag konkretisiert den gewählten Scope, ersetzt aber nicht dessen Ausarbeitung. `run` prüft die
Ausführungsgrundlage auf Aktualität, Umgebungs- und Git-Voraussetzungen; er soll den fachlichen Scope nicht
erst durch eine neue Erstanalyse entdecken. Ein seit `shape` veränderter Bestand ist trotzdem
ein normaler Befund und wird nach den folgenden Reiferegeln behandelt. Ein bloß großer Task wird nicht
automatisch zum Auftrag an ein stärkeres Modell.

## Orchestrierung konfigurieren

Lies vor der Taskauswahl `~/.qatlas/plugins/orchestra.yaml`. Diese nutzereigene Datei gilt nur für `run` und
ist die einzige Quelle für die gewählten Modelle und Effort-Stufen. Prüfe, dass Format, die Sektion des
aktuellen Hosts, das Orchestrator-Modell und die benötigten Worker-Profile vorhanden und gültig sind. Fehlt
die Datei oder ihre Host-Sektion, ist ein Eintrag ungültig oder erscheint ein Modell veraltet oder
zweifelhaft, lies vollständig [Orchestrierung einrichten](playbook-orchestra.md) und beginne bis zur Klärung
keinen Task.

Die Profile sind eine Allowlist: Verwende weder ein nicht eingetragenes Modell noch eine andere
Effort-Einstellung. Setze `effort: null` nur für ein Modell, das keinen Effort unterstützt; für alle anderen
Worker wird Effort ausdrücklich gesetzt und nicht vom Orchestrator geerbt.

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
5. Prüfe jeden Task unmittelbar vor der Beanspruchung erneut auf die Ausführungsreife der Backlog-Norm.
   Ist sie verfehlt, setze ihn nach deren Regeln auf `draft` oder `waiting`, informiere den Nutzer konkret
   und führe ihn nicht aus. Eine technische Schwierigkeit oder eine zusätzliche Datei innerhalb des
   fachlichen Scopes ist keine offene Vertragsfrage.
6. Verändere keinen `in-progress`-Task mit einem laufenden oder unbekannten Subagent oder Orchestrator.
   Kläre zuerst dessen Eigentümer und Arbeitsstand. Arbeitet ein weiterer Orchestrator im selben Repo oder
   Planungssystem, beanspruche nur nach [Parallele Arbeit im Run](git-parallel.md).
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
Lösung nicht selbst. Kleine Status-, Integrations- und Verifikationsschritte bleiben bei ihm. Ausnahme: Ist
das gesamte Ergebnis eines Tasks eine kleine, risikoarme Änderung an wenigen Dateien, die er ohnehin
vollständig prüfen muss, setzt er sie selbst um; die Karte nennt dann `Subagents: keine`.

Bei einem Umsetzungstask zieht der Subagent dauerhafte Projektdokumentation nicht selbst nach. Er meldet
bestehende Aussagen, die seine Änderung entwertet, sowie belegte neue Pflichten oder Kopplungen für künftige
Arbeit mit Fundstelle und Beleg; ohne Befund begründet er `Keine`. Ist Dokumentation selbst ein ausdrückliches
Taskergebnis, darf er sie bearbeiten. Der Orchestrator verantwortet das Nachziehen nach der Integration.

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
- **Stopbedingung:** alle dem Subagent zugewiesenen Abnahmekriterien und vereinbarten Prüfungen sind
  erfüllt, bei einer größeren Umsetzung der vereinbarte Meilenstein erreicht, oder eine Vertrags-,
  Berechtigungs-, Risiko- oder Außenwirkungsgrenze ist erreicht.
- **Rückgabe:** geänderte Dateien, ausgeführte Prüfungen mit Ergebnis, Dokumentationsbefunde mit Fundstelle
  und Beleg oder begründetes `Keine`, Abweichungen von den erwarteten Änderungsflächen, ungelöste Risiken
  und Nebenbefunde mit Fundstelle und Beleg.

Einen kleinen Task setzt normalerweise ein Subagent um. Braucht derselbe Task legitim mehrere getrennte
Rollen oder Zielbereiche, darf der Orchestrator zwei oder mehr Subagents einsetzen. Ihre Aufträge müssen sich
nachweislich ergänzen, dürfen keine konkurrierenden Lösungen bauen und bleiben gemeinsam im Fehlerbudget
dieses einen Tasks. Gleichzeitig schreibende Subagents isoliert der Git-Ablauf. Ein weiterer Task beginnt
erst, wenn der aktive Task abgeschlossen oder gesichert übergeben ist.

Der Subagent darf eine nicht vorhergesagte Datei selbstständig einbeziehen, wenn sie nachweislich innerhalb
des fachlichen Scopes liegt, und nennt die Abweichung in seiner Rückgabe. Wäre eine Wirkung außerhalb des
Scopes nötig oder widerspricht der aktuelle Bestand einer bindenden fachlichen Quelle, stoppt er vor dieser
Wirkung und gibt den Befund an den Orchestrator zurück. Er erweitert den Vertrag nicht selbst. Einen Fehler,
ein Sicherheitsrisiko oder nachweislich falsche Dokumentation außerhalb des Scopes behebt er nicht, sondern
meldet ihn als Nebenbefund.

Sende nach dem erfolgreichen Start genau eine knappe Karte:

> **Aufgabe:** #84 - Dateizugriff auf SQL umstellen
>
> **Subagents:** light: sonnet (low)

Verwende ID und Titel aus dem Spine. Nenne pro gestarteten Subagent das gewählte Profil und die
Modell-Effort-Kombination in kurzer Form. Meldet der Host die tatsächliche Kombination nicht zurück, nenne
die angeforderte und kennzeichne sie mit „angefordert“; stoppe nur bei einer belegten Abweichung. Fehlen die
benötigten Subagents, stoppe vor der Umsetzung und melde diese Voraussetzung. Der Orchestrator ersetzt sie
nicht als stiller Subagent.

### Überwachen

Beobachte Arbeitsstand und Rückgaben gegen Taskvertrag, tatsächlichen Diff und vereinbarte Beweise. Greife
ein, wenn ein Subagent den Scope verlässt, einen vorgeschriebenen Prüf- oder Referenzvergleich auslässt,
ohne Fortschritt festhängt oder eine ausgeschlossene Wirkung vorbereitet. Begrenze oder stoppe seinen
Auftrag, statt durch weitere unspezifische Prompts Token zu verbrauchen.

Eine Erfolgsmeldung des Subagents ist kein Abschlussbeleg. Der Orchestrator prüft Ergebnis, Diff und
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
Ausführungsgrundlage ab. Der Orchestrator entscheidet über die Dokumentationswirkung und zieht nötige
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

### Nebenbefunde erfassen

Was der Lauf außerhalb des aktiven Taskvertrags bemerkt, behebt er nicht. Erfasse jeden der folgenden
Befunde vor dem nächsten Task als `draft` im Spine, auch wenn der Run-Scope das Anlegen weiterer Arbeit
nicht einschließt:

- ein belegter Fehler im bestehenden Verhalten,
- ein mögliches oder bestätigtes Sicherheitsrisiko,
- nachweislich falsche Dokumentation.

Der Draft nennt Befund, Fundstelle, Beleg und den Task, bei dem er gefunden wurde; unterstützt das
Planungssystem Labels, trägt er `run-fund`. Ausarbeitung, Zuschnitt und Reife bleiben bei `shape`. Deckt ein
bestehender Task den Befund bereits ab, lege nichts an und nenne diesen Task. Dasselbe Muster an mehreren
Stellen ergibt einen Draft. Verbesserungsideen, Refactoring, Stilfragen und mögliche Erweiterungen sind keine
Nebenbefunde und werden nicht erfasst.

Ein nicht behobenes Sicherheitsrisiko gelangt nie an einen öffentlich einsehbaren Ort, weder in Spine, Task,
Abschlussbericht, Commit-Nachricht, Branchnamen, Pull Request noch Kommentar. Maßgeblich ist die
Sichtbarkeit des Ortes, an dem der Eintrag tatsächlich liegt: Ein Issue in einem öffentlichen Repo ist
öffentlich, auch wenn das Board, das es führt, privat ist, und ein lokaler Backlog teilt die Sichtbarkeit
seines Repos und dessen Remotes. Erfasse es als Draft nur, wenn dieser Ort belegt nicht öffentlich ist, etwa
über die geprüfte Sichtbarkeit des Repos. Ist er öffentlich oder seine Sichtbarkeit nicht belegbar, erfasse
nichts und melde das Risiko ausschließlich im Abschluss unter **Sicherheit**. Auch an einem nicht
öffentlichen Ort enthält der Eintrag keine Secrets.

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

Sichere vor dem Ende Spine, Abschlussberichte, Nebenbefunde und erlaubte lokale Commits. Der Nutzer setzt
einen Lauf meist in einer neuen Session fort. Jede Übergabe steht deshalb mit ihrer Task-ID im Spine, und
der Abschluss ist ohne den Laufverlauf verständlich. Berichte Ergebnis und maßgebliche Beweise knapp. Nenne
pro bearbeitetem Task geänderte Dateien, ausgeführte Prüfungen, Dokumentationswirkung, Abweichungen von der
erwarteten Arbeitskarte und ungelöste Risiken sowie die eingesetzten Worker-Profile mit Modell und Effort;
Rohlogs bleiben draußen.

Beende den Abschluss mit genau diesem Block. Jeder Punkt steht in einer Zeile mit seiner Task-ID und nur
hier, nicht zusätzlich im Fließtext. Leere Kategorien entfallen:

```markdown
## Für dich

**Handeln**
- #<ID>: <konkrete Handlung des Nutzers>

**Prüfen**
- #<ID>: <was, wann und woran Erfolg erkennbar ist>

**Entscheiden**
- #<ID>: <offene Entscheidung>

**Neu erfasst**
- #<ID> <Titel des Nebenbefunds>

**Sicherheit**
- <nicht erfasstes Sicherheitsrisiko mit Fundstelle>, nur hier gemeldet

**Nicht gepusht**
- <Repo>: <Commit-IDs>

Weiter in neuer Session: <Modi>
```

Nenne in der letzten Zeile nur Modi mit tatsächlicher Arbeit: `review` für Tasks in `review`,
`shape <eindeutiger Task>` für einen Draft oder `shape backlog` für mehrere. Bleibt nichts für den Nutzer,
lautet der Block nur `## Für dich: nichts offen`. Eine neue Idee geht an `shape` ohne Task-Scope. Starte den
Modus nicht selbst. Pushe nichts.
