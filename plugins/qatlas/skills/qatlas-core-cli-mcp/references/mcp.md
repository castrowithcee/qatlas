---
description: >
  Verwendet den stateless Qatlas-MCP-Broker über stdio mit Protokollmetadaten pro Request, festen
  Brokertools und sicheren Prozess- und Berechtigungsgrenzen.
license: MIT
type: playbook
edit: locked
---

# Qatlas über MCP verwenden

`qatlas mcp` ist ein stdio-Serverprozess, kein TCP-Dienst und kein Betriebssystem-Daemon. Ein MCP-Client
startet ihn, schreibt pro Zeile genau eine JSON-RPC-Nachricht nach stdin, liest Antworten von stdout und
schließt stdin zum Beenden.

Der aktuelle Broker spricht MCP `2026-07-28` mit selbstbeschreibenden Requests. Sende keinen älteren
`initialize`-Aufruf. Jeder Request trägt in `params` mindestens:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {}
  }
}
```

`server/discover` ermittelt Serveridentität und Fähigkeiten, `tools/list` die festen Brokertools. Qatlas
stellt unabhängig von der Providerzahl bereit:

- `qatlas.search` für konfigurierte Operationsverträge,
- `qatlas.describe` für einen versionierten Vertrag und passende Connections,
- `qatlas.invoke` für die Ausführung über den gemeinsamen Anwendungskern.

Nutze vor `qatlas.invoke` den von `qatlas.describe` gelieferten Vertrag. Operation, Version, Connection,
Argumente und Bestätigung bleiben getrennte Felder. Dieselben Autorisierungs- und Wiederholungsgrenzen wie
bei einem CLI-Aufruf gelten unverändert.

Jeder Request hat eine Anwendungsfrist von 30 Sekunden. `notifications/cancelled` kann einen laufenden
Request abbrechen; ein Abbruch beweist bei einer nicht-idempotenten Providerwirkung nicht, dass sie
ausgeblieben ist.

Der MCP-Prozess erbt Dateisystem-, Umgebungs-, Credential-Store- und Netzwerkrechte vom Client oder
Launcher. Diese Rechte sind keine Qatlas-Argumente und lassen sich für einen bereits laufenden Prozess
nicht nachträglich erhöhen. Stoppe ihn bei geänderter Freigabe und starte ihn in der vorgesehenen Umgebung
neu.
