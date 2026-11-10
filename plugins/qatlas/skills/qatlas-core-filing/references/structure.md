---
description: >
  Aufbau des Projekt-Wissensraums .qatlas-project/: AGENTS.md als Einstieg, die reservierten Root-Dateien mit
  ihrer Aufgabe und Lesebedingung, die festen Ordner mit ihren Typen, das Verbot weiterer Ordner, die
  Zeilengrenze, Zonen, FRAMEWORK.md außerhalb des Raums, Dateinamen und Task-IDs.
---

# Projekt-Wissensraum

`.qatlas-project/` ist der versionierte, im Repo geführte Stand von Wissen und Arbeit. Er hält fest, wie das
Projekt gebaut, geprüft, bearbeitet und gepflegt wird. Der Fachinhalt des Repos bleibt an seinem
maßgeblichen Ort: In einem persönlichen OS liegen Policies zu Weiterbildung oder Finanzen außerhalb, Policies
zu Struktur und Pflege der Sammlung innerhalb. Bestehende Spezifikationen und Dokumentationsbäume werden
nicht dupliziert. Außerhalb des Wissensraums gelten die vorhandenen lokalen Strukturen und werden nicht auf
dieses Layout umgestellt. Nur der Inhalt der beiden Zonen bleibt unversioniert; eine Entscheidung des Nutzers
darf den ganzen Wissensraum lokal per gitignore ausschließen.

## Einstieg

Die `AGENTS.md` des Repos ist der Einstieg. Ihr Abschnitt `Projektwissen` nennt jede vorhandene reservierte
Datei, jeweils mit der Lesebedingung, die sagt, vor welcher Arbeit sie gelesen wird. Im Wissensraum gibt es
keine README. Wird eine reservierte Datei angelegt, ergänze ihre Zeile in `AGENTS.md`; wird sie entfernt,
entferne die Zeile.

## Reservierte Root-Dateien

Jede reservierte Datei hat eine Aufgabe und einen festen Namen. Daneben wird nichts erfunden: Inhalt, der zu
einer Aufgabe passt, gehört in diese Datei, Inhalt, der zu keiner passt, ist eine Frage an den Nutzer. Init
legt keine davon an; jede entsteht mit ihrem ersten Eintrag und bleibt schlank. Eine reservierte Datei
enthält nur, was Code, Tests, Linter und Hooks nicht ohnehin durchsetzen.

| Datei | Aufgabe | Standard-Lesebedingung | `type` |
|---|---|---|---|
| `CONVENTIONS.md` | wie gearbeitet wird: Codestil, Benennung, Muster, Ablage, verbotene Praktiken | vor dem Schreiben von Code oder Dateien | `policy` |
| `ARCHITECTURE.md` | wie das System gebaut ist: Module, Datenflüsse, Abhängigkeiten, Grenzen, mit dem Grund jeder bindenden Entscheidung | vor dem Ändern von Struktur, Modulen oder Schnittstellen | `knowledge` |
| `TESTING.md` | wie das Projekt geprüft wird: die Teststrategie des Projekts mit Befehlen, Stufen, Nachweis, Ressourcen, Abdeckungserwartungen und was vor einem Commit oder einer Übergabe grün sein muss | vor dem Ausführen von Prüfungen oder dem Ändern von Tests oder CI | `policy` |
| `CONTRIBUTING.md` | wie Änderungen landen: Branch-Muster, Kontroll-Branch und sein Schutz, Pull-Request-Integration und Plattform, Merge-Form, Definition of Done | vor dem Branchen, Committen oder Öffnen eines Pull Requests | `policy` |

Was in jeder Session gelten muss, etwa Zweck, Grenzen, Sichtbarkeit und die Lesebedingungen, bleibt in
`AGENTS.md`; was über alle Projekte hinweg gilt, bleibt in der Library des Nutzers. Eine Entscheidung wird
mit ihrem Grund in die reservierte Datei eingearbeitet, die sie betrifft; es gibt kein Entscheidungsregister,
und überholter Inhalt wird ersetzt, nicht archiviert.

## Zeilengrenze

Eine reservierte Datei umfasst höchstens 300 Zeilen einschließlich Frontmatter. Darüber hinaus verlagere
Details in den gleichnamigen Ordner in Kleinschreibung, etwa `conventions/`, und behalte die Datei als
Einstieg, der dorthin verweist; schneide nach Gegenstand, nicht nach Datum. Doctor meldet eine Datei über der
Grenze und ändert nichts.

## Feste Ordner

Init legt `backlog/BACKLOG.md`, die Zonen `zone-import/` und `zone-export/` mit je einer `.gitkeep` und,
sofern die Plugin-Konfiguration das Repo-Memory nicht abschaltet (`memory.enable: false`), `memory/MEMORY.md`
an. Jeder andere Ordner entsteht zusammen mit seinem ersten Eintrag. Ohne `.qatlas-project/` ist das Projekt
bewusst nicht eingerichtet: Lege keine seiner Dateien an, was auch immer die Konfiguration sagt; Init ist der
ausdrückliche Schritt des Nutzers. Jeder Ordner enthält genau die aufgeführten Typen:

