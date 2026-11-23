---
description: >
  Einen Task eines Pakets mit begrenzten Worker-Aufträgen umsetzen, die Worker überwachen und
  Nebenbefunde festhalten.
---

# Einen Task ausführen

Schreibe Anspruch, Statuswechsel und Entwürfe nach „Planungssystem“ im Git-Workflow. Lass keinen Worker
Planungssystem oder Branch-Verwaltung ändern, Commits anlegen oder eigene Subagents starten.

## Worker beauftragen

Gib jedem Worker genau einen begrenzten Auftrag. Setze die inhaltliche Lösung nicht selbst um, erledige aber
kleine Status-, Integrations- und Verifikationsschritte selbst. Ausnahme: Besteht das gesamte
Ergebnis eines Tasks aus einer kleinen, risikoarmen Änderung an wenigen Dateien, die du ohnehin vollständig
prüfen musst, setze sie selbst um. Ein Umbau über viele Dateien gehört nicht dazu, auch wenn er mechanisch
ist.

Beurteile vor jedem Start den tatsächlichen Auftrag und seinen Verifikationsaufwand: Welche Ergebnisse lassen
sich unabhängig abnehmen, welche Schritte hängen voneinander ab, welche Sicherheits- und Zielgrenzen gelten,
und welche Abnahmen kannst du nach der Rückgabe selbst belegen? Schneide kleiner zu bei mehreren unabhängigen
Tool- oder Endpunktgruppen, unterschiedlichen Risiko- und Berechtigungsgrenzen oder einem Scope, der einen
Worker über viele Umsetzungs- und Prüfschritte bindet.

Liegt die gesamte Abnahme bereits in einem tragfähigen Taskvertrag, teile ihn bei Bedarf in geordnete
Worker-Aufträge A, B und weitere mit je einem eigenen prüfbaren Meilenstein, ohne daraus neue Backlog-Tasks
anzulegen. Prüfe und sichere jeden Meilenstein vor dem nächsten Auftrag und lass spätere Aufträge auf dem
bestätigten Stand aufbauen. Gib einem unabhängigen Meilenstein oder einem vorbereitenden mechanischen
Refactoring nach der Commit-Grenze der Git-Norm mindestens einen eigenen Commit und bei Integration über Pull
Requests mit Squash-Merge einen eigenen Pull Request. Enthält der Task dagegen in sich geschlossene
Ergebnisse, deren Grenzen, Reihenfolge oder Abnahme der Vertrag noch nicht klärt, setze ihn auf `draft` und
halte die offene Zuschnittsfrage am bestehenden Ort für ein späteres, vom Nutzer gestartetes `shape` fest.
Erfinde die fehlende Planung nicht im Lauf.

Wähle für jeden Auftrag ein Profil, zuerst `light`: ein enger Auftrag mit klarem Vorgehen und direkter
Prüfung. Nimm `standard` bei mehreren abhängigen Schritten oder technischen Abwägungen und `demanding` für eine
belegt schwierige Diagnose oder eine eng gekoppelte Umsetzung, die sich sinnvoll nicht weiter teilen lässt,
nie wegen des Umfangs allein. Du musst dafür nicht erst einen kleinen Worker scheitern lassen. Begründe
`standard` und `demanding` vor dem Start kurz. Setze das Korrekturbudget bei einem Modellwechsel nicht zurück.

Der Taskvertrag ist der Auftrag. Verfasse ihn nicht neu. Nenne dem Worker Task-ID und Titel und den Leseweg
zum aktuellen Eintrag: den Leseaufruf, mit dem du den Task selbst gelesen hast. Kann ein Worker den Task so nicht lesen, gib ihm den
aktuellen Eintrag wörtlich mit. Ergänze nur, was der Vertrag nicht enthält, und gib keine Geheimnisse weiter:

- **Arbeitsort:** Worktree und Branch sowie ein eigenes Unterverzeichnis von `<tmp>` für temporäre Dateien des
  Workers.
