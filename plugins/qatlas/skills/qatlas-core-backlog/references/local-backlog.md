---
description: >
  Arbeit im lokalen Qatlas-Backlog über das Backlog-Skript: Issues lesen, anlegen, ändern, ordnen, bündeln
  und abschließen, Felder und ihre Auswahl pflegen, Ideen führen und den Backlog mit dem Remote abgleichen,
  dazu der Inhalt eines Tasks.
---

# Lokaler Backlog

Arbeite im lokalen Backlog nur über das Skript. Jede Ausgabe ist JSON. Exit `1` heißt abgelehnt, mit dem
Grund auf stderr.

```text
node <plugin-root>/scripts/qatlas-backlog.js <Befehl>
```

`<plugin-root>` ist der im Sessionkontext genannte `QATLAS PLUGIN ROOT`.

- Die Issues liegen auf dem Branch `qatlas-backlog` des Projekt-Repos. Fasse ihn nie mit Git an: kein
  Checkout, Merge, Rebase, Push oder Löschen von Hand.
- Ändere Titel, Typ, Status und jedes andere Feld nur über `set`. In der Datei eines Issues bearbeitest du
  allein den Text unter dem Frontmatter.
- Jeder schreibende Befehl committet im Backlog, auch offene Textänderungen an anderen Issues. Lehnt er ab,
  bleibt alles, wie es war.

## Lesen

- `list` zeigt die offene Arbeit in ihrer Reihenfolge, je Issue mit eigenem Status, dem Status dieser Norm
  unter `means` und `executable` für einen `ready`-Task ohne offene Abhängigkeit. Filter: `--status`,
  `--type`, `--label`, `--parent`, `--where <feld>=<wert>`, mit `--all` auch Erledigtes und Ideen.
- `show <id>` zeigt ein Issue vollständig samt Pfad seiner Datei.

Lies zuerst `list` und danach nur die gewählten Issues und ihre echten Blocker mit `show`. Ein ausdrücklich
genanntes Issue darfst du sofort vollständig lesen. Lade nie vorsorglich alle Issues.

## Anlegen

1. `add --title "<Titel>"` legt ein Issue mit dem Rumpf eines Tasks an und nennt ID und Pfad. Optional:
   `--type`, `--status`, `--parent <id>`, `--depends <id,id>`, `--labels <a,b>`, `--set <feld>=<wert>` und
   `--body-file <Datei>` für einen fertigen Text.
2. Fülle in der genannten Datei jeden Abschnitt und ersetze alle Platzhalter.
3. `save` prüft und committet den Text.

Ohne `--status` ist ein neuer Task `draft`.

## Inhalt eines Tasks

Ein offener Task ist der kompakte aktuelle Stand seiner Arbeit, kein laufendes Journal. Er bleibt in einem
vollständigen Lesen eigenständig ausführbar:

- Warum, Ergebnis, Scope, geltende Leitplanken, Abhängigkeiten, aktueller Ansatz und Abnahmekriterien
  enthalten nur Aussagen, die noch gelten. Arbeite eine entschiedene Entscheidung an ihrer richtigen Stelle
  ein und entferne dadurch überholte Alternativen. Eine Entscheidung, die über den Task hinaus bindet, wird
  in die reservierte Datei von `.qatlas-brain/` eingearbeitet, die sie betrifft, oder in `AGENTS.md`, wenn
  sie in jeder Session gelten muss.
- Bei Arbeit an einem bestehenden System hält der Task die Ausführungsbasis nach der Ausführungsreife der
  Backlog-Norm fest.
- Der Abschnitt `Abschlussbericht` ist die einzige statusabhängige Übergabestelle. Ersetze und verdichte
  seinen bisherigen Inhalt bei einem Übergang, statt Laufberichte oder erledigte Review-Karten anzuhängen.
  Nach einer Klärung bleibt nur ein noch nötiger aktueller Stand oder `- Keine.`. Er enthält:
  - bei `review` nur die aktuelle Übergabe an den Nutzer nach der Backlog-Norm,
  - bei `waiting` Grund, Wiederaufnahmesignal, verifizierten Stand und nächsten Schritt,
  - bei `deferred` nur die Entscheidung des Nutzers,
  - bei `done` `- Keine.` oder nur wichtige Entscheidungen, Auffälligkeiten, Risiken, Warnungen und
    Abweichungen, die Abschlussart, falls verworfen oder Duplikat, sowie die Orte, an denen dauerhafte
    Projektwahrheiten oder falsch gewordene Dokumentation aktualisiert wurden. Nenne jeden dieser Punkte auch
    im abschließenden Chat.
