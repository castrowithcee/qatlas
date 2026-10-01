---
description: >
  Eigentum und Isolation von Branches und Worktrees, wenn mehrere Agenten parallel in einem Repo schreiben
  oder einen vorhandenen Arbeitsstand übernehmen.
license: MIT
type: rule
edit: locked
---

# Branches und parallele Arbeit

Prüfe Worktrees, Branches und die vorhandene gemeinsame Task-Zuordnung. Ein registrierter
Worktree beweist nicht, ob sein bisheriger Agent noch arbeitet. Kläre ungeklärtes Eigentum, bevor du einen
vorhandenen Arbeitsstand veränderst.

- Jeder gleichzeitig schreibende Agent arbeitet in einem eigenen registrierten Worktree auf einem exklusiven
  Branch. Zwei Schreiber nutzen nie denselben Arbeitsbaum. Bestimme für einen gemeinsamen Zielbranch genau
  einen Integrationsbesitzer.
- Überlappen Änderungen an Dateien, Schnittstellen oder Migrationen so, dass sie nicht sicher getrennt
  integriert werden können, führe die Arbeiten seriell oder als ausdrücklich abhängige Branches aus.
- Trenne gemeinsam genutzte Schreibziele wie Build-Ausgaben, Caches, Dienste, Ports und Datenbanken oder
  nutze sie nacheinander. Tests und Builds, die Dateien erzeugen, zählen als schreibende Arbeit.