- **Lektüre:** zu jeder Quelle, auf die der Task verweist, die Datei und den Abschnitt, den dieser Worker
  braucht. Trage ihm nie auf, eine Quelle ganz zu lesen, um seinen Teil zu finden. Lässt sich der Teil nicht
  als Abschnitt benennen, gib ihm den Ausschnitt wörtlich mit.
- **Meilenstein:** bei einem geteilten Task der Teil dieses Workers mit seinen Abnahmekriterien und Prüfungen
  und dem, was späteren Aufträgen bleibt.
- **Abweichungen:** wo der geprüfte Stand des Repos von der Ausführungsgrundlage des Tasks abweicht, und jede
  geltende Entscheidung oder Antwort des Supervisors zu diesem Task.
- **Fehlende Grenzen:** eine für den Gegenstand verbindliche Grenze für Architektur, Sicherheit,
  Kompatibilität oder Dokumentation, die der Vertrag nicht als konkrete Arbeitsanweisung nennt, etwa die
  Bindung fremder Objekt-IDs an das gewählte Ziel oder den Umgang mit nicht vertrauenswürdigen Inhalten.
- **Prüfungen:** welche Prüfungen der Worker selbst ausführt.
- **Budget:** Zahl der für diesen Task eingesetzten Worker und verbleibende Korrekturversuche, bei einer
  Korrektur der Befund, der sie auslöst.
- **Worker-Profil:** gewähltes Profil mit Modell, Effort oder dessen fehlender Unterstützung und, bei
  `standard` oder `demanding`, der Grund.

Grenzen, Stoppbedingung und Rückgabe des Workers stehen in `<plugin-root>/agents/worker.md`. Wiederhole sie
nicht. Lädt der Host diese Datei nicht selbst, wie Claude Code über den Subagent-Typ `qatlas:worker`, weise den
Worker an, sie zuerst vollständig zu lesen. Übernimm die Nacharbeit zu seinen Dokumentationsbefunden nach
„Dokumentationswirkung“ in „Abnehmen und integrieren“.

Setze für einen kleinen Task normalerweise einen Worker ein. Braucht derselbe Task berechtigt mehrere
getrennte Rollen oder Zielbereiche, setze mehrere ein. Lass schreibende Worker nacheinander arbeiten, nie
gleichzeitig. Nur schreibgeschützte Analysen und Reviews dürfen parallel laufen, solange sie nachweislich
nichts verändern. Achte darauf, dass sich die Aufträge nachweislich ergänzen, keine konkurrierenden Lösungen
bauen und zusammen im Korrekturbudget dieses einen Tasks bleiben.

Führe lokale Nachweise über `<tools> slot -- <test command>` aus: `slot` begrenzt gleichzeitige Testläufe
auf dem ganzen Host und verwendet einen grünen Nachweis desselben Trees wieder. Das gilt für alles, was Tests
ausführt, baut oder eine geteilte Ressource braucht, auch für einen Befehl, der schnelle Prüfungen mit Tests
verkettet. Führe Prüfungen, die den Host kaum belasten und in der Regel unter einer Minute enden, etwa
Formatierung, statische Analyse oder Syntaxprüfung, direkt ohne `slot` aus: Ihre Wiederholung kostet nichts,
deshalb brauchen sie keinen gespeicherten Nachweis. Entnimm Projektwerte für Gültigkeit,
unversionierte Eingaben, Slot-Anzahl und exklusive Ressourcen der Teststrategie des Projekts in „Abnehmen und
integrieren“, die Optionen dem Kopfkommentar des Skripts. Führe einen Befehl, den die Projektvorgaben einer
exklusiven Ressource zuweisen, über `slot --resource <name> -- <command>` aus. Führe vollständige Tests immer
selbst über `slot` aus, im Vordergrund oder über die Hintergrundausführung des Hosts mit ihrer
Abschlussmeldung, und warte auf diese Meldung, nie mit `sleep`, Schleifen, Monitoren oder Abfragen von
Prozessen, Lock-Ordnern oder Ausgabedateien. Gib einem Worker nur Prüfungen, die absehbar in
unter zwei Minuten enden, etwa Formatierung, statische Analyse oder einen gezielten Test seiner Änderung, und
trage ihm kein höheres Befehls-Timeout auf. Vollständige Tests und alles Längere führst du selbst aus. Ein
Worker, der auf eigene Hintergrundarbeit wartet, gilt dem Host als angehalten.

