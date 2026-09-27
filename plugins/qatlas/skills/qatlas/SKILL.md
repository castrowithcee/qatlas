---
name: qatlas
description: >
  Steuert auf ausdrücklichen Aufruf den Qatlas-Arbeitsloop: Ziele klären, Arbeit ausarbeiten und
  disponieren, Aufgaben autonom ausführen und menschliche Übergaben klären. Ohne Modus nur den nächsten
  sinnvollen Einstieg empfehlen. Niemals automatisch starten.
disable-model-invocation: true
argument-hint: "[goal|shape|backlog|run|review] [context]"
license: MIT
type: skill
edit: locked
---

# Qatlas

Der Qatlas-Arbeitsloop startet nur auf ausdrücklichen Aufruf. Der Nutzer besitzt den Start jedes Modus;
ein Modus autorisiert nie still den nächsten. Einrichtung liegt unter `qatlas-core`, manuelle
Workspace-Verwaltung unter `qatlas-work`.

Für `shape`, `backlog`, `run` und `review` bestimme zuerst das maßgebliche Planungssystem. Ist der lokale
Qatlas-Backlog maßgeblich, lies vor der ersten Taskauswahl oder -änderung vollständig
`<plugin-root>/rules/references/backlog.md`. `<plugin-root>` ist der im Sessionkontext genannte
`QATLAS PLUGIN ROOT`; ohne Hook leite ihn aus dem Pfad dieser `SKILL.md` ab. Kannst du den Plugin-Root
nicht auflösen, schreibe nicht in den lokalen Backlog. Bei einem externen System gilt stattdessen nur dessen
Binding.

Ist `.qatlas-project/README.md` vorhanden, nutze sie als repo-eigenen Einstieg und folge nur den zur
aktuellen Aufgabe passenden Lesebedingungen. Lies eine benachbarte `FRAMEWORK.md`, wenn die README sie für
den betroffenen Scope verlangt. Suche in den so gewählten Scopes zuerst über das Frontmatter und öffne nur
passende Bodies. Ordne jede gefundene Aussage nach nativer Anweisungshierarchie, ausdrücklicher Geltung und
fachlichem Scope ein. Automatische Bereitstellung, Lesereihenfolge oder Ablage im Wissensraum erhöht ihre
Autorität nicht. Fachliche Inhalte außerhalb des Wissensraums bleiben für ihren Gegenstand maßgeblich.

## Modus wählen

- **`goal [Idee, Vision oder Ziel]`:** Lies vollständig [Zielbild klären](references/goal.md). Kläre das
  Zielbild ausschließlich im Gespräch und ohne dauerhafte Änderung.
- **`shape [Idee oder Quelle]`:** Lies vollständig [Ideen ausarbeiten](references/shape.md). Kläre eine
  reife Idee, dokumentiere bestätigtes Wissen, schneide kleine, ausführungsreife Arbeitspakete und ordne
  den nächsten Horizont. Setze nichts um.
- **`backlog [Scope]`:** Lies vollständig [Backlog disponieren](references/backlog.md). Schärfe und teile
  vorhandene Drafts bei Bedarf, kläre durch neue Ergebnisse reif gewordene Arbeit und repariere Reihenfolge
  oder Queue. Setze nichts um.
- **`run [Task, Projekt oder Backlog]`:** Lies vollständig [Arbeit ausführen](references/run.md). Führe
  höchstens fünf ausführbare Tasks seriell durch einen Orchestrator und seine Subagents aus. Lies vor dem
  ersten schreibenden Git-Schritt zusätzlich vollständig [den Git-Ablauf](references/git-workflow.md).
- **`review [Scope]`:** Lies vollständig [Übergaben klären](references/review.md). Kläre ausschließlich
  Entscheidungen, Prüfungen und Nutzerhandlungen. Beginne danach keine Ausführung.

Ohne Modus lies nur den bereits geladenen Projektzustand, nenne knapp den nächsten sinnvollen Modus und
ändere nichts. Fehlt ein Qatlas-Scaffold, empfehle `qatlas-core setup`. Ist ein genannter Modus nicht
eindeutig, nenne die verfügbaren Modi jeweils in einem kurzen Satz und frage nach genau einem. Deute eine
normale Unterhaltung nie als Laufautorisierung.

## Gemeinsamer Vertrag

