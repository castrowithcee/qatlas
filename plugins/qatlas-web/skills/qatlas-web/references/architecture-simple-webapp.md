---
description: >
  Reference Architecture für kleine bis mittlere interne Tools, Dashboards, CRUD-Apps und fokussierte
  Produkte mit PostgreSQL und optionaler Authentifizierung.
license: MIT
type: playbook
edit: locked
---

# Einfache Web-App

## Geeignet für

Interne Tools, Dashboards, CRUD-Apps, kleine Kundenportale und fokussierte Produkte.

```text
Browser
   │
   ▼
Next.js UI und Servergrenzen
   │
   ▼
Domain/Core
   │
   ▼
Drizzle + PostgreSQL
```

Default sind Next.js, React, TypeScript, Zod, Tailwind CSS und PostgreSQL mit Drizzle. Auth kommt hinzu, wenn
Nutzerkonten oder Zugriffsgrenzen benötigt werden. Redis, Queue, Worker und separate API folgen nur einem
konkreten Auslöser.
