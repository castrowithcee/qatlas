---
description: >
  Ablauf für Umbenennen, Verschieben, Zusammenführen, Promoten, Archivieren und Löschen vorhandener Dateien
  mit Inventar, Verweisen, Kennungen und Navigation.
license: MIT
type: playbook
edit: locked
---

# Umstrukturieren

1. **Inventar:** Ermittle Ziel, Bearbeitungsrecht, betroffene Verweise und mögliche Kennungskollisionen,
   bevor du etwas veränderst. `edit: locked` braucht eine ausdrückliche Freigabe.
2. **Umbenennen und Verschieben:** Präfix und ID bleiben stabil. Suche nach Verweisen auf den alten Pfad und
   ändere nur tatsächlich gebrochene.
3. **Zusammenführen:** Übernimm alle bindenden Aussagen in die Zieldatei am maßgeblichen Ort. Entferne
   danach die Quelle und richte ihre Verweise auf das Ziel.
4. **Promoten:** Wird ein Inhalt verbindlicher, etwa ein Memory zu einer Entscheidung oder Konvention, setzt
   das eine Entscheidung des Nutzers voraus. Der Inhalt erhält eine neue Datei mit eigenem Präfix und eigener
   ID; die alte Datei und ihr Indexeintrag entfallen.
5. **Archivieren und Löschen:** Lösche eine Nutzerdatei nur auf ausdrücklichen Auftrag. Bewahre Inhalt nur
   dann in einem Archiv auf, wenn die Projektkonvention es vorsieht oder seine Historie dauerhaft gebraucht
   wird.
6. **Navigation:** Passe Lesebedingungen in betroffenen READMEs und Indexzeilen in `MEMORY.md` an den neuen
   Stand an.