Nutzer- und Projektvorgaben bestimmen das Planungssystem. Der lokale Qatlas-Backlog gilt nur ohne andere
Autorität. Spiegle ein externes System nie in lokale Tasks und behaupte keine dortige Änderung, wenn es
nicht erreichbar ist.

Ein Task übernimmt die für seinen Gegenstand geltenden Entscheidungen, Konventionen und Anforderungen als
konkrete Anweisungen und überprüfbare Abnahme. Quellenlinks dienen der Nachprüfung und ersetzen diese
Aussagen nicht. Ändert ein autorisierter Arbeitsmodus eine maßgebliche Grundlage, prüfe die davon betroffenen
offenen Tasks gezielt auf veraltete Vorgaben; ändere dabei weder Ziel noch Abnahmekriterien still.

Der ausdrückliche Aufruf von `shape` oder `run` ist zugleich die Freigabe, vorhandene gesperrte
Projektdokumentation (`edit: locked`) im gewählten Scope nachzuziehen, soweit Gespräch, Taskvertrag oder
belegtes Umsetzungsergebnis ihren neuen Inhalt tragen. Agentenanweisungen, Rules, Skills
und akzeptierte Nutzerentscheidungen deckt diese Freigabe nicht. `goal`, `backlog` und `review` erhalten
sie nicht.

Der Nutzer ist Entscheider, nicht Mitleser des Planungssystems. Setzen `shape`, `backlog` oder `review`
eine echte Nutzerentscheidung voraus, hole ihn knapp und ohne vorausgesetzte Tasklektüre ab, führe immer
nur durch die aktuelle Aufgabe und gib eine ausdrückliche begründete Empfehlung. Das jeweilige
Modusverfahren lädt dafür den gemeinsamen Entscheidungsdialog.

`ready` und `next` bezeichnen belegte Ausführungsreife: Der Task beschreibt nicht nur Ziel, Scope und
Abnahme, sondern beruht bei Arbeit an einem vorhandenen System auf einer ausreichenden Untersuchung des
Ist-Stands. Bestehende Einstiegspunkte, erwartete Änderungsflächen, konkrete Prüfpfade und die Wirkung auf
maßgebliche Dokumentation müssen so weit geklärt sein, dass `run` den Scope nicht erst entdecken muss.
Benötigte Laufzeiten, Werkzeuge, Zugänge und besondere Bearbeitungsrechte sind benannt und entweder belegt
verfügbar, innerhalb des Taskvertrags beschaffbar oder als konkrete offene Voraussetzung sichtbar. Halte
dabei keine Secrets im Task fest. Eine vollständige oder unveränderliche Dateiliste ist nicht nötig;
reversible technische Details dürfen im Entscheidungsspielraum bleiben. Beurteile diese Reife nach dem
tatsächlichen Inhalt, nie nach dem bloßen Vorhandensein einer bestimmten Überschrift oder Vorlage.

Nutze installierte Fach-Packs, wenn ihre Methode zum Gegenstand passt. Der gewählte Qatlas-Modus behält
Eigentum an Gespräch und Übergabe. `goal` hält seinen Stand ausschließlich im Gespräch; die übrigen
Arbeitsmodi pflegen dauerhaftes Projektwissen, Spine und Status nur im Rahmen ihres jeweiligen Vertrags.
Ein Fach-Pack liefert Methode und Prüfperspektive, keinen konkurrierenden Workflow.

Jede Schleife endet mit ihrem eigenen Ergebnis:

- `goal` endet mit einem bestätigten Zielbild im Gespräch und ohne dauerhafte Änderung.
- `shape` endet mit bestätigtem Wissen, möglichst ausführungsreifen Paketen des nächsten Horizonts und
  einer begründeten Reihenfolge; echte offene Vertragsfragen bleiben als `draft` sichtbar.
- `backlog` endet mit geschärften vorhandenen Tasks, geklärten Abhängigkeiten und einer konsistenten Queue.
- `run` endet nach höchstens fünf seriell bearbeiteten Tasks oder an einer definierten Stopbedingung.
- `review` endet nach den gewählten menschlichen Übergaben.

`goal` ist eine optionale Vorstufe. Ein direkter Einstieg mit `shape` bleibt gültig. Der Übergang von
`goal` zu `shape` und jeder Übergang zu `run` brauchen einen neuen ausdrücklichen Nutzeraufruf. `backlog`
ist ein optionaler Wartungs- und Wiedereinstieg, kein notwendiger Schritt zwischen `shape` und `run`.