Nenne im Bericht des Tasks für jeden Worker Profil, Modell und Effort. Meldet der Host die tatsächliche
Kombination nicht zurück, nenne die angeforderte und kennzeichne sie mit „angefordert“. Halte nur bei einer
belegten Abweichung an.

## Worker überwachen

Beobachte Arbeitsstand und Rückgaben gegen Taskvertrag, tatsächlichen Diff und vereinbarte Nachweise. Greife
ein, wenn ein Worker den Scope verlässt, eine vorgeschriebene Prüfung oder einen Referenzvergleich auslässt,
ohne Fortschritt hängt oder eine ausgeschlossene Wirkung vorbereitet. Begrenze oder stoppe seinen Auftrag,
statt mit weiteren unspezifischen Prompts Tokens zu verbrennen.

Bricht der Host einen Worker mit einer Sicherheitsmeldung ab, starte den Auftrag nicht erneut mit demselben
Modell. Starte ihn einmal mit einem eingetragenen Profil eines anderen Modells neu. Der Abbruch zählt nicht als
Korrekturversuch. Bricht auch dieser Worker ab, übergib den Task an `review`.

## Nebenbefunde festhalten

Behebe nichts, was der Lauf außerhalb des aktiven Taskvertrags bemerkt, und lass es auch keinen Worker
beheben. Halte jeden der folgenden Befunde vor dem nächsten Task als Entwurf fest, auch wenn der Scope des
Laufs das Anlegen weiterer Arbeit nicht einschließt:

- einen belegten Defekt im bestehenden Verhalten,
- ein mögliches oder bestätigtes Sicherheitsrisiko,
- nachweislich falsche Dokumentation.

Nenne im Entwurf den Befund, den Ort, den Nachweis und den Task, bei dem er gefunden wurde. Unterstützt das
Planungssystem Labels, gib ihm `run-fund`. Arbeite ihn nicht weiter aus: Die Reife klärt der Supervisor am
Laufende, den Rest `shape`. Deckt ein bestehender Task den Befund bereits ab, lege nichts an und nenne diesen
Task. Fasse dasselbe Muster an mehreren Stellen in einem Entwurf zusammen.
Halte Verbesserungsideen, Refactoring, Stilfragen und mögliche
Erweiterungen nicht fest, denn sie sind keine Nebenbefunde.

Lass ein unbehobenes Sicherheitsrisiko nie an einen öffentlich einsehbaren Ort gelangen, weder in
Planungssystem, Task, Bericht, Commit-Nachricht, Branch-Namen, Pull Request noch Kommentar. Beurteile dafür die
Sichtbarkeit des Orts, an dem der Eintrag tatsächlich liegt: Ein Issue in einem öffentlichen Repo ist
öffentlich, auch wenn das Board, das es verwaltet, privat ist, und ein lokales Backlog teilt die Sichtbarkeit
seines Repos und seiner Remotes. Halte es nur dann als Entwurf fest, wenn dieser Ort belegt nicht öffentlich
ist, etwa über die verifizierte Sichtbarkeit des Repos. Ist er öffentlich oder lässt sich seine Sichtbarkeit
nicht belegen, halte nichts fest und protokolliere es nur als `risiko`. Schreibe auch an einem nicht
öffentlichen Ort keine Geheimnisse in den Eintrag.
