---
description: >
  Aufbau des Projekt-Wissensraums .qatlas-brain/: AGENTS.md als Einstieg, die reservierten Root-Dateien mit
  ihrer Aufgabe und Lesebedingung, die festen Ordner mit ihrem Inhalt, das Verbot weiterer Ordner,
  Zonen, FRAMEWORK.md außerhalb des Raums, die Library des Nutzers mit ihren Funktionen und Dateinamen.
---

# Projekt-Wissensraum

`.qatlas-brain/` ist der versionierte, im Repo geführte Stand des Projektwissens. Er hält fest, wie das
Projekt gebaut, geprüft, bearbeitet und gepflegt wird. Der Fachinhalt des Repos bleibt an seinem
maßgeblichen Ort: In einem persönlichen OS liegen Policies zu Weiterbildung oder Finanzen außerhalb, Policies
zu Struktur und Pflege der Sammlung innerhalb. Bestehende Spezifikationen und Dokumentationsbäume werden
nicht dupliziert. Außerhalb des Wissensraums gelten die vorhandenen lokalen Strukturen und werden nicht auf
dieses Layout umgestellt. Nur der Inhalt der beiden Zonen bleibt unversioniert. Eine Entscheidung des Nutzers
darf den ganzen Wissensraum lokal per gitignore ausschließen.

## Einstieg

Die `AGENTS.md` des Repos ist der Einstieg. Ihr Abschnitt `Projektwissen` nennt jede vorhandene reservierte
Datei, jeweils mit der Lesebedingung, die sagt, vor welcher Arbeit sie gelesen wird. Im Wissensraum gibt es
keine README. Wird eine reservierte Datei angelegt, ergänze ihre Zeile in `AGENTS.md`. Wird sie entfernt,
entferne die Zeile.

Eine gleichnamige Datei im Root des Repos, etwa eine `CONTRIBUTING.md` für fremde Beitragende, gehört den
Lesern des Repos und ist keine reservierte Datei. Überschneidet sich beides, steht die Aussage an einem Ort,
und der andere verweist dorthin.

## Reservierte Root-Dateien

Reserviert sind diese Dateien im Root von `.qatlas-brain/`, nicht im Root des Repos. Jede hat eine Aufgabe
und einen festen Namen. Daneben wird nichts erfunden: Inhalt, der zu einer Aufgabe passt, gehört in diese
Datei, Inhalt, der zu keiner passt, ist eine Frage an den Nutzer. Init legt keine davon an. Jede entsteht mit
ihrem ersten Eintrag und bleibt schlank. Eine reservierte Datei enthält nur, was Code, Tests, Linter und Hooks
nicht ohnehin durchsetzen.

| Datei | Aufgabe | Standard-Lesebedingung | Standard-`edit` |
|---|---|---|---|
| `PROJECT.md` | was das Projekt sein soll: Zweck, Zielgruppe, Zielbild, Nicht-Ziele und bindende Produktentscheidungen mit ihrem Grund | vor dem Klären, Planen oder Zuschneiden von Arbeit | `locked` |
| `PLANNING.md` | was beim Planen und Zuschneiden mitzudenken ist: Kopplungen zwischen Teilen des Projekts, mitzuziehende Flächen, wiederkehrende und externe Abhängigkeiten und Pflichtteile einer Abnahme | vor dem Klären, Planen oder Zuschneiden von Arbeit | `locked` |
| `CONVENTIONS.md` | wie gearbeitet wird: Codestil, Benennung, Muster, Ablage, verbotene Praktiken | vor dem Schreiben von Code oder Dateien | `locked` |
| `ARCHITECTURE.md` | wie das System gebaut ist: Module, Datenflüsse, Abhängigkeiten, Grenzen, mit dem Grund jeder bindenden Entscheidung | vor dem Ändern von Struktur, Modulen oder Schnittstellen | `shared` |
| `TESTING.md` | wie das Projekt geprüft wird: die Teststrategie des Projekts mit Befehlen, Stufen, Nachweis, Ressourcen, Abdeckungserwartungen und was vor einem Commit oder einer Übergabe grün sein muss | vor dem Ausführen von Prüfungen oder dem Ändern von Tests oder CI | `locked` |
| `CONTRIBUTING.md` | wie Änderungen landen: Branch-Muster, Kontroll-Branch und sein Schutz, Pull-Request-Integration und Plattform, Merge-Form, Definition of Done | vor dem Branchen, Committen oder Öffnen eines Pull Requests | `locked` |
| `OPERATIONS.md` | wie das System läuft und ausgeliefert wird: Umgebungen, Deployment, Release, Rückweg, Zugänge und der Ort von Secrets | vor dem Ausliefern, Veröffentlichen oder einem Eingriff in eine laufende Umgebung | `locked` |

