---
description: >
  Bedingte Web-Stack-Kandidaten für die dritte Architekturphase nach bestätigten Anforderungen und
  Systemgrenzen.
license: MIT
type: playbook
edit: locked
---

# Web-Stack-Kandidaten

Lies diese Referenz nur in Phase 3 einer neuen Stackentscheidung. Ein vorhandener tragfähiger Stack und
ausdrückliche Projektvorgaben gewinnen. Vergleiche Kandidaten gegen die geklärten Anforderungen und nenne
für jede Abweichung Nutzen, Betriebskosten und Rückweg.

Für ein neues selbst gehostetes Webprodukt ist TypeScript mit React und Next.js, PostgreSQL und bei einem
einfachen Serverbetrieb Docker Compose ein möglicher Ausgangskandidat. Zod, Drizzle, Tailwind CSS oder ein
OIDC-Anbieter sind nur Kandidaten, wenn ihr konkreter Zweck im Projekt besteht. Eine statische Website,
ein Plugin in einem vorhandenen Host oder ein anders gebautes Projekt braucht nicht diesen Kandidaten.

Beginne mit möglichst wenigen Deployables. Eine separate API folgt einer unabhängigen Client- oder
Bereitstellungsgrenze; ein Worker folgt langer oder wiederholbarer Arbeit; Cache und Queue brauchen je
einen benannten aktuellen Bedarf. Prüfe die heutigen Fähigkeiten, Versionen und Betriebsfolgen der
gewählten Technologien anhand ihrer offiziellen Quellen, bevor du eine Empfehlung aussprichst.
