---
description: >
  Prüfperspektive für Architekturentscheidungen zu Kommandozeilenwerkzeugen, Skriptbarkeit,
  Distribution und lokalen Daten.
license: MIT
type: playbook
edit: locked
---

# CLI-Perspektive

Prüfe vor der Werkzeugwahl den Vertrag der Benutzeroberfläche:

- Welche Befehle, Argumente und Optionen bilden die Nutzeraufgabe ab? Was muss für Skripte stabil sein?
- Welche Ausgaben gehören auf stdout oder stderr, und welche Fehler brauchen unterscheidbare Exit-Codes?
- Welche Vorgänge sind interaktiv, und wie funktionieren sie ohne Terminal oder in einer Pipeline?
- Wo liegen Konfiguration, lokaler Zustand und Zugangsdaten, und wie werden sie aktualisiert oder entfernt?
- Welche Betriebssysteme, Installationswege, Update- und Rückwärtskompatibilitätsgrenzen gelten wirklich?
- Welche Dateisystem-, Netzwerk- und Berechtigungswirkungen brauchen Begrenzung oder Bestätigung?

Nutze vorhandene Projektkonventionen. Prüfe Laufzeit-, Packaging- und Plattformdetails gegen aktuelle
offizielle Quellen. Eine Bibliothek oder ein Framework ist erst nach Klärung des CLI-Vertrags ein Kandidat.
