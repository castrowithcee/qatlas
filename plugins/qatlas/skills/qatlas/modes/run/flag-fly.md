---
description: >
  Bedeutung von --fly im Run: Der Nutzer ist während des Laufs nicht erreichbar, und der Orchestrator
  entscheidet, nimmt an oder übergibt, ohne zu warten.
type: playbook
edit: locked
license: MIT
---

# `--fly` im Run

Der Nutzer ist während des Laufs nicht erreichbar; kein Schritt wartet auf seine Antwort. Kläre vor dem
ersten Task alles, was den Lauf später anhalten würde, und entscheide jede Frage, die sonst den Nutzer
bräuchte, nach „Ohne Nutzer entscheiden“. Eine menschliche Übergabe setzt du nach dem Abnahmeblock auf
`review` und fährst mit dem nächsten unabhängigen Task fort. Jede Annahme hältst du im Task fest und nennst
sie im Abschlussblock unter **Angenommen**.
