---
name: qatlas
description: >
  Steuert auf ausdrücklichen Aufruf den Qatlas-Arbeitsloop: Ziele klären, Arbeit zuschneiden und einplanen,
  Tasks eigenständig ausführen und menschliche Übergaben abschließen. Ohne Modus nur die Modus-Karte zeigen.
  Nie automatisch starten.
disable-model-invocation: true
argument-hint: "[goal|shape|team|review] [idea|task|file|backlog] [--limit <n|0>] [--ask]"
---

# Qatlas

Der Qatlas-Arbeitsloop startet nur auf ausdrücklichen Aufruf.
Ein Modus autorisiert nie stillschweigend den nächsten.

## Modus wählen

Lies zuerst [den gemeinsamen Vertrag](references/playbook-contract.md) und dann die Datei des gewählten
Modus, beide vollständig. Die Modusdatei nennt jeden weiteren Block und wann du ihn liest.

- **`goal`:** [Plan klären](modes/goal/goal.md).
- **`shape`:** [Zuschneiden](modes/shape/shape.md).
- **`team`:** [Team](modes/team/team.md).
- **`review`:** [Übergaben abschließen](modes/review/review.md).

## Ohne Modus

Antworte nur mit dieser Karte als gerendertes Markdown. Lies nichts, empfiehl keinen Modus und ändere
nichts:

```card
### Qatlas

Du musst einen Modus wählen. Einige Beispiele:  
- `qatlas goal [Idee, Task oder Datei]`
- `qatlas shape [Datei, Task oder Backlog]`
- `qatlas team [Scope] [--limit <n|0>] [--ask]`
- `qatlas review [Scope]`
```
