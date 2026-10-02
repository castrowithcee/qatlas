---
description: >
  Aufbau des Projektwissensraums .qatlas-project/: Gegenstand, Navigationsknoten, Funktionsdateien und
  -ordner, Zonen, Vorlagen sowie Dateipräfixe und fortlaufende Kennungen.
license: MIT
type: rule
edit: locked
---

# Projektwissensraum

`.qatlas-project/` ist der versionierte, repo-eigene Wissens- und Arbeitszustand. Er hält Zweck, Aufbau,
Architektur, Konventionen und Entscheidungen über das Projekt und seine Pflege. Der fachliche Inhalt des
Repos bleibt an seinem maßgeblichen Ort: In einem Personal OS liegen etwa Weiterbildungsentscheidungen und
Finanzregeln außerhalb, Entscheidungen über Struktur und Pflege des Bestands innerhalb. Vorhandene
Spezifikationen und Dokumentationsbäume werden nicht dupliziert. Außerhalb des Wissensraums gelten die
vorhandenen lokalen Strukturen; sie werden nicht auf dieses Schema umgeordnet. Nur die beiden Zonen bleiben
unversioniert; eine Nutzerentscheidung darf den gesamten Wissensraum lokal gitignorieren.

## Navigationsknoten

- Die Root-`README.md` erklärt den Projektzustand, grenzt fachliche Repo-Inhalte ab und nennt deren
  tatsächliche Einstiegspunkte mit eindeutigen Lesebedingungen.
- Eine weitere README entsteht nur für einen eigenen Scope. Sie ist kein Vollinventar, Fachartikel,
  Regelwerk, Memory oder Arbeitsjournal.
- Jede README im Wissensraum bleibt einschließlich Frontmatter bei höchstens 80 Zeilen und 500 durch
  Leerraum getrennten Wörtern. Lagere Details aus, ohne bindende Aussagen wegzukürzen. Eine vorhandene
  längere README wird vollständig gelesen und als Befund gemeldet, nicht abgeschnitten.
- Eine `FRAMEWORK.md` entsteht neben der README erst mit bestätigten eigenen Regeln des Scopes, und die
  README nennt, für welche Arbeit sie vorher zu lesen ist. Sie enthält keine
  allgemeine Fachkunde und wiederholt weder native Projektanweisungen noch einzelne begründete
  Entscheidungen.
- Lege im Wissensraum kein neues `INDEX.md` an.
- Pflegebefugnis für Navigation und Fakten erzeugt keine neue Regelautorität und erlaubt keine Änderung der
  Projektabsicht.

## Funktionsdateien und -ordner

- `MEMORY.md`: Index des Repo-Memorys. `HISTORY.md`: fortlaufender Verlauf eines Scopes. Diese Namen,
  `README.md`, `FRAMEWORK.md` und `BACKLOG.md` sind exklusiv und tragen kein Präfix.
- `backlog/`: Routing zum maßgeblichen Planungssystem und, wenn lokal gewählt, der lokale Backlog. Aufbau
  und Lebenszyklus bestimmt die Backlog-Norm. `BACKLOG.md` und `MEMORY.md` bestehen jeweils nur einmal auf
  Projektebene.
- `memory/`: dauerhafte, nicht anderweitig ableitbare Hinweise. Aktualisiere vorhandene Memories, statt sie
  zu duplizieren. Neue Memories entstehen auch auf ausdrückliche Bitte des Nutzers und erhalten genau eine
  Indexzeile.
- Inhaltsbereiche wie `overview/`, `decisions/`, `conventions/`, `architecture/` und `knowledge/` entstehen
  erst mit ihrem ersten Inhalt direkt unter der Wissenswurzel. Erfordern mehrere eigenständige Gegenstände es
  wirklich, darf der Bestand bewusst darunter gegliedert werden, etwa nach `marketplace/` und `cli/`.
  Gemeinsame Aussagen bleiben einmal am gemeinsamen Ort. Eine neue Repo-Grenze oder eine Liste möglicher
  Bereiche erzeugt keine vorsorgliche Struktur.
- `templates/`: optionale, versionierte Vorlagenbibliothek des Nutzers. Qatlas legt dort nichts ab und
  aktualisiert nichts. Vorlagen tragen beschreibende Namen, nie reservierte Funktionsnamen.
- `zone-import/`: gitignorierter Puffer für nicht vertrauenswürdiges Rohmaterial. Dauerhafter Inhalt wird
  richtig abgelegt; nur erfolgreich verarbeitete Originale wandern nach `processed/<yyyy-mm>/`.
- `zone-export/`: gitignorierter Puffer ausschließlich für ausdrücklich angeforderte Lieferobjekte. Lege
  dort nie von selbst etwas ab.

Die beiden Zonen sind stets vorhanden. Ein Original zu archivieren ist Routine, eine Zone zu leeren ist eine
Löschung. Große oder veränderliche Binärdateien gehören in einen Dateispeicher oder Git LFS, nicht dauerhaft
in eine Zone. Technische Projektkonfiguration und der Prüfstand projektbezogener Plugin-Updates liegen unter
`.qatlas/plugins/`, checkout-lokaler Laufzeitzustand unter `.qatlas/local/`; keiner davon gehört zum
Wissensraum.

## Dateikennungen

Neue Inhaltsdateien heißen `<präfix>-<id>-<slug>.md`. Wähle das Präfix nach dem Gegenstand:

| Präfix | Gegenstand |
|---|---|
| `overview` | Projektzweck und Grenzen |
| `decision` | allgemeine Projektentscheidung |
| `adr` | Architekturentscheidung |
| `convention` | Konvention |
| `arch` | aktuelle Architekturbeschreibung |
| `req` | Anforderung |
| `plan` | dauerhafter Plan ohne externen Spiegel |
| `task` | lokales Arbeitspaket |
| `ops` | Betriebsverfahren |
| `quality`, `risk`, `history` | Qualität, Risiko oder Historie |
| `memory`, `template` | Memory oder Nutzervorlage |

Das Präfix verpflichtet zu keinem Ordner, bleibt aber auch in einem gleichnamigen Typordner sichtbar. Es
muss nicht dem Frontmatter-`type` entsprechen.

Die ID ist je Präfix eine fortlaufende Dezimalzahl über die gesamte Wissenswurzel, auch über fachliche
Unterbereiche und Archive. Ermittle alle vorhandenen Kennungen des Präfixes, etwa für Tasks:

```sh
find .qatlas-project -type f -name 'task-*.md' | grep -E '/task-[0-9]{4,}-[^/]*$'
```

Wähle eins mehr als den höchsten Wert und fülle auf mindestens vier Stellen auf; ohne Treffer beginnt sie bei
`0001`. Prüfe vor dem Schreiben und vor der Integration erneut auf Kollisionen. Bei parallelen neuen
Einträgen erhält der noch nicht integrierte Eintrag die nächste freie ID samt angepassten Verweisen. IDs
werden nicht wiederverwendet; Präfix und ID bleiben stabil und werden nicht kosmetisch neu nummeriert.
Ältere Kennungen anderer Form zählen für die Vergabe nicht mit und bleiben unverändert.

`knowledge/` enthält tatsächliches Fachwissen oder Synthesen mit sprechenden Namen ohne verpflichtendes
Präfix oder Nummer. Funktionsdateien, technische Formate und rohe Zonenartefakte folgen ihren festen Namen
oder eigenen Formaten. Bei mehrdeutigen Funktionsnamen nenne den Scope.
