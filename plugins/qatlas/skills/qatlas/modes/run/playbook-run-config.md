---
description: >
  Den optionalen Block run der nutzerweiten config.json mit Test-Slots sowie Modell und Effort für Lead,
  Integrator und jedes Worker-Profil lesen, Subagents damit starten und den Block einrichten oder prüfen.
---

# Lauf-Konfiguration

Der Block `run` in `~/.qatlas/plugins/config.json` ist optional und gehört dem Nutzer; ändere ihn nur nach
seiner Zustimmung. Fehlt `hosts` oder dessen Abschnitt für den aktuellen Host, starte jeden Subagent des Laufs
ohne Modell und Effort; was er dann erbt, bestimmt der Host.

```json
"run": {
  "test-slots": 2,
  "profiles": { "light": "<Beschreibung>", "standard": "<Beschreibung>", "demanding": "<Beschreibung>" },
  "hosts": {
    "claude-code": {
      "integrator": { "model": "opus", "effort": "medium" },
      "lead": { "model": "opus", "effort": "high" },
      "worker": {
        "light": { "model": "haiku", "effort": null },
        "standard": { "model": "sonnet", "effort": "high" },
        "demanding": { "model": "opus", "effort": "high" }
      }
    }
  }
}
```

`test-slots` ist optional, darf allein stehen und begrenzt gleichzeitige volle Testläufe dieses Nutzers auf
dem ganzen Host, über alle Repos und Läufe hinweg (Standard 2). `profiles` und `hosts` stehen nur gemeinsam. Die Beschreibungen unter `profiles` entscheiden, wie Arbeit
geschnitten wird. `hosts` trägt je Host (`claude-code`, `codex`) für `integrator`, `lead` und unter `worker`
für jedes Profil `model` und `effort`, jeweils als Text oder `null`.

## Lesen

Existiert der Block, lies ihn vor der Task-Auswahl. Seine `profiles` ersetzen die Profilbeschreibungen aus
„Einen Task ausführen“. Ist der Block ungültig, wirkt ein eingetragenes Modell veraltet oder zweifelhaft oder
verlangt es der Nutzer, richte ihn nach „Einrichten und prüfen“ ein und starte keinen Task, bis das geklärt
ist.

Behandle die eingetragenen Rollen und Profile als Allowlist: Verwende weder ein anderes Modell noch einen
anderen Effort als eingetragen. `null` heißt, dass du den Wert beim Start weglässt und der Host ihn vererbt;
bei `effort` ist das für ein Modell ohne Effort-Unterstützung nötig.

## Subagents starten

Starte Lead und Integrator mit Modell und Effort ihrer Rolle, einen Worker mit Modell und Effort seines
Profils. Starte jeden anderen Subagent des Laufs, auch eine schreibgeschützte Analyse des Supervisors, als
Worker mit einem Profil. So:

- **Claude Code:** `model` und `effort` als Parameter des Aufrufs, einen Worker mit dem Subagent-Typ
  `qatlas:worker`; lass einen Parameter weg, den der Block auf `null` setzt. Der Aufruf akzeptiert
  Modell-Aliase wie `haiku`, `sonnet` oder `opus`, keine vollständigen Modell-IDs. Bietet der Aufruf in der
  laufenden Version keinen Effort-Parameter, starte nichts, wofür der Block Effort setzt, und nenne ein Update
  von Claude Code als Voraussetzung. Lehnt der Host einen Start mit Verweis auf `run.hosts.claude-code` ab,
  wiederhole ihn mit einer dort genannten Kombination und umgehe die Ablehnung nicht über einen anderen
  Subagent-Typ.
- **Codex:** Setze Modell und Reasoning-Effort als Parameter des Starts explizit.

Wähle nur eine Stufe, die Host und Modell unterstützen; `ultra` ist keine Effort-Stufe von Claude Code.
Ersetzt der Host das Modell oder den gewählten Effort durch andere Werte, starte nicht mit dieser Rolle oder
diesem Profil und weiche nicht auf eine andere Effort-Stufe aus.

## Einrichten und prüfen

Als Supervisor erledige das vor dem ersten Lead; als Lead frage bei einem Problem mit dem Block den
Supervisor.

- **Block oder `hosts` fehlt:** Ermittle die Modell-IDs oder nativen Aliase und Effort-Stufen, die für den
  aktuellen Host verfügbar sind. Zeige `profiles` und `hosts` konkret ausgefüllt nur mit diesem Host,
  einschließlich `integrator` und `lead`, und frage, ob sie angelegt werden sollen. Schreibe keine
  Platzhalter; lassen sich Werte nicht verifizieren, frage danach.
- **`hosts` vorhanden:** Prüfe Host, die drei Profile, `lead`, `integrator` und alle gewählten
  `worker`-Profile. Akzeptiere als Modellwerte nur IDs oder native Aliase, die der Host unterstützt; deute bloße
  Familiennamen nicht selbst als Alias. Steht bei `lead` oder `integrator` `effort: null` für ein Modell mit
  Effort-Unterstützung, schlage einen konkreten Effort vor. Prüfe die Einträge gegen die Auswahl, die im Host aktuell verfügbar
  ist, und verifiziere zweifelhafte oder neue Modelle anhand aktueller offizieller Host-Informationen. Ist ein
  Eintrag veraltet oder ein neues Modell plausibel besser für ein Profil, schlage die konkrete Änderung mit
  Begründung vor; ersetze einen gültigen Eintrag nie stillschweigend durch ein neues Modell. Fehlt der
  Abschnitt des aktuellen Hosts und der Nutzer will einen, schlage seine konkret ausgefüllte Ergänzung vor.

Stoppe bei einem ungültigen Eintrag für `lead` oder einem Profil, das für den verlangten Task nicht nutzbar
ist, vor dem Beanspruchen des Tasks; andere gültige Profile darfst du weiter nutzen. Behaupte keine Prüfung
der Modellverfügbarkeit, die der Host nicht erlaubt.
