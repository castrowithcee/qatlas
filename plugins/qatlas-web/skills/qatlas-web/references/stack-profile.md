---
description: >
  Meinungsstarke, aber überschreibbare Stack-Baseline für neue selbst gehostete Webprodukte mit
  TypeScript, Next.js, PostgreSQL und Docker Compose sowie ihren Ausbaugrenzen.
license: MIT
type: playbook
edit: locked
---

# Stack-Profil

Dieses Profil gilt als Ausgangspunkt für neue Projekte, nicht als Migrationsauftrag für bestehende. Eine
ausdrückliche Nutzerentscheidung oder ein vorhandener tragfähiger Stack gewinnt. Abweichungen werden nur
für neu zu treffende Entscheidungen begründet.

## Defaults

| Bereich | Default | Abweichen, wenn |
|---|---|---|
| Sprache | TypeScript | ein Spezial-Worker fachlich klar von Python oder Go profitiert oder der vorhandene Stack trägt |
| Frontend | Next.js + React | kein React-Produkt oder eine besondere Runtime nötig ist |
| App-Backend | Next.js Server Functions und Route Handlers | die API ein eigenständiges Produktinterface wird |
| API-Service | Hono als schlanker Kandidat | Anforderungen oder ein vorhandener Stack etwas anderes begründen |
| Validierung | Zod | ein bestehender Contract-Stack bewusst etwas anderes verwendet |
| API-Schema | OpenAPI für externe APIs | keine externe oder unabhängige Clientgrenze existiert |
| Datenbank | PostgreSQL | Datenform oder Lastprofil einen fachlichen Grund liefern |
| DB-Zugriff | Drizzle | ein bestehendes Projekt bewusst ein anderes Werkzeug verwendet |
| Auth | etablierte OIDC-/OAuth2-Lösung | eine kleine Single-App bewusst integrierte Auth verwendet |
| Styling | Tailwind CSS | klassisches CSS oder ein bestehendes Designsystem geeigneter ist |
| Dateien | S3-kompatibler Object Storage | keine persistenten Dateien vorkommen |
| Deployment | Docker Compose bei Self-Hosting | Zielplattform oder notwendige Orchestrierung etwas anderes verlangen |
| Cache | keiner | gemessener Cache-, Lock-, Rate-Limit- oder Koordinationsbedarf besteht |
| Queue und Worker | keine | lange, zeitversetzte oder retry-fähige Arbeit vorhanden ist |

## Interne Grenze

```text
Next.js Server Function oder Route Handler
                    │
                    ▼
                Domain/Core
                    │
                    ├── DB Port
                    ├── Storage Port
                    ├── Auth Context
                    └── External Service Ports
                    │
                    ▼
             Infrastructure Adapter
```

Fachlogik kennt Next.js und React nicht. Route Handler und Server Functions übersetzen Transportdaten in
validierte Core-Aufrufe. Server Components sind der Frontend-Ausgangspunkt; Client Components bleiben auf
Browser-State, Events und interaktive APIs begrenzt.

## Ausbaugrenzen

- Eine separate API entsteht bei mehreren unabhängigen Clients, einem öffentlichen Produktvertrag oder
  notwendiger unabhängiger Bereitstellung und Skalierung.
- Redis braucht einen benannten Zweck wie Hot Cache, Rate Limiting, Distributed Locking, ephemeren
  gemeinsamen Zustand, Queue-Backend oder Koordination mehrerer App-Instanzen.
- Queue und Worker folgen langer, zeitversetzter, geplanter oder retry-fähiger Arbeit.
- Python oder Go werden wegen Bibliotheken, Performance, Datenverarbeitung oder vorhandener Kompetenz
  eingesetzt, nicht wegen einer abstrakten späteren Möglichkeit.
- Microservices werden erst bei unabhängiger Skalierung, Deployment, Ownership oder harter technischer
  Grenze erwogen. Separate API und Worker allein bilden noch keine Microservice-Architektur.

## Repository-Ausgangspunkt

Plane nur die tatsächlich benötigten Teile:

```text
apps/
└── web/

packages/
├── core/
├── db/
├── contracts/
└── shared/
```

`apps/api` und `apps/worker` kommen erst mit ihrem belegten Auslöser hinzu. Auch die Package-Trennung ist
kein Selbstzweck: In einem kleinen vorhandenen Projekt genügen klare Modulgrenzen innerhalb der bestehenden
Struktur.