| Ordner | Inhalt | `type` |
|---|---|---|
| `backlog/` | Weiterleitung zum maßgeblichen Planungssystem und, falls lokal, dessen Arbeitspakete | `meta`, `task` |
| `memory/` | dauerhafte Hinweise, die sich anderswo nicht ableiten lassen, mit ihrem Index `MEMORY.md` | `memory`, `meta` |
| `plans/` | in Tasks geschnittene Vorhaben, als Referenz geführt | `plan` |
| `knowledge/` | Fachwissen, Synthese und Schnappschüsse externer Quellen | `knowledge`, `fact` |
| `playbooks/` | wiederholbare Abläufe | `playbook` |
| `templates/` | die eigenen Vorlagen des Nutzers; Qatlas legt dort nichts an und aktualisiert nichts | wie das Ziel der Vorlage |
| `conventions/`, `architecture/`, `testing/`, `contributing/` | Details, die aus der gleichnamigen reservierten Datei ausgelagert wurden, die der Einstieg bleibt | wie diese Datei |
| `zone-import/` | per gitignore ausgeschlossener Puffer für nicht vertrauenswürdiges Rohmaterial | keiner |
| `zone-export/` | per gitignore ausgeschlossener Puffer nur für ausdrücklich verlangte Lieferergebnisse | keiner |

Lege im Wissensraum nie einen weiteren Ordner oder Unterordner an, außer der Nutzer verlangt es
ausdrücklich. Ausnahmen sind die Struktur, die der Backlog-Vertrag innerhalb von `backlog/` festlegt, und
`zone-import/processed/<yyyy-mm>/`. Inhalt, der in keinen Ordner und keine reservierte Datei passt, ist eine
Frage an den Nutzer, kein Grund für einen neuen Ordner.

- Aktualisiere bestehende Memories, statt sie zu duplizieren. Neue Memories entstehen auch auf ausdrückliche
  Bitte des Nutzers und bekommen genau eine Indexzeile. Mit `memory.enable: false` lege keine Memory-Dateien
  an.
- Nur erfolgreich verarbeitete Originale ziehen von `zone-import/` nach `processed/<yyyy-mm>/`. Ein Original
  zu archivieren ist Routine, eine Zone zu leeren ist ein Löschen. Lege nie von dir aus etwas in
  `zone-export/` ab.
- Große oder sich ändernde Binärdateien gehören in einen Dateispeicher oder Git LFS, nicht dauerhaft in eine
  Zone.
- Technische Projektkonfiguration liegt unter `.qatlas/plugins/`, checkout-lokaler Laufzeitzustand unter
  `.qatlas/local/`; beides gehört nicht zum Wissensraum.

## FRAMEWORK.md

Eine `FRAMEWORK.md` gibt es nur außerhalb des Wissensraums, neben der README eines Fachbereichs, meist in
Textrepos wie Obsidian-Vaults, Markdown-Sammlungen oder einem persönlichen OS. Schlage sie dem Nutzer vor und
lege sie erst nach seiner Zustimmung an, sobald der Bereich eigene Arbeitsregeln, Besonderheiten oder
Ausnahmen bestätigt hat. Die README dieses Bereichs nennt die Arbeit, vor der sie gelesen werden muss. Sie
enthält kein allgemeines Fachwissen und wiederholt weder native Projektanweisungen noch einzelne Policies.
Arbeitsregeln für das Projekt als Ganzes gehören in `CONVENTIONS.md`.

## Dateinamen

Inhaltsdateien heißen `<type>-<slug>.md`; das Präfix ist immer der Frontmatter-`type`. Nur Tasks tragen eine
ID: `task-<id>-<slug>.md`. Reservierte Dateien und `meta`-Dateien behalten ihre reservierten Namen ohne
Präfix. Der Slug ist Kebab-Case und je Typ im ganzen Wissensraum eindeutig. Ihn umzubenennen ist eine
Umstrukturierung samt allen Verweisen.

Die Task-ID ist eine fortlaufende Dezimalzahl über den ganzen Wissensraum, einschließlich der
Backlog-Projekte. Alle vorhandenen Task-IDs findest du so:

```sh
find .qatlas-project -type f -name 'task-*.md' | grep -E '/task-[0-9]{4,}-[^/]*$'
```

Wähle den höchsten Wert plus eins und fülle auf mindestens vier Stellen auf; ohne Treffer beginnt es bei
`0001`. Prüfe vor dem Schreiben und vor dem Integrieren erneut auf Kollisionen. Bei parallelen neuen
Einträgen nimmt der noch nicht integrierte Eintrag die nächste freie ID samt angepassten Verweisen. IDs
werden nie wiederverwendet und nie aus kosmetischen Gründen neu nummeriert. Task-IDs anderer Form zählen
nicht und bleiben unverändert.

Funktionsdateien, technische Formate und rohe Zonenartefakte folgen ihren festen Namen oder eigenen
Formaten. Nenne den Geltungsbereich, wenn ein Funktionsname mehrdeutig ist.