Eine reservierte Datei mischt, was ihre Aufgabe braucht: Regeln, Wissen und Abläufe. Sie und die Dateien
ihres Ordners tragen deshalb keinen `type`.

Was in jeder Session gelten muss, etwa Zweck, Grenzen, Sichtbarkeit und die Lesebedingungen, bleibt in
`AGENTS.md`. Was über alle Projekte hinweg gilt, bleibt in der Library des Nutzers. Eine Entscheidung wird
mit ihrem Grund in die reservierte Datei eingearbeitet, die sie betrifft. Es gibt kein Entscheidungsregister,
und überholter Inhalt wird ersetzt, nicht archiviert.

`PROJECT.md` ist die Grundlage des Wissensraums: Die übrigen reservierten Dateien führen aus, was sie will.
Widerspricht eine von ihnen oder ein Task der `PROJECT.md`, gilt `PROJECT.md`, bis der Nutzer sie ändert oder
Änderungen freigibt.

`PROJECT.md` hält die Absicht fest, nie den Bestand: keine Funktionsliste, keinen Umsetzungsstand und nichts,
was der Code selbst zeigt. Ändere sie nur, wenn eine Entscheidung des Nutzers Zweck, Zielbild, Nicht-Ziele
oder eine Produktentscheidung ändert, etwa weil etwas entfällt oder ersetzt wird. Ein erledigter Task ändert
sie nicht.

`PLANNING.md` nimmt nur auf, was einen Task anders zugeschnitten hätte. Jeder Eintrag ist eine Anweisung für
den Zuschnitt im Imperativ, ohne Hergang, Datum oder Anlass. Ein Beispiel steht nur dabei, wenn die Anweisung
ohne es nicht verständlich ist. Die Tatsache hinter einer Anweisung, etwa ein gemeinsam genutzter Baustein
oder eine Prüfvorgabe, steht in der reservierten Datei, zu deren Aufgabe sie gehört, und `PLANNING.md` nennt
nur die Folge für den Zuschnitt.

Fehlt `PROJECT.md` in einem eingerichteten Projekt, entsteht sie im Gespräch, in neuen wie in bestehenden
Projekten nach derselben Regel: Verfahren und Bestätigung stehen unter `PROJECT.md` in
[Reservierte Datei füllen](playbook-reserved-files.md).

## Feste Ordner

Init legt `backlog/BACKLOG.md`, die Zone `zone-import/` mit einer `.gitkeep` und,
sofern die Plugin-Konfiguration das Repo-Memory nicht abschaltet (`memory.enable: false`), `memory/MEMORY.md`
an. Jeder andere Ordner entsteht zusammen mit seinem ersten Eintrag. Ohne `.qatlas-brain/` ist das Projekt
bewusst nicht eingerichtet: Lege keine seiner Dateien an, was auch immer die Konfiguration sagt, denn Init ist
der ausdrückliche Schritt des Nutzers. Jeder Ordner enthält genau das Aufgeführte:

| Ordner | Inhalt | `type` |
|---|---|---|
| `backlog/` | `BACKLOG.md` mit der Bindung an das maßgebliche Planungssystem | keiner |
| `memory/` | dauerhafte Hinweise, die sich anderswo nicht ableiten lassen, mit ihrem Index `MEMORY.md` | keiner |
| `knowledge/` | Fachwissen, Synthese und Schnappschüsse externer Quellen | `knowledge`, `fact` |
| `playbooks/` | wiederholbare Abläufe | `playbook` |
| `templates/` | die eigenen Vorlagen des Nutzers. Qatlas legt dort nichts an und aktualisiert nichts | wie das Ziel der Vorlage |
| `project/`, `planning/`, `conventions/`, `architecture/`, `testing/`, `contributing/`, `operations/` | Details der gleichnamigen reservierten Datei, die der Einstieg bleibt und jede dieser Dateien mit ihrer Lesebedingung nennt | keiner |
| `zone-import/` | per gitignore ausgeschlossener Puffer für nicht vertrauenswürdiges Rohmaterial | keiner |
| `zone-export/` | per gitignore ausgeschlossener Puffer nur für ausdrücklich verlangte Lieferergebnisse | keiner |

