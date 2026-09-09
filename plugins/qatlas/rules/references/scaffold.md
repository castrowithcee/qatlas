---
description: >
  Vollständige, vor schreibender Arbeit unter .qatlas-project/ geladene Rule-Referenz für README-Navigation,
  Ablage, Dateikennungen, Zonen und den Schutz vorhandener Nutzerdateien.
license: MIT
type: rule
edit: locked
---

# Vollständiger Vertrag des Projektwissensraums

`.qatlas-project/` ist der versionierte Wissens- und Arbeitszustand des Repos. Er hält Zweck, Aufbau,
Konventionen und Entscheidungen über das Projekt und seine Pflege. Fachliche Inhalte des Repos bleiben an
ihren maßgeblichen Orten: Persönliche Entscheidungen oder Finanzregeln eines Personal OS gehören nicht
hierher, seine Strukturentscheidungen und Pflegekonventionen dagegen schon. Vorhandene Spezifikationen und
Dokumentationsbäume werden nicht dupliziert. Nur die beiden Zonen bleiben unversioniert. Eine
Nutzerentscheidung darf den gesamten Wissensraum lokal gitignorieren. Vorhandene Nutzerdateien werden nie
pauschal ersetzt.

## Navigation

Die Root-`README.md` erklärt den Projektzustand, grenzt fachliche Repo-Inhalte ab und nennt deren
tatsächliche Einstiegspunkte. Innerhalb des Wissensraums übernimmt eine README für ihren Scope Navigation,
knappe lokale Leitplanken und die nächsten relevanten Quellen mit eindeutigen Lesebedingungen. Sie ist kein
Vollinventar, Fachartikel, Memory oder Arbeitsjournal. Ein weiterer README-Knoten entsteht nur bei einem
eigenen Scope. Das lokale Routing gewinnt vor einem ausgelieferten Startpunkt.

Jede README im Wissensraum trägt `type: meta` und `edit: shared` und bleibt einschließlich Frontmatter bei
höchstens 80 Zeilen und 500 durch Leerraum getrennten Wörtern. Lagere Details aus, ohne bindende Aussagen
wegzukürzen. Eine vorhandene längere README wird vollständig gelesen und als Befund gemeldet; schneide sie
nicht ab. Pflegebefugnis für Navigation und Fakten erzeugt keine neue Regelautorität und erlaubt keine
Änderung der Projektabsicht.

## Funktionsdateien und -ordner

- `README.md`: Einstieg und Navigation eines Scopes, `type: meta`, `edit: shared`.
- `MEMORY.md`: Index des Repo-Memorys.
- `BACKLOG.md`: beim Sessionstart geladener Wegweiser zum maßgeblichen lokalen oder externen
  Planungssystem.
- `HISTORY.md`: fortlaufender Verlauf eines Scopes, `type: meta`, `edit: shared`.

Diese Namen sind exklusiv und tragen kein Präfix.

- `backlog/`: Routing zum maßgeblichen Planungssystem und, wenn lokal gewählt, Tasks, optionale Projekte
  mit `README.md` und `done/`. Seine eigene Rule und sein vollständiger Vertrag bestimmen Binding, Aufbau
  und Lebenszyklus. BACKLOG und MEMORY bestehen jeweils nur einmal auf Projektebene.
- `memory/`: dauerhafte, nicht anderweitig ableitbare Hinweise. `MEMORY.md` wird beim Sessionstart direkt
  injiziert; öffne daraus nur aufgabenrelevante Dateien, prüfe ihre Aussagen gegen den aktuellen Stand und
  aktualisiere vorhandene Memories statt sie zu duplizieren. Neue Memories entstehen auch auf ausdrückliche
  Bitte des Nutzers, tragen `type: memory` und `edit: shared` und erhalten genau eine Indexzeile.
