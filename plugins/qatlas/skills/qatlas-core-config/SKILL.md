---
name: qatlas-core-config
description: >
  Qatlas-Einstellungen und Nutzermodule ansehen, erklären, ändern oder einrichten: die beiden Dateien
  config.json mit den Blöcken protection, memory, statusline und run sowie die Module unter ~/.qatlas/plugins/hooks/,
  etwa die Benachrichtigung am Ende eines Laufs. Verwenden, sobald der Nutzer eine Einstellung von Qatlas
  ändern, ein Verhalten ein- oder ausschalten oder über ein Laufende benachrichtigt werden will, und bei
  qatlas-core-config. Nicht für die Frage, wie Qatlas intern arbeitet.
---

# qatlas-core-config

Alles, was der Nutzer an Qatlas einstellen kann, steht an zwei Orten: in den Konfigurationsdateien und in
seinen Modulen. Beide gehören ihm. Zeige vor einer Änderung den aktuellen und den neuen Wert und ändere erst
nach seiner Zustimmung. Lege eine fehlende Datei erst mit ihrem ersten Wert an, und schreibe nie Zugangsdaten
hinein.

## Thema wählen

Lies vor der Antwort oder Änderung nur die Referenz des betroffenen Themas vollständig:

- Orte, Vererbung und Gültigkeit der Dateien sowie `protection` und `memory`:
  [Konfiguration](references/config.md)
- `statusline`: [Statusline konfigurieren](../qatlas-core/references/playbook-statusline.md)
- `run` mit Test-Slots, Modell und Effort je Rolle: [Lauf-Konfiguration](../qatlas/modes/run/playbook-run-config.md)
- Module des Nutzers, etwa die Meldung am Laufende: [Nutzermodule](references/playbook-hooks.md)

Prüfe nach einer Änderung an einer `config.json` mit `node <plugin-root>/scripts/qatlas-doctor.js`, dass die
Datei gültig ist, und nenne dem Nutzer in einer Zeile, was jetzt gilt.
