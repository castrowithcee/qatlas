---
description: >
  Verfahren für ein bestätigungsfähiges Architekturpaket mit MVP-Stack, Zielhorizont, erhaltenen
  Nahtstellen, zurückgestellten Fähigkeiten, Alternativen und messbaren Einführungstriggern.
license: MIT
type: playbook
edit: locked
---

# Architektur entscheiden

## Reference Architecture wählen

Wähle die kleinste passende Architektur nach den benötigten Fähigkeiten. Produktlabels wie SaaS oder
„komplex“ ersetzen keine Begründung.

## Architekturpaket erstellen

### Produkt und MVP

- Problem, Zielgruppe und zentraler Nutzerablauf
- Hypothese und beobachtbares Erfolgssignal
- Funktionsumfang des ersten Meilensteins
- Nicht-Ziele

### Stack jetzt

- Frontend, Backend und Runtime
- Datenhaltung und Datenmodellgrenzen
- Authentifizierung und Autorisierung
- Files, externe Dienste und Jobs, sofern benötigt
- Deployment und Umgebungen
- Test-, Security- und Observability-Baseline

Nenne für jeden vom Default abweichenden neuen Baustein Anforderung, Nutzen, Betriebskosten und Rückweg.

### Zielhorizont

Beschreibe die bei Erfolg realistische Produktform, ohne sie zum aktuellen Lieferumfang zu erklären.

### Erhaltene Nahtstellen

Behalte nur Grenzen, die heute mit vertretbarem Aufwand spätere Änderungen erleichtern, etwa:

- externe Identität getrennt vom Anwendungsprofil
- Eigentümer oder Workspace an fachlichen Daten
- Domain/Core unabhängig vom Webtransport
- Storage- oder Integrationsport statt direkter Anbieterbindung
- explizite Contracts an Clientgrenzen

### Bewusst zurückgestellt

Halte nicht gebaute Fähigkeiten mit kurzem Grund fest, beispielsweise Billing, Queue, Redis, separate API,
Enterprise-SSO oder Multi-Region.

### Einführungstrigger

Gib jeder möglichen Erweiterung einen beobachtbaren Auslöser statt „später vielleicht“, beispielsweise:

- separate API beim zweiten unabhängigen Client;
- Worker, wenn Arbeit nicht zuverlässig im Request abgeschlossen werden kann;
- Tenant-Ausbau vor dem ersten fremden Workspace;
- Billing vor der ersten kostenpflichtigen Freischaltung;
- gemeinsamer Cache bei mehreren Instanzen mit notwendiger Cachekoordination.

### Risiken und offene Entscheidungen

Nenne Auswirkung, Empfehlung, Alternativen und spätesten Entscheidungszeitpunkt.

## Gate: planungsreif

Der Nutzer bestätigt oder korrigiert das Architekturpaket. Planung darf erst in ausführbare Tasks übergehen,
wenn Problem, Zielgruppe, zentraler Nutzerablauf, MVP-Grenze, Zielhorizont, relevante Daten- und
Berechtigungsgrenzen, UI- und Betriebsprofil sowie Architektur und Abweichungen ausreichend geklärt sind.
Ungeklärte Details ohne Auswirkung auf den ersten Meilenstein dürfen sichtbar zurückgestellt bleiben.
