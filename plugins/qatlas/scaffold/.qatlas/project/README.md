# .qatlas/project/

Dieser Ordner ist die **von Qatlas verwaltete Projektschicht**. Alles, was der Agent zur Steuerung des
Projekts braucht, aber nicht dein eigener Inhalt ist, liegt hier an einem Ort, getrennt vom Root mit deiner
Arbeit und von lokaler Qatlas-Konfiguration.

## Warum es diesen Ordner gibt

Agentische Werkzeuge verteilen ihren Zustand gern: Memory an einem lokalen Ort, Notizen an einem anderen,
Rules irgendwo sonst. Wird das Repo verschoben oder auf einer zweiten Maschine geklont, ist dieser Zustand
weg oder unerreichbar. Im Projekt-Root bleibt außerdem unklar, welche Dateien dir und welche dem Werkzeug
gehören.

`.qatlas/project/` sammelt den versionierten Projektzustand an einem einzigen, selbsterklärenden Ort, der
mit dem Repo reist. Bis auf die flüchtigen Zonen unten wird er versioniert. Nutzerverwaltete
Plugin-Konfiguration liegt getrennt unter `.qatlas/plugins/`, lokaler Laufzeitzustand unter
`.qatlas/local/`.

## Was darin liegt

Versionierter, verwalteter Zustand mit Frontmatter, der mit dem Repo reist:

- `memory/`: dauerhafte Memories, die mit dem Repo reisen und über den Index `MEMORY.md` geöffnet werden.
- `templates/`: optionale, nutzereigene Vorlagenbibliothek. Qatlas legt dort nichts ab und aktualisiert
  sie nicht; seine aktuellen Backlog-Vorlagen kommen bei Bedarf aus dem installierten Plugin.
- `backlog/`: der operative Einstieg über `BACKLOG.md`. Bei lokaler Planung ist diese Datei der Roster für
  Aufgaben und optionale Projekte. Bei externer Arbeitsverwaltung bleibt sie als kompakter Wegweiser mit
  Link, Statusmodell und Schreibweg erhalten; lokale Tasks werden dann nicht gespiegelt. Unverbindliche
  lokale Einfälle stehen getrennt in `IDEAS.md`.
- `updates/`: der pro Plugin zuletzt für dieses Repo geprüfte Stand. Der Ordner entsteht erst bei Bedarf.
- `docs/`: Projektwissen für den Agenten. Dokumentation für Menschen bleibt außerhalb in einem eigenen
  `docs/` am Root.

Was dieses Repo ist und wer daran arbeitet, steht in deiner eigenen `AGENTS.md` am Root, nicht hier.

Zonen sind flüchtige, nicht versionierte Ein- und Ausgabepuffer:

- `zone-import/`: eingehende Rohdaten, die du dem Agenten übergibst.
- `zone-export/`: angeforderte Ergebnisse, die du aus dem Repo entnimmst.

## Umgang damit

Das installierte Plugin liefert für neue und fehlende Scaffold-Dateien nur einen Ausgangspunkt. Sobald eine
Datei im Repo lebt, ist sie dort primär und wird nie pauschal überschrieben. Lege Rohmaterial in
`zone-import/` und bitte den Agenten um Verarbeitung. Ein angefordertes Ergebnis landet in `zone-export/`.
