---
description: >
  Reference Architecture für SaaS- und API-Produkte mit mehreren unabhängigen Clients, öffentlicher API,
  hoher Joblast oder getrennt skalierbaren Deployables.
license: MIT
type: playbook
edit: locked
---

# Komplexes SaaS- oder API-Produkt

## Geeignet für

Produkte mit Web, Mobile, Admin UI, Agents, MCP, Drittclients, öffentlicher API, hoher Joblast oder
unabhängig skalierbaren Komponenten.

```text
Web ────────────┐
Mobile ─────────┤
Admin ──────────┤
Agents / MCP ───┤
Dritte ─────────┘
                │
                ▼
               API
                │
                ▼
           Domain/Core
        │       │        │
        │       │        └────► Queue ──► Worker
        │       └─────────────► S3
        └─────────────────────► PostgreSQL
```

Typisch sind `apps/web`, `apps/api` und `apps/worker` sowie gemeinsame Packages für Core, Datenbank und
Contracts. OpenAPI bildet den stabilen externen Vertrag. PostgreSQL bleibt Source of Truth, S3 speichert
Dateien und Worker führen asynchrone Arbeit aus.

Die Reference Architecture ist keine automatische Microservice-Empfehlung. Domain-Services entstehen erst
bei eigenständigen Skalierungs-, Deployment-, Ownership- oder technischen Grenzen.
