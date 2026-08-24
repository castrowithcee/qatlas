# __qatlas__/

Dieser Ordner ist die **von qatlas verwaltete Schicht** deines Projekts. Alles, was der Agent zur
Steuerung des Projekts braucht, aber nicht dein eigener Inhalt ist, liegt hier an einem Ort, getrennt vom
Root mit deiner Arbeit.

## Warum es diesen Ordner gibt

Agentische Werkzeuge verteilen ihren Zustand gern: Memory an einem lokalen Ort, Notizen an einem anderen,
Rules irgendwo sonst. Wird das Repo verschoben oder auf einer zweiten Maschine geklont, ist dieser Zustand
weg oder unerreichbar. Im Projekt-Root bleibt außerdem unklar, welche Dateien dir und welche dem Werkzeug
gehören.

`__qatlas__/` löst beides. Der Ordner **sammelt den Framework-Zustand an einem einzigen,
selbsterklärenden Ort**, der **mit dem Repo reist**. Bis auf die flüchtigen Zonen unten wird er versioniert.
So gehen Memory, Kontext und Arbeitspfad nicht verloren und lesen sich für jeden Agenten auf jeder Maschine
gleich. Zugleich **bleibt dein Root sauber**: Deine Inhalte liegen draußen, die Mechanik bleibt hier, und
beides ist auf einen Blick zu unterscheiden.

## Was darin liegt

Versionierter, verwalteter Zustand mit Frontmatter, der mit dem Repo reist:
- `memory/`: dauerhafte Memories, die mit dem Repo reisen und über den Index `MEMORY.md` geöffnet werden.
- `templates/`: optionale, nutzereigene Vorlagenbibliothek. Qatlas legt dort nichts ab und aktualisiert
  sie nicht; seine aktuellen Backlog-Vorlagen kommen bei Bedarf aus dem installierten Plugin.
- `backlog/`: der operative Einstieg über `BACKLOG.md`. Bei lokaler Planung ist diese Datei der Roster für
  Aufgaben und optionale Projekte. Bei einer externen Arbeitsverwaltung bleibt sie als kompakter Wegweiser
  mit Link, Statusmodell und Schreibweg erhalten; lokale Tasks werden dann nicht gespiegelt. Unverbindliche
  lokale Einfälle stehen getrennt in `IDEAS.md` und werden erst bei bewusster Ausarbeitung zu Tasks.
- `updates/`: der pro Plugin zuletzt für dieses Repo geprüfte Stand. Der Ordner entsteht erst bei Bedarf.
- `docs/`: was der Agent über das Projekt selbst liest, damit er vor Änderungen versteht, wie und warum es
  gebaut ist. Dokumentation für Menschen bleibt außerhalb in deinem eigenen `docs/` am Root.

Was dieses Repo ist und wer daran arbeitet, steht in deiner eigenen `AGENTS.md` am Root, nicht hier. Der
Agent liest sie nativ, und ein Ort ist besser als zwei, die einander widersprechen können.

Zonen sind flüchtige, nicht versionierte Ein- und Ausgabepuffer mit dem Präfix `zone-`:
- `zone-import/`: eingehende Rohdaten, die du dem Agenten übergibst, etwa CSV, PDF, Bilder oder Notizen.
- `zone-export/`: ausgehende Ergebnisse, die du aus dem Repo entnimmst. Nur auf Anforderung befüllt.

## Umgang damit

Das installierte Plugin liefert für neue und fehlende Scaffold-Dateien nur einen Ausgangspunkt. Sobald eine
Datei im Repo lebt, ist sie dort primär und wird bei abweichendem Plugin-Inhalt nie pauschal überschrieben.
Du sortierst hier selten etwas von Hand. Der Agent legt diese Schicht nach ihren Rules ab, benennt und pflegt
sie. Lege Rohmaterial in `zone-import/` und bitte den Agenten um Verarbeitung. Ein angefordertes Ergebnis
landet in `zone-export/`. Alles andere legt der Agent dort ab, wo es hingehört.
