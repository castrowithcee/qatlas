---
description: >
  Führt einen autorisierten Lese- oder Mutationsauftrag über veröffentlichte Qatlas-Toolverträge,
  explizite Connections und sichere Wiederholungsgrenzen aus.
license: MIT
type: playbook
edit: locked
---

# Ein Qatlas-Tool sicher aufrufen

Nutze veröffentlichte Toolverträge statt Providerparameter zu erraten. Bewahre den vom Auftrag oder Host
vorgegebenen Transport: Ein CLI-Kontrollaufruf kann den gemeinsamen Anwendungskern prüfen, beweist aber
nicht, dass ein MCP-Client korrekt eingerichtet ist.

## Auftrag abgrenzen

Halte vor dem ersten Provideraufruf fest:

- Ziel und erwartetes Ergebnis,
- erlaubte Tooloperationen oder den engen Suchraum für ihre Ermittlung,
- Connection oder eindeutige Auswahlregel und fachlichen Zielbereich,
- erlaubte Effekte wie Lesen, Erstellen, Ändern, Löschen oder Senden,
- Ziel und Datenschutzgrenze des Ergebnisses,
- Stopbedingungen und erforderliche menschliche Entscheidungen.

Ein Auftrag wie „Rechnungen suchen“ kann die dazu nötigen Leseoperationen autorisieren. Er autorisiert
weder Änderungen noch Export an ein neues Ziel. „Dokumentation überarbeiten“ braucht zusätzlich den
eindeutigen Dokumentationsbereich und die erlaubten Schreibeffekte. „Leads bewerten“ autorisiert ohne
weitere Aussage weder Kontaktaufnahme noch Statusänderungen im CRM.

## Vertrag entdecken

Nutze für agentisch verarbeitete Ergebnisse JSON:

```sh
qatlas providers --output json
qatlas tools <namespace> --output json
qatlas tool <tool-id> --connection <connection> --output json
```

Suche nur so breit wie nötig. Lies aus der Beschreibung insbesondere Ein- und Ausgabeschema, passende
Connections, Effekt, Datenempfindlichkeit, Idempotenz und Bestätigungsanforderung. Eine Operation mit
expliziter Connection darf nur mit einem Namen oder einer eindeutigen, autorisierten Auswahlregel geroutet
werden.

## Aufrufen

Übergib bei verschachtelten oder agentisch erzeugten Argumenten genau ein JSON-Objekt auf stdin. Tool-ID,
Connection und Bestätigung bleiben strukturelle CLI-Eingaben:

```sh
printf '%s\n' '<json-argumente>' \
  | qatlas invoke <tool-id> --connection <connection> [--confirm]
```

Nutze `--confirm` nur für die exakt autorisierte Mutation, wenn der Vertrag es verlangt. Ergebnisse gehen
nach stdout, Diagnose und Audit einer Mutation nach stderr; halte beides beim Parsen getrennt.

## Wiederholen und berichten

- Wiederhole idempotente Leseaufrufe nur gezielt und begrenzt.
- Wiederhole eine nicht-idempotente Mutation nach Timeout, Abbruch, `unreachable` oder einem sonst
  mehrdeutigen Ergebnis nie automatisch.
- Eine Wiederholung ist nur zulässig, wenn Qatlas oder der Provider belegt, dass die Mutation nicht
  stattgefunden hat, oder der Nutzer sie nach Kenntnis des mehrdeutigen Ergebnisses erneut beauftragt.
- Berichte verwendeten Transport, Operation und Connection, bestätigten Erfolg und sichere Ergebnis-IDs.
  Gib bei Fehlern Qatlas' Fehlerklasse und die nächste belegte Ursache an; kennzeichne Schlussfolgerungen.
