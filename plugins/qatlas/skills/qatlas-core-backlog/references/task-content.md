---
description: >
  Inhalt eines Tasks in jedem Planungssystem: der Rumpf mit seinen Abschnitten, der aktuelle Stand statt
  eines Journals und der Abschlussbericht je Status.
---

# Inhalt eines Tasks

Schreibe den Text eines Tasks an die Stelle, die die Bindung als aktuellen Datensatz nennt.

## Rumpf

Lies vor dem Anlegen eines Tasks vollständig [den Rumpf](../assets/task.md). Übernimm seine Abschnitte ohne
das Frontmatter, fülle jeden und ersetze jeden Kommentar und Platzhalter. Weiche vom Rumpf nur mit einem
Grund ab, etwa weil das Planungssystem für einen Abschnitt ein eigenes Feld hat.

## Aktueller Stand

Halte einen offenen Task als kompakten aktuellen Stand seiner Arbeit, nicht als laufendes Journal. Er bleibt
in einem vollständigen Lesen eigenständig ausführbar:

- Lass in Warum, Ergebnis, Scope, Leitplanken, Abhängigkeiten, Vorgehen und Abnahmekriterien nur Aussagen
  stehen, die noch gelten. Arbeite eine getroffene Entscheidung an ihrer Stelle ein und entferne die dadurch
  überholten Alternativen.
- Arbeite eine Entscheidung, die über den Task hinaus bindet, in die reservierte Datei von `.qatlas-brain/`
  ein, die sie betrifft, oder in `AGENTS.md`, wenn sie in jeder Session gelten muss.
- Fasse eine stabile Repo-Quelle kurz zusammen, statt sie zu duplizieren. Jede Grenze und Entscheidung, die
  die Ausführung braucht, bleibt im Task.
- Halte rohe Logs, vollständige Befehlsausgaben, allgemeine Kommunikation, verworfene Versuche und eine
  Chronologie, die der nächste Schritt nicht braucht, aus dem Task heraus. Das Protokoll der Vergangenheit ist
  die Historie des Planungssystems.

Schneide nie nach einer harten Token-, Zeilen- oder Zeichengrenze. Lässt sich selbst der noch gültige
Taskvertrag nicht mehr in einer Session ausführen, schneide die verbleibende Arbeit bewusst neu. Entferne
keine bindende Entscheidung und keinen nötigen Grund nur für einen kürzeren Task.

## Abschlussbericht

Der Abschnitt `Abschlussbericht` ist die einzige statusabhängige Übergabestelle. Schreibe ihn bei einem
Statuswechsel, bevor du den Status setzt. Ersetze und verdichte seinen bisherigen Inhalt, statt Laufberichte
oder erledigte Review-Karten anzuhängen. Nach einer Klärung bleibt nur ein noch nötiger aktueller Stand oder
`- Keine.`. Er enthält:

- bei `review` nur die aktuelle Übergabe an den Nutzer nach der Backlog-Norm,
- bei `waiting` Grund, Wiederaufnahmesignal, verifizierten Stand und nächsten Schritt,
- bei `deferred` nur die Entscheidung des Nutzers,
- bei `done` `- Keine.` oder nur wichtige Entscheidungen, Auffälligkeiten, Risiken, Warnungen und
  Abweichungen, die Abschlussart, falls verworfen oder Duplikat, sowie die Orte, an denen dauerhafte
  Projektwahrheiten oder falsch gewordene Dokumentation aktualisiert wurden. Nenne jeden dieser Punkte auch
  im abschließenden Chat.
