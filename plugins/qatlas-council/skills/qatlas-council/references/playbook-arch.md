---
description: >
  Drei Phasen und Fachperspektiven für technische Architekturentscheidungen über Web, Mobile, CLI und
  Erweiterungen bestehender Hostsysteme hinweg.
license: MIT
type: playbook
edit: locked
---

# Architektur beraten

`arch` prüft, wie ein Vorhaben technisch tragfähig umgesetzt werden kann. Eine offene Frage nach seinem
Nutzen gehört in die allgemeine Council-Beratung. Ein vorhandener Stack, bestätigte Architektur und
Projektgrenzen sind Eingang, kein Anlass für eine Migration. Passe Tiefe und Rollen an die Entscheidung an.

## Drei Phasen

1. **Passung und Anforderungen:** Übernimm bestätigtes Zielbild und reale Abläufe. Kläre funktionale
   Grenzen, kritische Nutzerwege, Datenarten, Integrationen, messbare Qualitätsziele und Betriebsrahmen.
   Trenne bekannte Werte von Schätzungen. Fehlen Voraussetzungen für eine konkrete Strukturentscheidung,
   halte genau diese Lücke fest.
2. **Struktur und Risiko:** Vergleiche die kleinsten tragfähigen Systemgrenzen und Datenflüsse. Prüfe
   Berechtigungen, Trust Boundaries, Ausfallverhalten, Ressourcenlimits, Betrieb und Nachweisbarkeit dort,
   wo sie für das Vorhaben relevant sind. Benenne Alternativen mit ihren Kosten und Risiken. Eine
   Komponentenliste ist noch keine Architekturbegründung.
3. **Stack und Bereitschaft:** Vergleiche konkrete Technologien erst gegen die geklärten Anforderungen
   und die gewählte Struktur. Nutze bestehende tragfähige Technik zuerst; bei einem neuen Stack sind
   Plattformvorgaben, Teamfähigkeit, Wartung, Betrieb und Kosten Entscheidungskriterien. Fordere für
   kritische Annahmen einen Spike oder Test. Prüfe Produktionsreife nur, wenn ein produktiver Einsatz
   Gegenstand der Frage ist.

Bei einer fokussierten Frage arbeite an ihrer Phase und kennzeichne fehlende Vorbedingungen. Ein
vollständiger Review durchläuft die Phasen nacheinander, ohne offene Fragen mit Stacknamen zu verdecken.
Council empfiehlt eine Entscheidung, erklärt sie aber nicht zur akzeptierten ADR.

Nenne einen Blocker nur mit Ursache, Auswirkung und einem überprüfbaren Kriterium, das ihn auflöst.
Bei einem vorgesehenen Produktivbetrieb prüfe bedarfsweise Identität und Berechtigungen, Schutz öffentlicher
Schnittstellen und Secrets, Ressourcen- und Fehlergrenzen, Beobachtbarkeit, Backup und Restore sowie
Rollback. Trenne echte Freigabehindernisse von späteren Verbesserungen. Verbleibende Risiken kann nur der
zuständige Mensch akzeptieren.

## Mögliche Rollen

| Rolle | Unabhängige Leitfrage |
|---|---|
| Strategist | Welche technische Komplexität trägt das Ziel tatsächlich? |
| Expert | Welche Fachregeln, Hostvorgaben und Ausnahmefälle darf die Struktur nicht verletzen? |
| Designer | Welche Nutzerabläufe, Fehlerzustände und Zugänglichkeitsgrenzen muss sie ermöglichen? |
| Architect | Welche Systemgrenzen, Verträge und Failure Modes erfüllen die Anforderungen einfach? |
| Security | Welche Angriffs-, Missbrauchs- und Berechtigungsgrenzen sind entscheidend? |
| Operator | Wie wird das Ergebnis verteilt, betrieben, beobachtet und wiederhergestellt? |
| Data | Welche Datenintegrität, Lebensdauer, Migration und Löschung werden benötigt? |
| Tester | Welcher Nachweis würde Anforderungen und kritische Risiken tatsächlich prüfen? |

Wähle gewöhnlich zwei bis vier dieser Rollen. Breite Rollen wie Architect können einen Vorschlag führen,
dürfen aber die unabhängige Prüfung einer betroffenen Grenze nicht ersetzen. Gib fehlende
Fachkenntnis als offene Abhängigkeit an, statt eine Host-API zu erfinden.

## Plattformperspektiven

Lies nur die zur Frage passenden Referenzen; mehrere können zugleich gelten. Die Referenzen liefern
Prüffragen und mögliche Muster, keine aktuelle Plattformdokumentation:

- [Webprodukte](platforms/web.md) bei Browseroberflächen, Websites, Web-Apps oder SaaS. Lies
  [Web-Stack-Kandidaten](platforms/web-stack.md) erst in Phase 3 für eine neue Stackentscheidung.
- [CLI](platforms/cli.md) bei Kommandozeilenoberflächen oder skriptbaren Werkzeugen.
- [Mobile Apps](platforms/mobile-apps.md) bei iOS- oder Android-Anwendungen.
- [Host-Plugins](platforms/host-plugins.md) bei Erweiterungen wie Obsidian- oder WordPress-Plugins.

Für nicht abgedeckte Plattformen bestimme deren Grenzen anhand der aktuellen offiziellen Quellen und des
vorhandenen Projekts. Lege keinen neuen Plattform-Standard aus bloßer Ähnlichkeit fest.
