---
description: >
  Arbeit im lokalen Qatlas-Backlog über das Backlog-Skript: Issues lesen, anlegen, ändern, ordnen, bündeln
  und abschließen, Felder und ihre Auswahl pflegen, Ideen führen und den Backlog mit dem Remote abgleichen.
---

# Lokaler Backlog

Arbeite im lokalen Backlog nur über das Skript. Jede Ausgabe ist JSON. Exit `1` heißt abgelehnt, mit dem
Grund auf stderr.

```text
node <plugin-root>/scripts/qatlas-backlog.js <Befehl> [--target <Projektordner>]
```

`<plugin-root>` ist der im Sessionkontext genannte `QATLAS PLUGIN ROOT`. Setze `--target`, wenn dein
Arbeitsverzeichnis außerhalb des Projekts liegt.

- Fasse den Branch `qatlas-backlog` nie mit Git an: kein Checkout, Merge, Rebase, Push oder Löschen von Hand.
- Ändere Titel, Typ, Status und jedes andere Feld nur über `set`. In der Datei eines Issues bearbeitest du
  allein den Text unter dem Frontmatter.
- Jeder schreibende Befehl committet im Backlog, auch offene Textänderungen an anderen Issues. Lehnt er ab,
  bleibt alles, wie es war.

## Lesen

- Lies die offene Arbeit in ihrer Reihenfolge mit `list`. Jedes Issue trägt seinen eigenen Status, unter
  `means` den Status der Backlog-Norm und unter `executable`, ob ein `ready`-Task keine offene Abhängigkeit
  hat. Filtere mit `--status`, `--type`, `--label`, `--parent` und `--where <feld>=<wert>`. `--all` nimmt
  Erledigtes und Ideen dazu.
- Lies ein Issue vollständig mit `show <id>`. Die Ausgabe nennt auch den Pfad seiner Datei.

Lies neben den gewählten Issues nur ihre echten Blocker. Ein ausdrücklich genanntes Issue darfst du sofort
vollständig lesen.

## Anlegen

Das Skript gibt keinen Text vor und reicht deinen durch.

1. Schreibe den fertigen Text des Tasks in eine Datei unter `.qatlas/local/`.
2. Lege das Issue in einem Schritt an: `add --title "<Titel>" --body-file <Datei>`. Die Ausgabe nennt ID und
   Pfad. Optional: `--type`, `--status`, `--parent <id>`, `--depends <id,id>`, `--labels <a,b>` und
   `--set <feld>=<wert>`. `--id <nummer>` übernimmt eine vorhandene Nummer, etwa beim Wechsel aus einem anderen
   Planungssystem.
3. Lösche die Datei.

Ohne `--status` ist ein neuer Task `draft`, ohne `--body-file` bleibt der Text leer.

## Text ändern

Bearbeite den Text in der Datei des Issues und committe ihn mit `save`, oder ersetze ihn ganz mit
`set <id> --body-file <Datei>`. `save` prüft dabei jedes Issue. Brächte ein Befehl ein mögliches Secret in
den Backlog, lehnt er ab und nennt die Fundstelle: Entferne es aus dem Text und wiederhole den Befehl.

## Status, Reihenfolge und Bündelung

- Setze den Status mit `set <id> --status <status>`, als eigenen Statuswert des Backlogs oder als Status der
  Backlog-Norm. Einen Weg, den die Norm nicht kennt, lehnt jeder schreibende Befehl ab, auch nach einer
  Änderung von Hand in der Datei. Setze `--force` nur auf ausdrückliches Wort des Nutzers, etwa um ein
  erledigtes Issue wieder zu öffnen.
- Schließe einen Task mit `--status done`.
- Ändere die Reihenfolge mit `move <id> --before <id>`, `--after <id>`, `--first` oder `--last`.
- Bündle Issues mit `--parent <id>` unter einem übergeordneten, das Ziel und Umfang des Vorhabens trägt.
  `--no-parent` löst die Bindung.
- Nenne echte Voraussetzungen mit `--depends <id,id>`. Das benötigte Ergebnis steht im Abschnitt
  `Abhängigkeiten` des Tasks.

## Felder

`fields` zeigt die Auswahl jedes Felds: die Statuswerte mit dem Status der Backlog-Norm, für den jeder steht,
die Typen, die Labels und die eigenen Felder des Nutzers. Einen Wert außerhalb der Auswahl und eine unbekannte
Option lehnt jeder Befehl ab.

- Lege einen Status, Typ, ein Label oder ein eigenes Feld nur auf Wunsch des Nutzers an:
  `fields add status <name> --means <status der norm>`, `fields add type <name>`, mit `--no-work` für einen
  Typ ohne Status, `fields add labels <name>`, `fields add <feld> <wert>` für ein Feld mit Auswahl und
  `fields add <feld>` für ein Feld mit freiem Text. `fields remove <feld> <wert>` entfernt einen Wert, den
  kein Issue mehr trägt.
- Setze ein eigenes Feld mit `set <id> --set <feld>=<wert>`. Qatlas wertet nur Status, Reihenfolge, Bündelung
  und Abhängigkeiten aus. Hat der Backlog ein Feld `priority`, sortiert `list` zuerst danach.

## Ideen

Lege eine Idee als Issue eines Typs ohne Status an, ab Werk `idea`: `add --title "<Idee>" --type idea`. Sie
erscheint nicht in der offenen Arbeit, `list --type idea` zeigt sie. Wird eine Idee bewusst zu Arbeit, gib
ihr mit `set <id> --type <typ> --body-file <Datei>` einen Typ mit Status und den Text eines Tasks.

## Abgleich

`sync` holt den Backlog vom Remote des Repos, führt ihn zusammen und pusht ihn. Das Remote ist `origin`,
sonst das erste des Repos. Führe `sync` nur aus, wo du auch den Code dieses Repos pushen dürftest, und vor der
Arbeit auf einem anderen Gerät.

Meldet `sync` einen Konflikt (Exit `2`), haben beide Seiten dieselbe Datei geändert. Die Ausgabe nennt die
Dateien, den lokalen Ordner und den Ordner mit den Fassungen des Remotes. Kläre je Datei mit dem Nutzer,
welcher Stand gilt, bringe die lokale Datei auf diesen Stand und führe `sync --resolved` aus. Er schließt nur
den gemeldeten Konflikt ab und meldet jeden, der seither dazukam, erneut.

Steht eine Datei auch unter `collisions`, haben beide Seiten unter derselben Nummer ein anderes Issue
angelegt. Lege das lokale Issue mit `add --id <nummer>` erneut an, ab der Nummer unter `free`, richte
`--parent` und `--depends` der Issues, die es meinen, auf die neue Nummer und übernimm in die lokale Datei die
Fassung des Remotes.
