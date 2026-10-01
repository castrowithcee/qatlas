---
name: qatlas-council
description: >
  Startet ausschließlich auf ausdrücklichen Aufruf eine Beratung durch mehrere unabhängige Subagents.
  Ohne Modus für Ideen und Vorhaben; mit arch für technische Architekturentscheidungen.
disable-model-invocation: true
argument-hint: "[arch] [Idee oder Entscheidungsfrage]"
license: MIT
type: skill
edit: locked
---

# Qatlas Council

Council ist eine ausdrücklich gestartete, lesende Beratung. Der Hauptagent formuliert die Frage, wählt
unterschiedliche Perspektiven, beauftragt echte Subagents und synthetisiert ihre Befunde zu einer
begründeten Empfehlung. Council trifft keine formale Nutzerentscheidung und führt keine Arbeit aus.

## Einstieg wählen

- **Ohne `arch`:** Lies [Vorhaben beraten](references/playbook-initiative.md). Entwickle bei einer offenen
  Idee zunächst unterschiedliche Richtungen; prüfe bei einer Entscheidungsfrage Optionen und Gegenargumente.
- **Mit `arch`:** Lies [Architektur beraten](references/playbook-arch.md). Kläre Anforderungen, Systemstruktur
  und Risiken, bevor ein neuer Stack empfohlen wird.

Lies in beiden Fällen vollständig [das Council-Verfahren](references/playbook-protocol.md). Die
Modusreferenzen führen nur zu den für die konkrete Frage nötigen Plattformperspektiven. Ein einzelner Subagent
erhält genau eine ausgewählte Rolle, niemals den gesamten Rollenkatalog als Auftrag.

Ein vorhandenes Qatlas-Goal-Briefing oder bestätigtes Projektwissen kann als Eingang dienen, ist aber keine
Voraussetzung. Starte weder `qatlas goal` noch `qatlas shape` selbst. `goal` bleibt das allgemeine Gespräch;
`shape` dokumentiert später bestätigte Aussagen am maßgeblichen Ort und schneidet Arbeitspakete. Council
schreibt keine Dateien, Tasks, Status oder ADRs. Bei einem späteren Sessionwechsel kann der Nutzer seine
kompakte Council-Übergabe an `shape` weitergeben.

Fehlt die eigentliche Frage, bitte knapp um Idee und gewünschte Entscheidung. Eine allgemeine technische
Frage ohne Council-Aufruf aktiviert diesen Skill nicht.