Eine Datei im Ordner einer reservierten Datei entsteht aus zwei Gründen: Die reservierte Datei überschreitet
ihre [Umfangsgrenze](size-limits.md), oder ein Teil ihres Inhalts wird nur für eine engere Arbeit gebraucht
und bekommt deshalb eine eigene Lesebedingung.

Lege im Wissensraum nie einen weiteren Ordner oder Unterordner an, außer der Nutzer verlangt es
ausdrücklich. Einzige Ausnahme ist `zone-import/processed/<yyyy-mm>/`. Inhalt, der in keinen Ordner und keine reservierte Datei passt, ist eine
Frage an den Nutzer, kein Grund für einen neuen Ordner.

- Aktualisiere bestehende Memories, statt sie zu duplizieren. Neue Memories entstehen auch auf ausdrückliche
  Bitte des Nutzers und bekommen genau eine Indexzeile. Mit `memory.enable: false` lege keine Memory-Dateien
  an.
- Nur erfolgreich verarbeitete Originale ziehen von `zone-import/` nach `processed/<yyyy-mm>/`. Ein Original
  zu archivieren ist Routine, eine Zone zu leeren ist ein Löschen. Lege nie von dir aus etwas in
  `zone-export/` ab.
- Große oder sich ändernde Binärdateien gehören in einen Dateispeicher oder Git LFS, nicht dauerhaft in eine
  Zone.
- Technische Projektkonfiguration liegt unter `.qatlas/plugins/`, Projektkennung, Arbeitsdateien von
  Agenten und die ausgecheckten Issues des lokalen Backlogs unter `.qatlas/local/`, Laufzeitzustand unter
  `~/.qatlas/projects/`. Nichts davon gehört zum Wissensraum.

## FRAMEWORK.md

Eine `FRAMEWORK.md` gibt es nur außerhalb des Wissensraums, neben der README eines Fachbereichs, meist in
Textrepos wie Obsidian-Vaults, Markdown-Sammlungen oder einem persönlichen OS. Schlage sie dem Nutzer vor und
lege sie erst nach seiner Zustimmung an, sobald der Bereich eigene Arbeitsregeln, Besonderheiten oder
Ausnahmen bestätigt hat. Die README dieses Bereichs nennt die Arbeit, vor der sie gelesen werden muss. Sie
enthält kein allgemeines Fachwissen und wiederholt weder native Projektanweisungen noch einzelne Policies.
Arbeitsregeln für das Projekt als Ganzes gehören in `CONVENTIONS.md`.

## Library des Nutzers

`~/qatlas/` gehört dem Nutzer, ist optional und hält nur Projektübergreifendes. Sie folgt dem Layout des
Wissensraums mit den Aufgaben, die über Projekte hinweg gelten können: `PLANNING.md`, `CONVENTIONS.md`,
`TESTING.md`, `CONTRIBUTING.md` und `OPERATIONS.md` mit ihren gleichnamigen Ordnern sowie `knowledge/`,
`playbooks/` und `templates/`. `PROJECT.md` und `ARCHITECTURE.md` gibt es dort nicht.

- Einstieg ist `AGENTS.qatlas.md`. Sie nennt jede vorhandene reservierte Datei der Library mit ihrer
  Lesebedingung.
- Aufgabe, Frontmatter, Dateinamen und Umfangsgrenzen gelten wie im Wissensraum.
- Die gleichnamige Datei eines Projekts hat Vorrang. Was ein Projekt bindet, steht in dessen Wissensraum und
  zieht mit dem Repo.
- Lege in der Library nur auf Wunsch des Nutzers etwas an. Vorhandene Ordner und Namen, die diesem Layout
  nicht folgen, bleiben, bis der Nutzer `qatlas-core migrate library` aufruft.

## Dateinamen

Eine Datei in einem Ordner des Wissensraums heißt `<präfix>-<slug>.md`. Das Präfix ist der Name ihres
Ordners, etwa `architecture-`, `conventions-`, `knowledge-` oder `memory-`. Nur bei `playbooks/` lautet es
`playbook-`. Reservierte Dateien, `BACKLOG.md` und `MEMORY.md` behalten ihren festen Namen, und die Vorlagen
in `templates/` benennt der Nutzer. Der Slug ist Kebab-Case und je Ordner eindeutig. Ihn umzubenennen ist
eine Umstrukturierung samt allen Verweisen.

Funktionsdateien, technische Formate und rohe Zonenartefakte folgen ihren festen Namen oder eigenen
Formaten. Nenne den Geltungsbereich, wenn ein Funktionsname mehrdeutig ist.