- Rohe Logs, vollständige Befehlsausgaben, allgemeine Kommunikation, verworfene Versuche und eine Chronologie,
  die für den nächsten Schritt nicht nötig ist, gehören nicht in den Task. Die Git-Historie des Backlogs ist
  das Protokoll der Vergangenheit.
- Verweise auf stabile Repo-Quellen dürfen deren Inhalt kurz zusammenfassen, statt ihn vollständig zu
  duplizieren. Alle Grenzen und Entscheidungen, die für die konkrete Ausführung nötig sind, bleiben im Task.

Schneide nie nach einer harten Token-, Zeilen- oder Zeichengrenze. Lässt sich selbst der noch gültige
Taskvertrag nicht mehr in einer Session ausführen, schneide die verbleibende Arbeit bewusst neu. Entferne
keine bindende Entscheidung und keinen nötigen Grund nur für eine kleinere Datei.

## Status, Reihenfolge und Bündelung

- `set <id> --status <status>` nimmt einen eigenen Statuswert des Backlogs oder einen Status dieser Norm.
  Einen Weg, den die Norm nicht kennt, lehnt der Befehl ab. Setze `--force` nur auf ausdrückliches Wort des
  Nutzers, etwa um ein erledigtes Issue wieder zu öffnen.
- Schreibe bei einem Übergang zuerst den `Abschlussbericht` in die Datei und setze dann den Status. Der
  Abschluss ist `--status done`.
- `move <id> --before <id>`, `--after <id>`, `--first` oder `--last` ändert die Reihenfolge. Ordne sie nicht
  stillschweigend um.
- `--parent <id>` bündelt Issues unter einem übergeordneten, das Ziel und Umfang des Vorhabens trägt.
  `--no-parent` löst die Bindung.
- `--depends <id,id>` nennt echte Voraussetzungen nach der Backlog-Norm. Das benötigte Ergebnis steht im
  Abschnitt `Abhängigkeiten` des Tasks. Ein Verweis ersetzt keinen Kontext, den der Task zur Ausführung
  braucht.

## Felder

`fields` zeigt die Auswahl jedes Felds: die Statuswerte mit dem Status dieser Norm, für den jeder steht, die
Typen, die Labels und die eigenen Felder des Nutzers. Ein Wert außerhalb der Auswahl wird abgelehnt.

- Lege einen Status, Typ, ein Label oder ein eigenes Feld nur auf Wunsch des Nutzers an:
  `fields add status <name> --means <status der norm>`, `fields add type <name>`, mit `--no-work` für einen
  Typ ohne Status, `fields add labels <name>`, `fields add <feld> <wert>` für ein Feld mit Auswahl und
  `fields add <feld>` für ein Feld mit freiem Text. `fields remove <feld> <wert>` entfernt einen Wert, den
  kein Issue mehr trägt.
- Ein eigenes Feld setzt du mit `set <id> --set <feld>=<wert>`. Qatlas wertet nur Status, Reihenfolge,
  Bündelung und Abhängigkeiten aus. Hat der Backlog ein Feld `priority`, sortiert `list` zuerst danach.

## Ideen

Eine Idee ist ein Issue eines Typs ohne Status, ab Werk `idea`: `add --title "<Idee>" --type idea`. Sie
erscheint nicht in der offenen Arbeit, `list --type idea` zeigt sie. Wird eine Idee bewusst zu Arbeit, gib
ihr mit `set <id> --type <typ>` einen Typ mit Status und fülle den Rumpf wie bei einem neuen Task.

## Abgleich

`sync` holt den Backlog vom Remote des Repos, führt ihn zusammen und pusht ihn. Führe ihn nur aus, wo du auch
den Code dieses Repos pushen dürftest, und vor der Arbeit auf einem anderen Gerät.

Meldet `sync` einen Konflikt (Exit `2`), haben beide Seiten dasselbe Issue geändert. Die Ausgabe nennt die
Dateien, den lokalen Ordner und den Ordner mit den Fassungen des Remotes. Kläre je Datei mit dem Nutzer,
welcher Stand gilt, bringe die lokale Datei auf diesen Stand und führe `sync --resolved` aus.
