---
name: qatlas-core
description: >
  Bündelt ausdrücklich aufgerufene Qatlas-Kernadministration: ein Projekt einrichten, den Projektzustand
  diagnostizieren, die Statusline konfigurieren oder das maßgebliche Planungssystem wechseln.
  Ohne Argument eine kompakte Karte der verfügbaren Modi zeigen und nichts ausführen.
disable-model-invocation: true
argument-hint: "[init|doctor|statusline|backlog-system] [Argumente]"
---

# Qatlas-Core

Dieser Router bündelt ausdrücklich gestartete Administrationswerkzeuge des Plugins `qatlas`. Er ist keine
passive Infrastruktur und startet ohne eindeutigen Modus keine Änderung.

## Ohne Argument

Antworte nur mit der folgenden Karte als gerendertes Markdown in der Gesprächssprache; Struktur und Bezeichner
bleiben. Lies keine Modus-Referenz und ändere keinen Zustand.

### Qatlas Core

| Argument | Aufgabe |
|---|---|
| `init` | Richtet Qatlas und seinen Projektzustand ein. |
| `doctor` | Prüft Qatlas, Scaffold und Abhängigkeiten des Projekts, ohne zu reparieren. |
| `statusline` | Richtet die Statusline des aktuellen Hosts ein, passt sie an oder entfernt sie. |
| `backlog-system` | Wechselt oder migriert das maßgebliche Planungssystem eines Projekts. |

Aufruf: `qatlas-core <argument>`

## Modus wählen

`<plugin-root>` ist die im Sessionkontext genannte `QATLAS PLUGIN ROOT`; ohne Hook liegt sie zwei Ebenen
über dieser `SKILL.md`. Setze dieses aufgelöste Root immer in die gewählte Referenz ein.

- **`init`:** Lies [Qatlas einrichten](references/playbook-init.md) vollständig und führe nur dieses
  Verfahren aus.
- **`doctor`:** Lies [Qatlas diagnostizieren](references/playbook-doctor.md) vollständig und führe nur dieses
  Verfahren aus.
- **`statusline [Argumente]`:** Lies [Statusline konfigurieren](references/playbook-statusline.md)
  vollständig und führe nur dieses Verfahren mit den übrigen Argumenten aus.
- **`backlog-system [Quelle] [Ziel]`:** Lies [Planungssystem
  wechseln](references/playbook-backlog-system.md) vollständig und führe nur dieses Verfahren mit den
  übrigen Argumenten aus.

Ist ein übergebenes Argument mehrdeutig, nenne die passenden Optionen in je einem kurzen Satz und frage genau
eine ab. Ist es unbekannt, zeige die kompakte Karte und nenne das unbekannte Argument in einem Satz. Nimm
ein allgemeines Gespräch über Diagnose oder die Statusline nie als Aufruf dieses Skills.
