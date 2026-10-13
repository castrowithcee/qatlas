---
description: >
  Ausführbare Tasks eines Laufs auswählen, auf Ausführungsreife und Eigentum prüfen und die Auswahl nach
  jedem Task neu bewerten.
type: playbook
edit: locked
license: MIT
---

# Tasks auswählen

Ein Lauf bearbeitet höchstens so viele Tasks, wie die Taskgrenze seines Modus zulässt. Die Grenze
begrenzt den Laufhorizont; sie ist keine Commitzahl, keine Subagentzahl und keine Aussage über parallele
Tasks. Die Zahl der `next`-Tasks verändert sie nicht. Eine größere `next`-Menge bleibt in ihrer bestehenden
Reihenfolge für spätere Läufe erhalten.

1. Lies zuerst nur Roster beziehungsweise externe Metadaten des gewählten Scopes. Ermittle Status,
   Kurzstand, Reihenfolge, Abhängigkeiten und Besitzsignale. Bei einem ausdrücklich gewählten einzelnen
   Task lies dessen aktuellen Datensatz direkt.
2. Nimm zuerst ausführbare `next`-Tasks in der Reihenfolge des Spine. Sind weniger vorhanden, als die
   Taskgrenze zulässt, ergänze den Lauf selbstständig mit fachlich passenden `ready`-Tasks desselben
   Scopes. Wähle nach erfüllbaren Abhängigkeiten, fachlichem Nutzen, früher Risikoklärung und sinnvoller
   Integration.
3. Ein ausgewählter `ready`-Task wechselt vor seiner Beanspruchung über `next`. `ready` und `next` sind
   exklusive Status; `next` setzt vollständige Ausführungsreife voraus.
4. Lies nur die ausgewählten Tasks und ihre echten Blocker vollständig. Öffne Kommentare oder Historie nur
   bei einem Widerspruch, fehlender entscheidungsrelevanter Begründung oder ausdrücklichem Verweis des
   aktuellen Datensatzes.
5. Prüfe jeden Task unmittelbar vor der Beanspruchung erneut auf die Ausführungsreife der Backlog-Norm.
   Ist sie verfehlt, setze ihn nach deren Regeln auf `draft` oder `waiting`, informiere den Nutzer konkret
   und führe ihn nicht aus. Eine technische Schwierigkeit oder eine zusätzliche Datei innerhalb des
   fachlichen Scopes ist keine offene Vertragsfrage.
6. Verändere keinen `in-progress`-Task mit einem laufenden oder unbekannten Subagent oder Orchestrator.
   Kläre zuerst dessen Eigentümer und Arbeitsstand. Arbeitet ein weiterer Orchestrator im selben Repo oder
   Planungssystem, beanspruche nur nach „Parallele Arbeit im Run“.
7. Prüfe bei Git Root, Branch, Upstream, Worktrees und vollständigen Status. Schreibende Arbeit beginnt nur
   auf einem sauberen, seit dem Preflight unveränderten Steuerbranch. Wende vor dem ersten schreibenden
   Git-Schritt den Git-Ablauf an.

Plane die Auswahl nicht als unveränderlichen Batch. Nach jedem abgeschlossenen oder gesichert übergebenen
Task bewertet der Orchestrator Auswahl, Reihenfolge, Abhängigkeiten und verbleibende Laufkapazität neu.
