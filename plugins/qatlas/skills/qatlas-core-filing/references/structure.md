---
description: >
  Aufbau des Projekt-Wissensraums .qatlas-brain/: AGENTS.md als Einstieg, die reservierten Root-Dateien mit
  ihrer Aufgabe und Lesebedingung, die festen Ordner mit ihren Typen, das Verbot weiterer Ordner,
  Zonen, FRAMEWORK.md außerhalb des Raums, die Library des Nutzers und Dateinamen.
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

## Reservierte Root-Dateien

Jede reservierte Datei hat eine Aufgabe und einen festen Namen. Daneben wird nichts erfunden: Inhalt, der zu
einer Aufgabe passt, gehört in diese Datei, Inhalt, der zu keiner passt, ist eine Frage an den Nutzer. Init
legt keine davon an. Jede entsteht mit ihrem ersten Eintrag und bleibt schlank. Eine reservierte Datei
enthält nur, was Code, Tests, Linter und Hooks nicht ohnehin durchsetzen.

| Datei | Aufgabe | Standard-Lesebedingung | `type` |
|---|---|---|---|
| `PROJECT.md` | was das Projekt sein soll: Zweck, Zielgruppe, Zielbild, Nicht-Ziele und bindende Produktentscheidungen mit ihrem Grund | vor dem Klären, Planen oder Zuschneiden von Arbeit | `policy` |
| `CONVENTIONS.md` | wie gearbeitet wird: Codestil, Benennung, Muster, Ablage, verbotene Praktiken | vor dem Schreiben von Code oder Dateien | `policy` |
| `ARCHITECTURE.md` | wie das System gebaut ist: Module, Datenflüsse, Abhängigkeiten, Grenzen, mit dem Grund jeder bindenden Entscheidung | vor dem Ändern von Struktur, Modulen oder Schnittstellen | `knowledge` |
| `TESTING.md` | wie das Projekt geprüft wird: die Teststrategie des Projekts mit Befehlen, Stufen, Nachweis, Ressourcen, Abdeckungserwartungen und was vor einem Commit oder einer Übergabe grün sein muss | vor dem Ausführen von Prüfungen oder dem Ändern von Tests oder CI | `policy` |
| `CONTRIBUTING.md` | wie Änderungen landen: Branch-Muster, Kontroll-Branch und sein Schutz, Pull-Request-Integration und Plattform, Merge-Form, Definition of Done | vor dem Branchen, Committen oder Öffnen eines Pull Requests | `policy` |

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

Fehlt `PROJECT.md` in einem eingerichteten Projekt, entsteht sie im Gespräch, in neuen wie in bestehenden
Projekten nach derselben Regel: Verfahren und Bestätigung stehen unter `PROJECT.md` in
[Reservierte Datei füllen](playbook-reserved-files.md).

## Feste Ordner

Init legt `backlog/BACKLOG.md`, die Zone `zone-import/` mit einer `.gitkeep` und,
sofern die Plugin-Konfiguration das Repo-Memory nicht abschaltet (`memory.enable: false`), `memory/MEMORY.md`
an. Jeder andere Ordner entsteht zusammen mit seinem ersten Eintrag. Ohne `.qatlas-brain/` ist das Projekt
bewusst nicht eingerichtet: Lege keine seiner Dateien an, was auch immer die Konfiguration sagt, denn Init ist
der ausdrückliche Schritt des Nutzers. Jeder Ordner enthält genau die aufgeführten Typen:

| Ordner | Inhalt | `type` |
|---|---|---|
| `backlog/` | `BACKLOG.md` mit der Bindung an das maßgebliche Planungssystem | `meta` |
| `memory/` | dauerhafte Hinweise, die sich anderswo nicht ableiten lassen, mit ihrem Index `MEMORY.md` | `memory`, `meta` |
| `knowledge/` | Fachwissen, Synthese und Schnappschüsse externer Quellen | `knowledge`, `fact` |
| `playbooks/` | wiederholbare Abläufe | `playbook` |
| `templates/` | die eigenen Vorlagen des Nutzers. Qatlas legt dort nichts an und aktualisiert nichts | wie das Ziel der Vorlage |
| `project/`, `conventions/`, `architecture/`, `testing/`, `contributing/` | Details, die aus der gleichnamigen reservierten Datei ausgelagert wurden, die der Einstieg bleibt | wie diese Datei |
| `zone-import/` | per gitignore ausgeschlossener Puffer für nicht vertrauenswürdiges Rohmaterial | keiner |
| `zone-export/` | per gitignore ausgeschlossener Puffer nur für ausdrücklich verlangte Lieferergebnisse | keiner |

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

`~/qatlas/` gehört dem Nutzer, ist optional und hält nur Projektübergreifendes. Sie ersetzt keine reservierte
Datei eines Projekts: Was ein Projekt bindet, steht in dessen Wissensraum und zieht mit dem Repo. Legst du in
der Library auf Wunsch des Nutzers eine Datei an, gelten Frontmatter, Typen und Dateinamen des Wissensraums
und je Typ ein Ordner: `policies/`, `playbooks/` und `knowledge/`. Eine projektübergreifende Konvention ist
eine `policy`. Vorhandene Ordner und Namen der Library bleiben, wie sie sind.

## Dateinamen

Inhaltsdateien heißen `<type>-<slug>.md`: Das Präfix ist immer der Frontmatter-`type`. Reservierte Dateien
und `meta`-Dateien behalten ihre reservierten Namen ohne Präfix. Der Slug ist Kebab-Case und je Typ im ganzen
Wissensraum eindeutig. Ihn umzubenennen ist eine Umstrukturierung samt allen Verweisen.

Funktionsdateien, technische Formate und rohe Zonenartefakte folgen ihren festen Namen oder eigenen
Formaten. Nenne den Geltungsbereich, wenn ein Funktionsname mehrdeutig ist.
