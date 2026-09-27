---
description: >
  Webperspektive für Architekturfragen zu Browserabläufen, UI-Zuständen, Daten- und Berechtigungsgrenzen
  sowie Hosting und Betrieb.
license: MIT
type: playbook
edit: locked
---

# Webperspektive

Bestimme zuerst, ob es um eine Inhaltsseite, interaktive Web-App oder ein Produkt mit mehreren Nutzern
geht. Die Bezeichnung allein erzwingt weder Authentisierung noch ein bestimmtes Framework. Prüfe nur die
für den tatsächlichen Ablauf relevanten Fähigkeiten:

- Welche Nutzerhandlung liefert den ersten Nutzen? Welche Lade-, Leer-, Fehler- und
  Berechtigungszustände sieht der Nutzer, auch bei langsamer Verbindung?
- Welche Browser- und Geräteunterstützung, Tastaturbedienung, semantischen Elemente und
  Zugänglichkeitsanforderungen sind Teil des Ergebnisses?
- Welche Daten gehören Personen, Teams oder Mandanten? Wo werden Identität und objektbezogene
  Berechtigungen serverseitig geprüft?
- Braucht der erste Umfang Dateien, Zahlungen, fremde APIs, öffentliche Schnittstellen, Hintergrundarbeit,
  Echtzeit oder Offline-Nutzung wirklich? Was wäre der beobachtbare Auslöser für spätere Fähigkeiten?
- Welche HTTP-, Session-, Cookie-, CORS- oder CSP-Grenzen sind für den gewählten Aufbau relevant? Welche
  Vorgänge benötigen Rate-, Größen- oder Zeitgrenzen?
- Welche Teile sind öffentlich erreichbar, welche Daten verlassen das System und wie werden Fehler,
  Backups, Restore und Rollback im vorgesehenen Betrieb behandelt?

Bei sichtbaren Oberflächen berücksichtige Interaktionszustände, Fokusführung, Tastatur und Touch auch für
Dialoge, Auswahlfelder und Navigation. Verlange kein umfassendes Designsystem, wenn der Auftrag nur eine
kleine Oberfläche betrifft. Für konkrete Sicherheits-, Browser- oder Frameworkdetails nutze die aktuell
geltenden Primärquellen und die vorhandene Projektarchitektur.
