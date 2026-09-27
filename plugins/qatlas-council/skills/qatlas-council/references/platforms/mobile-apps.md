---
description: >
  Prüfperspektive für Architekturentscheidungen zu mobilen Anwendungen mit Gerätefunktionen,
  Offline-Verhalten, Datenabgleich und Veröffentlichung.
license: MIT
type: playbook
edit: locked
---

# Mobile-App-Perspektive

Prüfe die Grenzen des geplanten Nutzerablaufs auf den Zielgeräten:

- Welche Aufgaben müssen offline möglich sein, und wie werden lokale Änderungen bei Wiederverbindung
  abgeglichen oder als Konflikt gezeigt?
- Welche Gerätefunktionen und Berechtigungen braucht der erste Umfang tatsächlich? Wie wirkt eine
  verweigerte Berechtigung auf den Ablauf?
- Welche Daten verbleiben auf dem Gerät, welche werden übertragen und wie erfolgen Schutz, Löschung und
  Wiederherstellung?
- Welche Hintergrundarbeit, Benachrichtigungen und Energie- oder Netzgrenzen sind relevant?
- Welche Zugänglichkeits-, Bildschirmgrößen- und Eingabeanforderungen muss die Oberfläche erfüllen?
- Wie werden Versionen verteilt, Fehler erkannt und Änderungen an Datenformaten oder Backendverträgen
  über gleichzeitig installierte App-Versionen hinweg behandelt?

Die Plattform- und Veröffentlichungsregeln ändern sich. Prüfe konkrete APIs, Limits und Store-Vorgaben
erst für die gewählte Plattform in deren aktuellen offiziellen Quellen. Ein Webdienst im selben Produkt
braucht zusätzlich die Webperspektive.