- Wissensbereiche wie `overview/`, `decisions/`, `conventions/`, `architecture/` und `knowledge/`
  entstehen erst mit ihrem ersten Inhalt. Ein zunächst flacher Wissensraum darf bei echtem Bedarf bewusst
  nach Gegenständen gegliedert werden; gemeinsame Aussagen bleiben einmal am gemeinsamen Ort. Eine neue
  Repo-Grenze erzeugt keine automatische Umordnung.
- `templates/`: optionale, versionierte Vorlagenbibliothek des Nutzers. Qatlas legt dort nichts ab und
  aktualisiert nichts. Vorlagen tragen beschreibende Namen, nie reservierte Funktionsnamen.
- `zone-import/`: gitignorierter Puffer für nicht vertrauenswürdiges Rohmaterial. Lege dauerhaften Inhalt
  richtig ab und verschiebe nur erfolgreich verarbeitete Originale nach `processed/<yyyy-mm>/`.
- `zone-export/`: gitignorierter Puffer ausschließlich für ausdrücklich angeforderte Lieferobjekte. Lege
  dort nie von selbst etwas ab.

Die beiden Zonen sind stets vorhanden. Ein Original zu archivieren ist Routine, eine Zone zu leeren ist
eine Löschung. Große oder veränderliche Binärdateien gehören in einen Dateispeicher oder Git LFS, nicht
dauerhaft in eine Zone. Qatlas' aktuelle Vorlagen liegen im versionsgebundenen Plugin-Store.

Technische Projektkonfiguration und der versionierte Prüfstand projektbezogener Plugin-Updates liegen unter
`.qatlas/plugins/`. Checkout-lokaler Laufzeitzustand liegt unter `.qatlas/local/`. Keiner dieser technischen
Orte ist Teil des Projektwissensraums.

## Dateikennungen

Neue Inhaltsdateien heißen `<präfix>-<id>-<slug>.md`. Verwende `overview`, `decision`, `adr`, `convention`,
`arch`, `req`, `plan`, `task`, `ops`, `quality`, `risk`, `history`, `memory` oder `template` nach dem
Gegenstand. `decision` bezeichnet allgemeine Projektentscheidungen, `adr` ausschließlich
Architekturentscheidungen. Die Liste verpflichtet zu keinem Ordner. Ein Präfix bleibt auch in einem
gleichnamigen Typordner sichtbar.

Eine ID ist eine fortlaufende Dezimalzahl je Präfix über die gesamte Wissenswurzel, mindestens vierstellig.
Archive zählen mit. Ermittle vor Vergabe den höchsten vorhandenen Wert und prüfe vor der Integration erneut
auf Kollisionen. Bei parallelen neuen Einträgen erhält der noch nicht integrierte Eintrag bei Bedarf die
nächste freie ID; passe seine Verweise an. IDs werden nicht wiederverwendet, Präfix und ID bleiben stabil,
und historische Kennungen werden nicht kosmetisch neu nummeriert.

Dateien in `knowledge/` verwenden sprechende Namen ohne verpflichtendes Präfix oder Nummer, behalten aber
Frontmatter. Funktionsdateien, technische Formate und rohe Zonenartefakte folgen ihren festen Namen oder
eigenen Formaten. Bei mehrdeutigen Funktionsnamen nenne den Scope.

## Pflege und Geltung

Beschreibende Architektur, Wissen, Navigation und operative Dokumentation sind gewöhnlich `edit: shared`.
Akzeptierte Nutzerentscheidungen und tatsächlich normative Vorgaben bleiben `edit: locked`; vorhandene
Locks werden nie pauschal entfernt. Aktualisiere einen Architektur-Fakt nach autorisierter Umsetzung, ohne
dadurch eine akzeptierte Entscheidung zu entsperren. Weder Verschieben noch Umbenennen, `type`, Präfix,
Dotfolder-Lage oder bloßes Lesen ändern Bearbeitungsrecht, Geltungsbereich oder Rang einer Aussage.
