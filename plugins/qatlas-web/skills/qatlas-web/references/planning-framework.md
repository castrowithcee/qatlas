---
description: >
  Verbindlicher Planungsrahmen für Produktumfang, Architektur, Sicherheit und evolvierbare MVPs bei
  Websites, Web-Apps und SaaS-Produkten.
license: MIT
type: playbook
edit: locked
---

# Planungsrahmen für Webprodukte

## Ziel und Rangfolge

Übersetze Produktanforderungen in die kleinste vollständig tragfähige Lösung. Bei Konflikten gilt:

1. ausdrückliche Entscheidung des Nutzers für das konkrete Projekt
2. dokumentierte Produkt- und Architekturentscheidung des Projekts
3. dieser Planungsrahmen
4. gewählte Reference Architecture und Stack-Profil
5. allgemeiner Default des verwendeten Frameworks

Fehlende Anforderungen werden nicht still erfunden. Kennzeichne Annahmen und frage nach, wenn eine Antwort
Produktumfang, Datenmodell, Sicherheitsgrenze oder spätere Entwicklung wesentlich verändert.

## Produktentwicklung

- Problem, Zielgruppe und zentralen Nutzerablauf vor dem Stack klären.
- Ein MVP ist der kleinste Lieferumfang, der eine überprüfbare Produkthypothese testet. Er ist kein
  endgültiger Soll-Zustand.
- Aktuellen Umfang, realistischen Zielhorizont, heute zu erhaltende Nahtstellen und bewusst zurückgestellte
  Fähigkeiten getrennt festhalten.
- Infrastruktur nicht auf Verdacht planen. Eine wahrscheinliche Zukunft wird durch saubere Grenzen und
  Einführungstrigger vorbereitet, nicht durch vorsorglich betriebene Services.
- Produktklassen sind Einstiegshilfen, keine linearen Reifestufen. Auth, Dateien, Realtime, Zahlungen oder
  Jobs werden unabhängig voneinander aus Anforderungen abgeleitet.

## Architekturprinzipien

1. Mit möglichst wenigen Deployables und klaren internen Modulgrenzen beginnen.
2. Domain- und Core-Code von Webframework, HTTP, Persistenz und konkreten Drittanbietern unabhängig halten.
3. Transport-, Persistenz-, Storage-, Identity- und externe Integrationen als Adapter behandeln.
4. Verträge und Validierung an Systemgrenzen zentral halten.
5. Ein zusätzliches Datensystem, eine Queue, ein Worker, eine separate API oder weitere Sprache braucht
   einen dokumentierten Zweck.
6. Lange, zeitversetzte oder retry-fähige Arbeit nicht an einen HTTP-Request binden.
7. Persistente Binärdaten nicht im Container-Dateisystem ablegen.
8. Jede Abweichung von der gewählten Baseline nennt Anforderung, Nutzen, zusätzliche Betriebskosten und
   Rückweg.

## Sicherheits- und Datenbaseline

- Authentifizierung nicht selbst entwerfen. Passwort-Handling, MFA, Recovery und Identity-Lifecycle einer
  etablierten Lösung überlassen.
- Provider-Identität, fachliches Benutzerprofil und Berechtigungen getrennt modellieren.
- Jede Servergrenze als öffentlich erreichbar behandeln: Eingaben validieren, Authentifizierung und
  Autorisierung serverseitig prüfen und Daten minimieren.
- Berechtigungen standardmäßig verweigern, objektbezogen prüfen und nicht auf ausgeblendete UI verlassen.
- Tenant-, Workspace- oder Eigentumsgrenzen vor fremdem Zugriff im Datenmodell ausdrücken.
- Secrets nie versionieren oder loggen. Schutzwürdige Daten klassifizieren und Aufbewahrung, Export und
  Löschung vor Produktivbetrieb klären.
- Sicherheitsrelevante Ereignisse nachvollziehbar protokollieren, ohne Tokens, Secrets oder unnötige
  personenbezogene Daten aufzunehmen.

## Qualitätsbaseline

- Responsive Verhalten, Accessibility sowie Lade-, Leer- und Fehlerzustände als Funktion behandeln.
- Native semantische Elemente und Plattformfunktionen bevorzugen.
- Jede Eingabe sichtbar beschriften und Fehler verständlich mit dem betroffenen Feld verbinden.
- Interaktive Komponenten mit ihren relevanten Zuständen, Fokusführung, Tastatur-, Touch- und
  Viewport-Verhalten planen.
- Jede spätere Änderung in angemessenem Verhältnis mit Typprüfung, automatisierten Tests und bei sichtbarer
  Oberfläche im Browser prüfen.
