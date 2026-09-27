---
description: >
  Prüfperspektive für Architekturentscheidungen zu Erweiterungen bestehender Hostsysteme wie Obsidian
  oder WordPress.
license: MIT
type: playbook
edit: locked
---

# Host-Plugin-Perspektive

Ein Plugin erweitert ein vorhandenes System; dessen aktuelle Verträge und die Daten des Nutzers sind die
erste Architekturgrenze. Prüfe:

- Welche Host-APIs, Ereignisse, UI-Flächen und Lebenszyklusregeln tragen die gewünschte Funktion?
- Welche Daten des Hosts werden gelesen oder verändert, und wie bleiben Integrität, Rücknahme und
  Benutzererwartung erhalten?
- Welche Versionen des Hosts und welche anderen Erweiterungen müssen zusammen funktionieren?
- Welche Berechtigungen, fremden Inhalte und Netzwerkzugriffe entstehen? Was passiert bei Fehlern oder
  deaktiviertem Plugin?
- Wie werden Plugin, Einstellungen und eventuelle Datenmigrationen verteilt, aktualisiert und geprüft?

Leite konkrete APIs, Packaging-Formate oder Versionsgrenzen nur aus der aktuellen offiziellen
Hostdokumentation und dem bestehenden Projekt ab. Ein WordPress-Plugin erbt keinen Web-App-Stack-Kandidaten
allein wegen seiner Browseroberfläche. Hat es zusätzlich eine CLI oder mobile Oberfläche, lies auch deren
Perspektive.
