---
description: >
  Prüfanweisung für die explizite Migration des Projektzustands nach .qatlas-project und des Update-Stands
  in den technischen Namespace.
license: MIT
type: rule
edit: locked
---

# Projektwissen und Prüfstand migrieren

- Führe im betroffenen Repo zuerst
  `node <plugin-root>/scripts/qatlas-migrations.js project --target <projekt-root>` aus. Prüfe das ausgegebene
  Inventar aus Quelle, Ziel, Referenzen, Update-Prüfstand und Konflikten gegen den Git-Stand. Der Befehl
  verändert nichts.
- Sind `.qatlas-project/` und eine frühere Projektwurzel parallel vorhanden, Prüfstände widersprüchlich oder
  Dateien nicht vollständig lesbar, ändere nichts. Kläre die Inhalte und die maßgebliche README konkret.
  Vorhandene `INDEX.md` werden ihrem Inhalt nach einer README oder einem anderen passenden Ziel zugeordnet;
  die Migration verschiebt sie nicht blind. Eine `FRAMEWORK.md` bleibt als lokaler Arbeitsrahmen in ihrem
  Scope erhalten. Auch doppelte kanonische Projektwissens-IDs blockieren den Umzug und müssen vor der
  Bestätigung eindeutig aufgelöst werden.
- Nach ausdrücklicher Bestätigung führt derselbe Befehl mit `project --apply --target <projekt-root>` den
  eindeutigen Umzug aus. Er erhält Backlog-Binding, Memory, IDs, Zonen und Plugin-Bestätigungen, aktualisiert
  inventarisierte Pfadverweise und verlegt `updates/state.json` nach
  `.qatlas/plugins/updates/state.json`. Versionierte frühere Update-Anweisungen und die Migrationsmechanik
  behalten historische Pfade. Import- und Exportzonen reisen bytegleich mit; ihr Rohinhalt wird dabei nicht
  umgeschrieben. Eingebettete Git-Repos und Worktrees bleiben außerhalb der semantischen Prüfung und
  Pfadänderung.
- Prüfe danach `.qatlas-project/README.md` als kaskadischen Einstieg und halte sie einschließlich Frontmatter
  bei höchstens 80 Zeilen und 500 Wörtern. Fachinhalte außerhalb des bisherigen Projektzustands bleiben an
  ihren vorhandenen Orten und werden weder eingesammelt noch umklassifiziert.
- Führe Doctor und Update-Status erneut aus. Ergänze die neuen Regeln für `.qatlas-project/zone-import/`,
  `.qatlas-project/zone-export/` und `.qatlas/local/` in `.gitignore`; fremde Einträge bleiben erhalten.
  Bestätige den Update-Stand erst nach der vollständigen Prüfung.
