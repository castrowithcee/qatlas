---
description: >
  Diagnostiziert Qatlas-Konfiguration, Credentials, Providerzugriff, CLI- und MCP-Transport ohne
  unbeabsichtigte Mutation oder unsichere Wiederholung.
license: MIT
type: playbook
edit: locked
---

# Qatlas CLI und MCP diagnostizieren

Diagnostiziere die engste nachweislich fehlerhafte Schicht. Verwandle eine Untersuchung nicht in einen
Provider-Test mit Außenwirkung.

## Fehlerhafte Schicht bestimmen

1. Prüfe `qatlas --version` und `qatlas --help`. Fehlt die CLI, verwende die Installationsroute statt
   weiterer Diagnose.
2. Validiere die Konfiguration; Erfolg darf still sein:

   ```sh
   qatlas config validate
   qatlas config validate --secrets --output json
   ```

3. Beschreibe exaktes Tool und Connection:

   ```sh
   qatlas tool <tool-id> --connection <connection> --output json
   ```

4. Scheitert nur MCP, wiederhole Discovery oder eine autorisierte Leseoperation über die CLI. Gleiche
   Fehler weisen auf gemeinsamen Anwendungskern, Konfiguration, Credentials, Provider oder Umgebung;
   MCP-only-Fehler auf JSON-RPC-Form, Protokollmetadaten, Prozesslebenszyklus oder Launcherrechte.

Vergleiche CLI und MCP nur mit derselben Konfiguration, Umgebung, Nutzeridentität, Sandbox, Connection,
Argumentform und Bestätigung.

## Fehlerklassen

- `invalid-request`: Schema, explizite Connection oder Bestätigung ist falsch.
- `auth`: Der Provider lehnt das aufgelöste Credential ab.
- `permission`: Credential ist bekannt, aber Operation oder Ziel wird verweigert.
- `rate-limited`: Folge der Providerpolitik; erfinde keinen Mutation-Retry.
- `timeout`: Das Ergebnis einer Mutation kann mehrdeutig sein.
- `tls`: Zertifikat, Hostname, Trust oder TLS-Aushandlung ist fehlgeschlagen.
- `unreachable`: DNS, Egress, Proxy, Verbindungsaufbau oder Sandbox kann den Transport verhindern.
- `provider-error`: Der Provider liefert einen anderen Fehlerstatus.
- `invalid-response`: Eine Antwort verletzt Qatlas' begrenzten Ausgabevertrag.

Ein deterministischer lokaler Konfigurationsfehler oder eine belegte Ablehnung vor der Wirkung kann nach
Korrektur einen einzelnen erneuten Versuch erlauben. Timeout, Abbruch und ein Transportverlust nach
möglichem Verbindungsaufbau bleiben bei nicht-idempotenten Mutationen mehrdeutig und werden nicht
automatisch wiederholt.

## `unreachable` eingrenzen

Prüfe DNS und tokenloses HTTPS in derselben Umgebung wie der fehlerhafte Qatlas-Prozess und nur gegen
einen bereits bekannten, nicht sensiblen Providerhost. Scheitert dies in der Sandbox, aber mit genehmigtem
Netzwerkzugriff nicht, ist die Launcher- oder Sandboxgrenze die Ursache. Starte einen MCP-Prozess nach
geänderter Freigabe neu. Ein CLI-Aufruf unter anderen Rechten beweist keinen MCP-Defekt.

Melde Qatlas' Fehlerklasse, die nächste belegte Ursache und verbleibende Unsicherheit. Gib keine
Credentialwerte, privaten Endpunkte oder vollständigen sensiblen Providerantworten aus.
