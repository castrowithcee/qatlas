---
name: qatlas-web
description: >
  Liefert bei Arbeit an Websites, Web-Apps und SaaS-Produkten die fachliche Methode für Produktprofil,
  Fähigkeiten, UI, Daten- und Berechtigungsgrenzen, Stack, Architektur, Sicherheit und Betrieb. Als
  Capability innerhalb von Qatlas Shape, Backlog oder Run verwenden, nicht als eigener Planungsloop oder
  konkurrierendes Task-System. Respektiert vorhandene Stacks und baut keine vorsorgliche Infrastruktur.
license: MIT
type: skill
edit: locked
---

# Qatlas Web

Ergänze den aktiven Arbeitsloop um Webprodukt-Expertise. Der Workspace bleibt Source of Truth. Bestehende
Produkt-, Architektur- und Stackentscheidungen haben Vorrang; ein vorhandener anderer Stack ist kein
Migrationsauftrag.

Dieser Skill besitzt weder Gespräch, Projektdokumentation, Backlog noch Statusübergänge. Ist `qatlas
shape`, `qatlas backlog`, `qatlas run` oder ein anderer ausdrücklich gewählter Workflow aktiv, liefere
ihm fachliche Analyse, Optionen, Empfehlungen und Prüfungen. Ohne solchen Workflow beantworte die konkrete
Webfrage und beginne nicht selbstständig, Dateien oder Tasks anzulegen.

## Fachlichen Scope bestimmen

Lies vorhandene Projektanweisungen, Navigationsknoten, Produkt- und Architekturdokumentation sowie nur die
für den aktuellen Gegenstand nötigen Referenzen. Lade nicht vorsorglich das gesamte Pack.

1. Lies bei Produkt- oder Architekturfragen `references/planning-framework.md`.
2. Lies `references/product-profile.md`, wenn Problem, Zielgruppe, Nutzerablauf, MVP oder Erfolgssignal
   geklärt werden.
3. Lies `references/capabilities.md`, wenn benötigte Produktfähigkeiten und ihre Folgen noch nicht feststehen.
4. Lies `references/ui-profile.md` nur für sichtbare Benutzeroberflächen.
5. Lies `references/operations-risk.md` bei persistenten oder sensiblen Daten, fremden Nutzern,
   Self-Hosting, Produktivbetrieb oder besonderen Verfügbarkeitsanforderungen.
6. Lies `references/stack-profile.md`, wenn ein neuer Stack entschieden oder ein vorhandener gegen die
   Anforderungen geprüft wird.
7. Lies `references/architecture-selection.md` und genau eine passende Reference Architecture, wenn eine
   Architekturentscheidung tatsächlich ansteht:
   `architecture-modern-website.md`, `architecture-simple-webapp.md`, `architecture-saas.md` oder
   `architecture-complex-saas.md`.

## Methode

Kläre Webprodukte in dieser Rangfolge:

1. Problem, Zielgruppe, zentraler Nutzerablauf, überprüfbare Produkthypothese und Nicht-Ziele.
2. Benötigte Fähigkeiten jetzt, bewusst später oder ausdrücklich nicht.
3. Daten, Eigentum, Mandanten, Identität, Berechtigungen und externe Verträge.
4. UI-Zustände, Responsive Verhalten, Accessibility und Fehlerwege.
5. Kleinste vollständig tragfähige Architektur und vorhandener oder neuer Stack.
6. Betrieb, Schutzbedarf, Wiederherstellung, Observability und relevante Kosten- oder Außenwirkungen.

Kennzeichne Gegebenes, Abgeleitetes und offene Entscheidungen. Frage nur, wenn die Antwort Produktumfang,
Datenmodell, Sicherheitsgrenze, Benutzererlebnis, Betrieb oder Architektur wesentlich verändert. Triff
keine Produkt-, Risiko- oder irreversible Architekturentscheidung für den Nutzer.

Ein `später` erzeugt höchstens eine heute günstige Nahtstelle und einen beobachtbaren Einführungstrigger.
Es rechtfertigt keine vorsorgliche Queue, keinen Service und kein zweites Datensystem.

## Beiträge zu Qatlas-Modi

- **Shape:** Liefere das bestätigungsfähige Webprodukt- und Architekturpaket. Wenn der aktive Shape-Modus
  einen neuen fachlichen Scope dokumentiert, darf er die Assets `project-framework.md` und
  `project-index.md` als Ausgangspunkt nutzen. `web-project-start.txt` ist eine optionale Eingabevorlage.
- **Backlog:** Prüfe Web-Tasks auf fachliche Vollständigkeit und vertikale, beobachtbare Ergebnisse. Ändere
  keine Priorität oder Freigabe aus eigener Autorität.
- **Run:** Gib Worker- oder Checker-Rollen nur die zum Task gehörenden Webgrenzen und prüfe reale Diffs und
  Beweise gegen diese. Erweitere den Scope nicht um einen Architekturumbau.
- **Review:** Verdichte Webentscheidungen zu echten Optionen, Folgen und einer begründeten Empfehlung.

## Grenzen

- Kein eigener Intake-, Planungs-, Backlog-, Ausführungs- oder Review-Loop.
- Kein automatisches Schreiben von Projektdokumentation oder Tasks außerhalb eines autorisierten Workflows.
- Keine Implementierung allein durch Auswahl dieser Capability.
- Keine TypeScript-, PostgreSQL- oder Docker-Compose-Migration ohne belegte Projektanforderung.
- Keine allgemeine Reference Architecture in den Workspace kopieren; dort steht nur angewandte
  Projektwahrheit.
