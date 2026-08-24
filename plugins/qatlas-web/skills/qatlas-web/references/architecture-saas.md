---
description: >
  Reference Architecture für konventionelle Mehrbenutzer-, B2B- und B2C-SaaS-Produkte mit Auth,
  PostgreSQL, optionalem Object Storage und Background Jobs.
license: MIT
type: playbook
edit: locked
---

# SaaS

## Geeignet für

Mehrbenutzer-Produkte, B2B- und B2C-SaaS, AI-Apps, Kundenportale und API-nahe Produkte.

```text
OIDC Provider ─────► Next.js
                       │
                       ▼
                   Domain/Core
                 │      │       │
                 │      │       └────► AI oder externe APIs
                 │      └────────────► S3
                 └───────────────────► PostgreSQL
```

Default sind Next.js und TypeScript, ein eigenständiges Domain/Core-Package, PostgreSQL mit Drizzle, eine
etablierte OIDC-/OAuth2-Lösung und Zod. OpenAPI folgt mit externen Clients, S3 mit persistenten Dateien und
Queue beziehungsweise Worker mit langen oder retry-fähigen Jobs. Redis bleibt zweckgebunden.

SaaS erfordert zusätzlich eine ausdrückliche Entscheidung zu Eigentums-, Workspace- oder Tenant-Grenzen.
Billing, Einladungen, Rollen und Enterprise-Identity sind unabhängige Fähigkeiten und nicht automatisch
Bestandteil dieser Architektur.
