---
name: qatlas-core-filing
description: >
  Entscheide, wohin eine Datei gehört und wie der Ordnerbaum wächst. Nutze dies,
  wann immer du eine Inhaltsdatei anlegst, platzierst, verschiebst, promotest
  oder umstrukturierst: welcher Bereichsordner, flach-mit-Präfix vs. ein
  Typ-Ordner, welche Zone (work / zone-import / zone-export), und wie ein
  Entwurf über seinen Status aktiv wird. Nutze es auch bei "wo gehört das hin",
  "strukturier das um", "promote das" oder "qatlas-core-filing".
license: MIT
type: skill
edit: locked
---

# Ablage: wohin eine Datei gehört und wie der Baum wächst

Dieser Skill platziert Inhalt im Projekt **außerhalb** von `__qatlas__/`. Diese Schicht folgt Qatlas'
Scaffold-Norm, und nichts hier gilt für sie.

## Arbeitskontext

Beurteile Entwicklungsarbeit und operative Arbeit anhand des Pfads, in dem die Aufgabe tatsächlich
stattfindet, nicht anhand eines Labels am Repo-Root:

- Entwicklung umfasst klassische Codebasen einschließlich ihrer Dokumentation.
- Ops umfasst textlastige Repos wie Betriebssysteme, Wikis und Markdown-Wissensbasen einschließlich ihrer
  Scripts, Vorlagen und Codebeispiele.

Ein Repo kann beide Formen enthalten. Die Aufgabe am betroffenen Pfad entscheidet, welche Sicht gilt.

## Zwei Docs-Ordner, getrennt nach Leser

- `__qatlas__/docs/` ist für den Agenten geschrieben: Hintergrund vor dem Handeln, durchsuchbares
  Projektwissen und die Gründe für die Bauweise. Die eigene Rule des Ordners gilt; die Bereichslogik und
  Schwellen unten gelten dort nicht.
- Ein `docs/` am Repo-Root richtet sich an Menschen, die wie in einem Wiki etwas nachschlagen. Es gehört zum
  ausgelieferten Projekt und wird wie andere Inhalte hier abgelegt.

Der Leser entscheidet, nie die Stärke der Bindung ans Repo. Beide können eng gebunden sein. „Das betrifft
dieses Repo“ ist deshalb kein Argument für einen der Orte. Ein Root-`docs/` verweist NIEMALS auf die
Metaebene, also weder auf `__qatlas__` noch auf eine Rule oder einen Skill.

## Der Pfad ist die strukturelle Wahrheit

- **Keine `domain/area/topic`-Hierarchie.** Der Bereichsordner ist die oberste Ebene; Tiefe wächst nur in
  ihm, und nur dort, wo sie gebraucht wird.
- Bereich und Thema leben im **Ordnernamen**, nie im Frontmatter.
- Der Typ ist auch im Pfad sichtbar: als Präfix `<type>-<name>.md`, solange die Ablage flach bleibt, oder
  als Ordner `<type>/`, sobald gruppiert. **Wo Pfad und Frontmatter sich widersprechen, gewinnt das
  Frontmatter.** Rohzonen tragen gar keinen Typ.

Bereichsordner sind eine **ops**-Struktur, und ihr Register ebenso. In einem ops-Repo steht im Root in
`INDEX.md`, welche Bereiche und Themen existieren; der Agent nutzt nur, was dort steht, und legt keinen
neuen Bereich ohne Freigabe an. Diese Datei wird nicht mit dem Scaffold ausgeliefert. Sie entsteht mit dem
ersten Bereich, und bis dahin gibt es keine Bereiche zu registrieren. Ist stattdessen `index.md` vorhanden,
lies und pflege diese Form, aber erzeuge daneben keine `INDEX.md`.

Ein **Code**-Repo hat kein Bereichsregister und braucht keins: die Wurzel ist das Code-Projekt. Eine
`INDEX.md` im Root darf dort dennoch als allgemeiner Navigationsknoten dienen. Prüfe die Linse, bevor du ein
Register voraussetzt.

## Erst nach einer Vorlage schauen

`__qatlas__/templates/` ist ausschließlich die versionierte Vorlagenbibliothek des Nutzers. Bevor du eine
wiederkehrende Bereichsstruktur neu erfindest, etwa für Kunden, Projekte oder Objekte, prüfe sie auf eine
passende Vorlage und instanziiere diese. Qatlas legt dort keine eigenen Vorlagen ab und aktualisiert den
Ordner nicht.

