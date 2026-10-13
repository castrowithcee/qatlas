---
description: >
  Bedeutung von --fly im Sentinel: Der Nutzer ist während des Laufs nicht erreichbar, und der Sentinel
  beantwortet die Fragen der Orchestratoren selbst.
type: playbook
edit: locked
license: MIT
---

# `--fly` im Sentinel

Der Nutzer ist während des Laufs nicht erreichbar; kein Schritt wartet auf seine Antwort. Kläre vor dem
ersten Orchestrator alles, was den Lauf später anhalten würde, nach „Ohne Nutzer entscheiden“. Das Flag gilt
nur für dich: Die Orchestratoren fragen weiterhin dich und erhalten es nie.

Beantworte eine `question`, die das Projektwissen nicht belegt, nach derselben Entscheidungsleiter:

- **Annahme:** Gib sie als Antwort weiter, protokolliere sie mit `log --type annahme` und nenne sie im
  Abschlussblock unter **Angenommen**.
- **Menschliche Übergabe:** Antworte mit der Anweisung, den Task an `review` zu übergeben und mit dem
  nächsten Task des Pakets fortzufahren.
