---
description: >
  Prüffragen für Datenschutz, Sicherheitsniveau, Hosting, Umgebungen, Backups, Observability,
  Wiederherstellung und Betriebsrisiken eines Webprodukts.
license: MIT
type: playbook
edit: locked
---

# Betrieb und Risiko prüfen

## Schutzbedarf

- Welche Datenklassen werden verarbeitet und wem gehören sie?
- Welche Daten dürfen nie gespeichert oder geloggt werden?
- Welche Aufbewahrungs-, Export- und Löschanforderungen gelten?
- Welche Folgen hätte unberechtigtes Lesen, Ändern, Löschen oder Nichtverfügbarkeit?
- Sind Auditierbarkeit, Moderation oder regulatorische Vorgaben relevant?

## Hosting und Umgebungen

- Managed Hosting oder Self-Hosting und der Grund dafür
- lokale, Preview-, Staging- und Produktionsumgebung
- Daten- und Secret-Trennung zwischen Umgebungen
- Domain, TLS, DNS, CDN und E-Mail-Zustellung, sofern benötigt
- Region, Datenstandort und Abhängigkeit von Anbietern

## Zuverlässigkeit

- akzeptable Ausfallzeit und degradierter Betrieb
- Backupumfang, Frequenz, Aufbewahrung und getesteter Restore
- gewünschte Wiederherstellungszeit und tolerierbarer Datenverlust
- Rollback für Anwendung und Datenmigration
- Ausfallverhalten externer Dienste und Background Jobs

## Beobachtbarkeit

- strukturierte Logs ohne Secrets und unnötige personenbezogene Daten
- technische und fachliche Metriken
- Traces bei verteilten oder schwer nachvollziehbaren Abläufen
- Healthchecks, Uptime-Prüfung und handlungsfähige Alerts
- Verantwortlichkeit und Eskalationsweg bei einem Vorfall

## Qualität und Wartung

- unterstützte Browser und Geräte
- Testebenen und verbindliche CI-Prüfungen
- Dependency-, Runtime- und Datenbank-Updates
- Migrations- und Deprecation-Strategie für externe Verträge
- erwartetes Kostenprofil und Kostenlimits für Storage, Traffic, AI und Drittanbieter

Das Betriebsprofil definiert den für den aktuellen Horizont angemessenen Schutz. Nicht benötigte
Enterprise-Maßnahmen werden nicht vorgebaut; Wiederherstellbarkeit, Secret-Schutz und Autorisierung sind
dennoch keine optionalen Skalierungsfeatures.