Der **Store** unter `<plugin-root>/store/` trägt ausschließlich Qatlas' versionsgebundene Assets und
Vorlagen. Die Backlog-Referenz weist seine kanonischen Task- und Projektvorlagen direkt an; sie werden nie
aus dem Nutzerordner ersetzt. Bei einem anderen konkreten Bedarf lies `<plugin-root>/store/STORE.md`, wähle
dort den passenden Eintrag, öffne ausschließlich dessen Dateien und kopiere oder verwende sie für das
genannte Ziel. Eigene Vorlagen des Nutzers gehören nach `__qatlas__/templates/`, niemals in den Store.

## Zuerst der Bereichsordner

Operativer Inhalt lebt in einem flachen Wurzelordner `<area>-<topic>` (zum Beispiel `business-finance/`).
Wähle erst den richtigen Bereichsordner (aus dem Register), dann platziere die Datei darin. Passt nichts
sauber oder läuft ein Bereich über: rate nicht, schlag eine Anpassung vor und warte auf Freigabe.

## Standard-Platzierung und die >5-Schwelle

- **Standard: flach mit einem Typ-Präfix**, also `<area>-<topic>/<type>-<name>.md` (zum Beispiel
  `business-finance/fact-<name>.md`).
- **Ein Typ-Ordner, sobald mehr als 5 Dateien desselben Typs** in einem Ordner liegen → verschiebe sie in
  `<type>/` (jetzt ist der Ordner der Typ; das Präfix entfällt).
- **Unterthemen** entscheidet der Owner, nicht die Dateizahl. Die >5-Schwelle erzeugt nur einen Typ-Ordner,
  nie ein neues Thema. `fact` und `knowledge` dürfen groß werden, ohne geteilt zu werden.

## Typ → Platzierung

| `type` | Platzierung |
|---|---|
| `fact` · `knowledge` · `history` | Flach mit Präfix `<area>-<topic>/<type>-<name>.md`; sobald mehr als 5 desselben Typs → ein `<type>/`-Ordner. |
| `playbook` | Neben dem wiederkehrenden Prozess, dem es dient (`<area>-<topic>/[<subtopic>/]playbooks/`); sonst flach `playbook-<name>.md`. |
| `decision` | Zentral und datiert im Bereich: `<area>-<topic>/decisions/YYYY-MM-DD-….md`. Strukturelle und Meta-Entscheidungen betreffen das Framework, nicht einen Bereich. |
| `meta` | Als reservierte Funktionsdatei ohne Präfix: Arbeitsrahmen in `<scope>/FRAMEWORK.md`, Bestand und Navigation in `<scope>/INDEX.md`. Die Kaskade beginnt mit den optionalen Knoten im Repo-Root; jeder weitere Knoten entsteht erst, wenn sein Scope ihn braucht. |
| `task` | Im vom Nutzer oder Projekt festgelegten Planungssystem. Nur ohne solche Vorgabe gilt der lokale Qatlas-Backlog unter `__qatlas__/backlog/`; Ort und Lebenszyklus bestimmt dessen eigene Norm. |
| `memory` | In `__qatlas__/memory/`, erschlossen über seinen Index. Ebenfalls keine Ablageentscheidung. |

Regeln und Skills werden nie von Hand platziert. Sie werden mit dem Plugin ausgeliefert und in die Session
injiziert; eine Kopie davon im Repo ist ein Defekt, keine Platzierung.

**Vorrang** (entscheide in dieser Reihenfolge): eine zentrale `decision` → `meta`/Framework (flach) →
`playbook` (Prozess) → der Rest, flach mit Präfix.

## Verweise (Inhaltsmodell)

- **Inhalt verweist nie auf Meta.** Inhaltstypen (`fact`/`knowledge`/`playbook`/`history`) zitieren keine
  Meta- oder Rahmendatei (`AGENTS.md`, `FRAMEWORK.md`, Regeln, Skills). Abhängigkeiten laufen nur von Meta
  zu Inhalt (abwärts), nie zurück. So bricht ein Governance-Umbau keine Inhaltsdatei, und Inhalt bleibt
  selbstständig.
- `[[…]]` auf andere Inhaltsdateien ist erlaubt.
- Die einzige Ausnahme: eine `decision`, deren Gegenstand die Struktur selbst ist.

## Zonen

Die zwei `__qatlas__/`-Zonen werden zentral verwaltet. Für die Ablage relevant:

- **`<area>-<topic>/work/`**: die Werkbank des Bereichs: rohe, kopflose Arbeit in Arbeit, interne
  Unterstruktur erlaubt (zum Beispiel `work/2025/`). Sie hält die Bereichsebene **lesbar**:
  `<area>-<topic>/` sollte nur Typ-Ordner (und flache Typ-Dateien) zeigen. Alles, was sonst fremde Ordner
  erzeugen würde (Jahre, Ad-hoc-Gruppen), wandert in `work/` statt die Typ-Ordner zu verstecken.
