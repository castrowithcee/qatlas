---
description: >
  Ablauf für eine neue Datei: Gegenstand, Ort, Typ, Vorlage, Name, Frontmatter und Navigation.
---

# Datei

1. **Gegenstand:** Bestimme, worüber die Datei eine Aussage macht. Projektzustand und Pflege gehören unter
   den [Projekt-Wissensraum](structure.md) in `.qatlas-brain/`, Fachinhalt an seinen maßgeblichen Ort.
2. **Ort:** Im Wissensraum wählt die Aufgabe die reservierte Datei, sonst wählt der Inhalt den festen Ordner.
   Prüfe vor dem Anlegen, ob eine bestehende Datei derselben Aufgabe stattdessen wachsen sollte. Eine
   reservierte Datei sammelt jede Aussage ihrer Aufgabe bis zur [Umfangsgrenze](size-limits.md). Nur ein
   Teil mit eigener Lesebedingung entsteht gleich als Datei in ihrem Ordner. Ein Ergebnis für mehrere Tasks
   schneide schon beim Anlegen nach Gegenstand, damit jeder Task nur seinen Abschnitt braucht.
3. **Typ:** Verlangt der Ort einen `type`, bestimme ihn mit den Fragen des
   [Frontmatter-Schemas](frontmatter.md). Eine offene Frage des Nutzers ist noch keine Entscheidung. Sie
   bleibt in ihrem Task.
4. **Vorlage:** Prüfe vor einer wiederkehrenden Nutzerstruktur `.qatlas-brain/templates/`. Verlangt die
   Aufgabe eine Vorlage von Qatlas, nimm die, die der zuständige Skill in seinen `assets/` mitliefert.
5. **Name:** Nenne sie `<präfix>-<slug>.md` mit dem Präfix ihres Ordners.
6. **Frontmatter:** Setze es für Markdown nach dem Frontmatter-Schema.
7. **Navigation:** Muss der neue Inhalt für bestimmte Arbeit gelesen werden, ergänze eine eindeutige
   Lesebedingung: bei einer reservierten Datei unter `Projektwissen` in `AGENTS.md`, bei einer Datei in
   ihrem Ordner in der reservierten Datei, bei einer Datei in `knowledge/` oder `playbooks/` des
   Wissensraums in der reservierten Datei, deren Aufgabe sie betrifft, und bei Inhalt außerhalb des
   Wissensraums in der README des Geltungsbereichs.
