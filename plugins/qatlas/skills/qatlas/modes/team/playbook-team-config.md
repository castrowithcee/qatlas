---
description: >
  Den optionalen Block team der nutzerweiten config.json mit Test-Slots, Modell für Lead und Integrator und
  Modell und Effort je Worker-Profil lesen, Subagents damit starten und den Block einrichten oder prüfen.
---

# Team-Konfiguration

Der Block `team` in `~/.qatlas/plugins/config.json` ist optional und gehört dem Nutzer; ändere ihn nur nach
seiner Zustimmung. Fehlt `hosts` oder dessen Abschnitt für den aktuellen Host, starte Leads und Integrator
ohne explizites Modell und lass jeden Worker Modell und Effort seines Leads erben.

```json
"team": {
  "test-slots": 2,
  "profiles": { "light": "<Beschreibung>", "standard": "<Beschreibung>", "demanding": "<Beschreibung>" },
  "hosts": {
    "claude-code": {
      "integrator": null,
      "lead": "opus",
      "worker": {
        "light": { "model": "haiku", "effort": null },
        "standard": { "model": "sonnet", "effort": "high" },
        "demanding": { "model": "opus", "effort": "high" }
      }
    }
  }
}
```

`test-slots` ist optional, darf allein stehen und begrenzt gleichzeitige volle Testläufe je Repo (Standard
2). `profiles` und `hosts` stehen nur gemeinsam. Die Beschreibungen unter `profiles` entscheiden, wie Arbeit
geschnitten wird. `hosts` trägt je Host (`claude-code`, `codex`) für `integrator` und `lead` je ein Modell oder
`null` und unter `worker` für jedes Profil `model` und `effort`; Effort gibt es nur je Worker-Profil.

## Lesen

Existiert der Block, lies ihn vor der Task-Auswahl. Seine `profiles` ersetzen die Profilbeschreibungen aus
„Einen Task ausführen“; ein `null`-Modell erbt. Ist der Block ungültig, wirkt ein eingetragenes Modell
veraltet oder zweifelhaft oder verlangt es der Nutzer, richte ihn nach „Einrichten und prüfen“ ein und starte
keinen Task, bis das geklärt ist.

Behandle eingetragene Profile als Allowlist: Verwende weder ein anderes Modell noch eine andere
Effort-Einstellung als die eingetragene. `effort: null` markiert ein Modell ohne Effort-Unterstützung.

## Subagents starten

Starte Lead und Integrator mit dem Modell ihrer Rolle, einen Worker mit Modell und Effort seines Profils, so:

- **Claude Code:** `model` und bei einem Worker `effort` als Parameter des Aufrufs, einen Worker mit dem
  Subagent-Typ `qatlas:worker`; lass einen Parameter weg, den der Block nicht setzt oder auf `null` setzt. Der
  Aufruf akzeptiert Modell-Aliase wie `haiku`, `sonnet` oder `opus`, keine vollständigen Modell-IDs. Bietet
  der Aufruf in der laufenden Version keinen Effort-Parameter, starte kein Profil, das Effort setzt, und nenne
  ein Update von Claude Code als Voraussetzung.
- **Codex:** Setze das Modell und bei einem Worker den Reasoning-Effort beim Start explizit.

Wähle nur eine Stufe, die Host und Modell unterstützen; `ultra` ist keine Effort-Stufe von Claude Code.
Ersetzt der Host das Modell oder den gewählten Effort durch andere Werte, starte nicht mit diesem Profil und
weiche nicht auf eine andere Effort-Stufe aus.

## Einrichten und prüfen

Als Supervisor erledige das vor dem ersten Lead; als Lead frage bei einem Problem mit dem Block den
Supervisor.

- **Block oder `hosts` fehlt:** Ermittle die Modell-IDs oder nativen Aliase und Effort-Stufen, die für den
  aktuellen Host verfügbar sind. Zeige `profiles` und `hosts` konkret ausgefüllt nur mit diesem Host,
  einschließlich `integrator` und `lead`, und frage, ob sie angelegt werden sollen. Schreibe keine Platzhalter; lassen sich Werte nicht
  verifizieren, frage danach.
- **`hosts` vorhanden:** Prüfe Host, die drei Profile, `lead`, `integrator` und alle gewählten
  `worker`-Profile. Akzeptiere als Modellwerte nur IDs oder native Aliase, die der Host unterstützt; deute bloße
  Familiennamen nicht selbst als Alias. Prüfe die Einträge gegen die Auswahl, die im Host aktuell verfügbar
  ist, und verifiziere zweifelhafte oder neue Modelle anhand aktueller offizieller Host-Informationen. Ist ein
  Eintrag veraltet oder ein neues Modell plausibel besser für ein Profil, schlage die konkrete Änderung mit
  Begründung vor; ersetze einen gültigen Eintrag nie stillschweigend durch ein neues Modell. Fehlt der
  Abschnitt des aktuellen Hosts und der Nutzer will einen, schlage seine konkret ausgefüllte Ergänzung vor.

Stoppe bei einem ungültigen `lead`-Modell oder einem Profil, das für den verlangten Task nicht nutzbar ist,
vor dem Beanspruchen des Tasks; andere gültige Profile darfst du weiter nutzen. Behaupte keine Prüfung der
Modellverfügbarkeit, die der Host nicht erlaubt.
