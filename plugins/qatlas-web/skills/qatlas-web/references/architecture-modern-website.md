---
description: >
  Reference Architecture für contentorientierte Marketing-Seiten, Dokumentation, Portfolios und
  Unternehmenswebsites mit wenig Anwendungslogik.
license: MIT
type: playbook
edit: locked
---

# Moderne Website

## Geeignet für

Marketing-Seiten, Landingpages, Dokumentation, Content-Websites, Portfolios und Unternehmensseiten.

```text
Browser
   │
   ▼
Next.js
   │
   ├── statische Inhalte
   ├── Server Rendering
   ├── CMS oder API optional
   └── minimale Client-Interaktivität
```

Typisch sind Next.js, React, TypeScript und Tailwind CSS oder klassisches CSS. Ein Headless CMS und Analytics
sind optional. PostgreSQL, Auth, Redis, Queue, Worker, Object Storage und eigenständige API werden nicht
automatisch benötigt. Docker ist nur bei Self-Hosting oder einem konkreten Deploymentzweck nötig.
