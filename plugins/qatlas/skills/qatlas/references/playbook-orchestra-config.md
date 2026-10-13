---
description: >
  Die nutzereigene orchestra.yaml für run und sentinel prüfen und Worker-Profile mit ausdrücklich gesetztem
  Modell und Effort auf die Subagents des Hosts abbilden.
type: playbook
edit: locked
license: MIT
---

# Orchestrierung prüfen

Lies vor der Taskauswahl `~/.qatlas/plugins/orchestra.yaml`. Diese nutzereigene Datei gilt nur für `run` und
`sentinel` und ist die einzige Quelle für die gewählten Modelle und Effort-Stufen. Prüfe, dass Format, die
Sektion des aktuellen Hosts, das Orchestrator-Modell und die benötigten Worker-Profile vorhanden und gültig
sind. Fehlt die Datei oder ihre Host-Sektion, ist ein Eintrag ungültig oder erscheint ein Modell veraltet oder
zweifelhaft, richte sie nach „Orchestrierung einrichten“ ein und beginne bis zur Klärung keinen Task.

Die Profile sind eine Allowlist: Verwende weder ein nicht eingetragenes Modell noch eine andere
Effort-Einstellung. Setze `effort: null` nur für ein Modell, das keinen Effort unterstützt; für alle anderen
Worker wird Effort ausdrücklich gesetzt und nicht vom Orchestrator geerbt.

Codex setzt beim Spawn Modell und Reasoning-Effort ausdrücklich. Claude Code verwendet für die Effort-Stufen
`low`, `medium`, `high`, `xhigh` und `max` jeweils den Plugin-Subagent `qatlas:run-low`,
`qatlas:run-medium`, `qatlas:run-high`, `qatlas:run-xhigh` beziehungsweise `qatlas:run-max` und übergibt
das Modell ausdrücklich beim Aufruf. Jeder andere Subagent-Typ erbt Effort und gegebenenfalls Modell des
Orchestrators und ist für Worker unzulässig. Wähle nur eine vom jeweiligen Host und Modell unterstützte Stufe;
`ultra` ist keine Claude-Code-Effort-Stufe. Für `effort: null` verwende ausschließlich bei einem Modell ohne
Effort-Unterstützung `qatlas:run-no-effort` ohne Effort-Frontmatter. Dessen Extended Thinking folgt der
Claude-Code-Session und wird von `orchestra.yaml` nicht gesteuert. Ist der passende Subagent nicht
verfügbar oder ersetzt der Host Modell oder eine gewählte Effort-Stufe durch andere Werte, starte mit
diesem Profil nicht. Weiche nicht auf eine andere Effort-Stufe aus.