- **`__qatlas__/zone-import/`** (Wurzel): rohe externe Eingaben, flüchtig, gitignored.
- **`__qatlas__/zone-export/`** (Wurzel): angeforderte menschliche Lieferobjekte, **nur auf ausdrückliche
  Anfrage**, ohne Typen, ohne Frontmatter. Nicht Teil der Wissensbasis; der Agent legt hier von sich aus
  nichts ab.

## Entwurf und Reife über den Status

Es gibt **keine separate Entwurfszone**. Ein Entwurf ist eine Datei mit `status: draft` an ihrem richtigen
Platz, und sie reift dort an Ort und Stelle. "Promotion" ist ein **Statuswechsel** (`draft → active`), kein
Verschieben; er braucht Freigabe.

- **`fact`/`knowledge`** werden direkt im richtigen `<area>-<topic>/` angelegt, erst `status: draft`, dann
  `status: active`.
- **`decision`**: `status: draft`, solange sie abgewogen wird; bei Freigabe `status: active`, Datum =
  Freigabedatum (nicht Entwurfsdatum), datiert in `decisions/…`.
- **Stehende Regeln** eines Bereichs wandern in seine `FRAMEWORK.md`.
- **Arbeitspakete**: Reife und Abschluss folgen dem maßgeblichen Planungssystem, nicht diesem Skill.

## Faule Tiefe: zwei getrennte Schwellen

Ordner erscheinen mit ihrer ersten Datei, nie leer auf Vorrat. **Zwei verschiedene Dinge, zwei Schwellen:**

- **Eine Unterebene (Unterthema): ab der 2. Datei derselben Art.** Eine einzelne Datei bleibt flach; die
  zweite erzeugt die benannte Unterebene. Ein Bereich darf direkt zu Typen gehen
  (`<area>-<topic>/knowledge/`), solange es nur ein Feld gibt.
- **Ein Typ-Ordner: ab mehr als 5 Dateien desselben Typs** (siehe oben).

**Migrations-Invariante:** vor dem zweiten Unterthema hebe erst das flache Material in die erste benannte
Unterebene, dann füge das neue daneben hinzu. Beispiel: `business-finance/knowledge/` plus ein neues
Unterthema → erst `business-finance/<subtopic-1>/knowledge/`, dann `business-finance/<subtopic-2>/`.

## Kaskade

Eine `FRAMEWORK.md` pro Bereich oder Unterthema, **faul und als Overlay**: sie entsteht nur, wenn der Ordner
eigene, wachsende Arbeitsregeln braucht (was das Rückgrat aus `AGENTS.md`, Regeln und Skills nicht schon
abdeckt), und sie beschreibt, wie dort gearbeitet wird (Suche, Identifikation, lokale Leitplanken). Sie wird
nur gelesen, wenn dort gearbeitet wird. Kein verschachteltes `AGENTS.md`/`CLAUDE.md` unten in der Tiefe: die
Kaskade läuft über die `FRAMEWORK.md`- und `INDEX.md`-Knoten nach der Qatlas-Norm, nicht über automatisches
Laden durch den Host. Vorhandene `framework.md` und `index.md` werden dabei gelesen und an Ort und Stelle
gepflegt; neue Knoten erhalten ausschließlich die kanonische Großschreibung.

## Platzierungsgrenzen

- **Kein Asset-Speicher.** Dies ist eine Planungsschicht, kein Speicher für Massen-, Medien- oder
  *wechselnde* Binärdateien. Erlaubt: ein kleines, stabiles Bild, wenn es *das* Artefakt ist (zum Beispiel
  ein Diagramm). Große Dateien → ein Dateispeicher oder Git LFS; flüchtige Eingaben →
  `__qatlas__/zone-import/`.
- **Selten aber wichtig → ein Playbook.** Eine Prozedur, die nur ein paar Mal im Jahr gebraucht wird, lebt
  als eigenes Playbook und wird anderswo mit einem Einzeiler-Verweis referenziert, damit die Pflichtlektüre
  schlank bleibt.
- **Ein Playbook ist neutral und wiederkehrend.** Es beschreibt die wiederholbare Prozedur (bei Werkzeugen:
  Felder, Optionen, Formulare, was wohin gehört), frei von fall- oder jahresspezifischen Zahlen; konkrete
  Werte → der richtige `fact` oder die `work/`-Zone.
