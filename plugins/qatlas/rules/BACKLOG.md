---
description: >
  Immer geladene Weiche vom Backlog-Binding zum maßgeblichen externen System oder zum vollständigen Vertrag
  des lokalen Qatlas-Backlogs.
license: MIT
type: rule
edit: locked
---

# Backlog-Binding und lokaler Backlog

Diese Regel gilt, sobald `.qatlas-project/` existiert. `.qatlas-project/backlog/BACKLOG.md` wird bei jedem
Sessionstart geladen und nennt immer das einzige maßgebliche Planungssystem. Nutzer- oder Projektvorgaben
haben Vorrang.

## Maßgebliches Planungssystem

- Bei lokaler Autorität ist `BACKLOG.md` der Roster des Qatlas-Backlogs.
- Bei externer Autorität enthält `BACKLOG.md` den prominenten Link und die knappe dauerhafte Bindung, die
  Planungs-, Orchestrierungs- und Taskarbeit zum richtigen Objekt, Statusmodell und Schreibweg führt. Der
  lokale Backlog wird dann nicht als Spiegel gepflegt.
- Widersprechen sich native Projektanweisungen und `BACKLOG.md`, ändere nichts und kläre, welche Aussage
  aktualisiert werden muss.
- Ein Wechsel oder eine Migration des maßgeblichen Systems erfolgt nur auf ausdrücklichen Aufruf von
  `qatlas-core backlog-system`. Normale Taskarbeit migriert oder spiegelt nicht nebenbei.

Bei einem externen System folgt Planung, Orchestrierung und Taskarbeit dessen Binding. Ist der lokale
Qatlas-Backlog maßgeblich und wird mehr als der geladene Roster betrachtet, lies vollständig
`<plugin-root>/rules/references/backlog.md`, bevor du Aufgaben auswählst, erstellst, disponierst, beanspruchst,
übergibst oder abschließt. Reines Anzeigen des geladenen Rosters braucht den Vertrag nicht.

Ist dieser Block unvollständig oder nur als Vorschau vorhanden, lies vor der Arbeit die im Block genannte
Quelldatei vollständig.
