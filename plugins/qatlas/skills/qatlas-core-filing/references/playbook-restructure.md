---
description: >
  Ablauf zum Umbenennen, Verschieben, Zusammenführen, Aufwerten, Archivieren und Löschen bestehender Dateien
  mit Bestandsaufnahme, Verweisen, Namen und Navigation.
---

# Umstrukturieren

1. **Bestandsaufnahme:** Bestimme Ziel, Bearbeitungsrechte, betroffene Verweise und mögliche Namenskollisionen,
   bevor du etwas änderst. `edit: locked` braucht ausdrückliche Freigabe.
2. **Umbenennen und verschieben:** Typpräfix und Task-ID bleiben stabil. Suche nach Verweisen auf den alten
   Pfad und ändere nur die tatsächlich gebrochenen.
3. **Zusammenführen:** Übernimm alle verbindlichen Aussagen in die Zieldatei am maßgeblichen Ort. Entferne
   dann die Quelle und lenke ihre Verweise auf das Ziel um.
4. **Aufwerten:** Wird Inhalt verbindlicher, etwa wenn aus einer Memory eine Policy wird, braucht das eine
   Entscheidung des Nutzers. Der Inhalt zieht in eine Datei des neuen Typs in deren Ordner; die alte Datei
   und ihre Indexzeile werden entfernt.
5. **Archivieren und löschen:** Lösche eine Nutzerdatei nur auf ausdrückliche Bitte. Der Wissensraum führt
   keinen Archivordner; Git bewahrt das Entfernte. Außerhalb davon bewahre Inhalt nur dann in einem Archiv
   auf, wenn die lokale Konvention es vorsieht.
6. **Navigation:** Bringe Lesebedingungen in betroffenen READMEs und Indexzeilen in `MEMORY.md` auf den
   neuen Stand.
