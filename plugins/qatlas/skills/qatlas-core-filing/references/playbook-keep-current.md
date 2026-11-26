---
description: >
  Projektwissen aktuell halten, in jeder Session und ohne Modus: dauerhafte Aussagen des Nutzers verdichtet
  zur Bestätigung vorlegen und nach einer geänderten Grundlage wie PROJECT.md prüfen, was von ihr abhängt.
---

# Projektwissen aktuell halten

## Dauerhaftes aus dem Gespräch

Merke dir jede Aussage des Nutzers, die das Projekt über die aktuelle Aufgabe hinaus formt: eine Regel, ein
gewünschtes Verhalten, eine Grenze oder eine Entscheidung zu Produkt oder Architektur, jeweils mit ihrem
Grund. Maßgeblich ist, ob sie noch gilt, wenn die Aufgabe erledigt ist. Was nur ein einzelnes Vorhaben
betrifft, etwa ein Umzug oder eine Restrukturierung, gehört nicht ins Projektwissen.

Dazu zählt, was eine Korrektur, eine Entscheidung oder eine Nacharbeit über die Planung zeigt: Hätte ein Task
mit einem Wissen anders zugeschnitten werden müssen und gilt es für künftige Tasks ebenso, formuliere es als
Anweisung für `PLANNING.md`.

Lege das Gesammelte einmal gebündelt zur Bestätigung vor: in einem Arbeitsmodus an der Stelle, die er nennt,
sonst am Ende der Aufgabe, in deren Gespräch es anfiel.

- **Verdichtet:** Gib je Punkt in ein bis zwei Sätzen wieder, was du verstanden hast, mit dem Grund, und
  nicht, was der Nutzer gesagt hat. Das gilt gerade dann, wenn er lang ausgeführt hat. Fasse mehrere
  Ausführungen zum selben Gegenstand zu einem Punkt zusammen.
- **Wie es stehen wird:** Formuliere jeden Punkt so, wie du ihn eintragen wirst, in der Art seiner Zieldatei,
  etwa als Regel, Grenze, Prüfvorgabe oder Entscheidung. Wähle die Zieldatei nach ihrer Aufgabe im
  [Projekt-Wissensraum](structure.md) und nenne sie mit dem Abschnitt. Teile eine Aussage, die mehrere
  Dateien betrifft, in je einen Punkt.
- **Nur Neues:** Lass weg, was das Projektwissen schon so festhält. Widerspricht eine Aussage dem
  Festgehaltenen, nenne im Punkt, was sie ersetzt.
- **Eintragen:** Trage einen bestätigten Punkt an seinem Platz ein und ersetze Überholtes, statt anzuhängen.
  Die Bestätigung gibt eine gesperrte Datei für genau diesen Punkt frei. Ohne Bestätigung änderst du nichts
  und fragst in derselben Session nicht erneut.

## Geänderte Grundlage

Gehe so vor, sobald sich `PROJECT.md` geändert hat, ohne dass du sie in dieser Session selbst geändert hast:
weil ein Hinweis im Kontext es meldet, der Nutzer es sagt oder du es beim Lesen bemerkst. Dasselbe gilt für
jede andere reservierte Datei, an der du eine solche Änderung bemerkst.

1. **Änderung fassen:** Lies die Datei neu und ermittle, was sich geändert hat, mit Git gegen den Stand davor.
   Lässt es sich nicht ermitteln, frage den Nutzer, was er geändert hat.
2. **Herkunft nennen:** Nenne dem Nutzer in einem Satz, dass du die Änderung bemerkt hast und woher sie laut
   Hinweis kommt. Kam sie mit einem Pull oder Merge, kann das Abhängige dort schon nachgezogen sein. Prüfe
   trotzdem.
3. **Abhängiges prüfen:** Prüfe nur gegen die geänderten Aussagen, nicht das ganze Projektwissen: die übrigen
   reservierten Dateien mit ihren Ordnern, die Einstiegsdatei, Memories und die offenen Tasks des
   maßgeblichen Planungssystems, zuerst über deren Übersicht.
4. **Vorlegen:** Lege einmal gebündelt vor, was veraltet ist oder widerspricht: je Punkt die Stelle, der
   Widerspruch und dein Vorschlag, verdichtet wie oben. Frage nur nach, wo die Absicht der Änderung offen
   bleibt und dein Vorschlag davon abhängt. Findest du nichts, sage das in einer Zeile.
5. **Nachziehen:** Ändere erst nach der Bestätigung und nur das Bestätigte. Einen Task änderst du nach den
   Regeln des Planungssystems, ohne Ziel oder Abnahme stillschweigend zu ändern.

Ändere `PROJECT.md` selbst dabei nicht. Hältst du die Änderung für ein Versehen, frage.
