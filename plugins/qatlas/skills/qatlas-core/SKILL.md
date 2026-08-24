---
name: qatlas-core
description: >
  Bündelt ausdrücklich aufgerufene Qatlas-Verwaltung: Projektzustand diagnostizieren, Statusline und
  Telegram-Ping konfigurieren oder das maßgebliche Planungssystem wechseln. Nur durch qatlas-core mit
  einem Modus starten. Ohne Argument eine kompakte Karte der verfügbaren Modi zeigen und nichts ausführen.
disable-model-invocation: true
argument-hint: "[doctor|statusline|ping [telegram]|backlog-system] [Argumente]"
license: MIT
type: skill
edit: locked
---

# Qatlas-Core

Dieser Router bündelt ausdrücklich gestartete Verwaltungswerkzeuge des `qatlas`-Plugins. Er ist keine
passive Infrastruktur und startet ohne eindeutigen Modus keine Änderung.

## Ohne Argument

Antworte ausschließlich mit der folgenden Karte als gerendertes Markdown. Lies keine Modusreferenz und
ändere keinen Zustand.

### Qatlas Core

| Argument | Aufgabe |
|---|---|
| `doctor` | Prüft Qatlas, Scaffold, Abhängigkeiten und den Projektupdate-Stand ohne Reparatur. |
| `statusline` | Richtet die Statusline des aktuellen Hosts ein oder passt sie an. |
| `ping` oder `ping telegram` | Richtet Telegram-Benachrichtigungen beim Warten ein oder testet sie. |
| `backlog-system` | Wechselt oder migriert das maßgebliche Planungssystem eines Projekts. |

Aufruf: `qatlas-core <argument>`

## Modus wählen

`<plugin-root>` ist der im Sessionkontext genannte `QATLAS PLUGIN ROOT`; ohne Hook liegt er zwei Ebenen
über dieser `SKILL.md`. Setze in der gewählten Referenz immer diesen aufgelösten Root ein.

- **`doctor`:** Lies vollständig [Qatlas diagnostizieren](references/doctor.md) und führe nur dieses
  Verfahren aus.
- **`statusline [Argumente]`:** Lies vollständig
  [Statusline konfigurieren](references/statusline.md) und führe nur dieses Verfahren mit den restlichen
  Argumenten aus.
- **`ping`** oder **`ping telegram [Argumente]`:** Lies vollständig
  [Telegram-Ping einrichten](references/telegram-ping.md) und führe nur dieses Verfahren mit den restlichen
  Argumenten aus.
- **`backlog-system [Quelle] [Ziel]`:** Lies vollständig
  [Planungssystem wechseln](references/backlog-system.md) und führe nur dieses Verfahren mit den restlichen
  Argumenten aus.

Ist ein vorhandenes Argument nicht eindeutig, nenne die passenden Möglichkeiten jeweils in einem kurzen
Satz und frage nach genau einem. Ist es unbekannt, zeige die kompakte Karte und nenne das unbekannte
Argument in einem Satz. Deute eine allgemeine Diagnose-, Statusline- oder Telegram-Unterhaltung nie als
Aufruf dieses Skills.
