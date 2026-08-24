---
name: qatlas-mode
description: >
  Aktiviert auf ausdrücklichen Aufruf einen dauerhaften Ausgabe- und Zusammenarbeitsmodus für die aktuelle
  Session. Derzeit verfügbar: qatlas-mode adhd. Ohne Argument eine kompakte Karte der verfügbaren Modi
  zeigen und nichts aktivieren.
disable-model-invocation: true
argument-hint: "[adhd]"
license: MIT
type: skill
edit: locked
---

# Qatlas-Modus

## Ohne Argument

Antworte ausschließlich mit der folgenden Karte als gerendertes Markdown. Lies keine Modusreferenz und
aktiviere nichts.

### Qatlas Mode

| Argument | Aufgabe |
|---|---|
| `adhd` | Formt Ausgaben für den Rest der Session handlungsfreundlich für Leser mit ADHD. |

Aufruf: `qatlas-mode <argument>`

## Modus wählen

Wähle ausschließlich den ausdrücklich genannten Sessionmodus:

- **`adhd`:** Lies vollständig [ADHD-Modus](references/adhd.md), aktiviere seine Regeln für den Rest der
  Session und bestätige die Aktivierung knapp.

Ist ein vorhandenes Argument nicht eindeutig, nenne nur die passenden Modi und frage nach genau einem. Ist
es unbekannt, zeige die kompakte Karte und nenne das unbekannte Argument in einem Satz. Ein Modus startet
weder einen Qatlas-Arbeitslauf noch dauerhafte Projektänderungen.
