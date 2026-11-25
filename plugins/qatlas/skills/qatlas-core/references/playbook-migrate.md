---
description: >
  Ein Projekt oder die Library des Nutzers in das gültige Layout des Wissensraums übernehmen: Befunde
  mechanisch ermitteln, kompakt vorlegen und nach Freigabe umbenennen, verschieben, zusammenführen und
  Frontmatter korrigieren, ohne Inhalt zu löschen.
---

# Qatlas übernehmen

Übernimm `.qatlas-brain/` des Projekts in das gültige Layout, mit dem Argument `library` stattdessen
`~/qatlas/`. Das Verfahren berührt nur diesen Ordner und seine Einstiegsdatei, also `AGENTS.md` oder
`AGENTS.qatlas.md`. Es löscht keinen Inhalt: Eine Quelle entfällt erst, wenn ihr ganzer Inhalt am Ziel steht.
Ein leerer fester Ordner wie `zone-import/` bleibt bestehen.

## Ermitteln

Verwende das vom Router aufgelöste `<plugin-root>`. Das Skript ändert nichts.

```sh
node <plugin-root>/scripts/qatlas-migrate.js [--library]
```

- Meldet es `OK`, antworte mit einer Zeile und ende.
- Meldet es `NO SPACE`, gibt es nichts zu übernehmen. Nenne für ein Projekt `qatlas-core init` und ende.

Prüfe danach den Git-Zustand des Ordners. Liegen dort uncommittete Änderungen, nenne sie und beginne erst,
wenn der Nutzer sie committet hat oder die Übernahme trotzdem verlangt: Nur von einem sauberen Stand aus lässt
sie sich als ein Commit zurücknehmen. Ist der Ordner kein Git-Repo, sage vorab, dass es keinen Rückweg gibt.

## Vorlegen

Lege die Übernahme in einer Nachricht vor und überfordere den Nutzer nicht:

1. Die Übersicht des Skripts in der Gesprächssprache: je Art eine Zeile mit Anzahl und dem, was geschieht.
2. Einzeln nur, was seine Entscheidung braucht: jeden Befund der Art `sort` mit deinem Vorschlag für das
   Ziel und jedes Ziel, das schon existiert.
3. Ein Satz, dass du die vollständige Liste mit Quelle und Ziel jeder Änderung auf Wunsch zeigst, und die
   Frage nach der Freigabe.

Lies für einen Vorschlag den betroffenen Inhalt und ordne ihn nach den Aufgaben der reservierten Dateien im
[Projekt-Wissensraum](../../qatlas-core-filing/references/structure.md) zu. Verlangt der Nutzer die Liste,
führe das Skript mit `--list` aus und zeige sie, ergänzt um deine Vorschläge.

## Umsetzen

Setze erst nach der Freigabe um und nur, was freigegeben ist. Es gilt
[Umstrukturieren](../../qatlas-core-filing/references/playbook-restructure.md). Die Freigabe deckt bei
`edit: locked` das Umbenennen, Verschieben und Korrigieren des Frontmatters, nicht eine Änderung der Aussage.

- **`rename`:** Benenne auf das genannte Ziel um und ziehe Verweise und Indexzeilen nach. Existiert das Ziel,
  führe zusammen, statt zu überschreiben.
- **`frontmatter`:** Entferne einen `type`, den der Ort ersetzt, und ergänze fehlendes Frontmatter nach dem
  [Frontmatter-Schema](../../qatlas-core-filing/references/frontmatter.md). Ein bestehendes `edit` bleibt.
- **`sort`:** Verschiebe den Inhalt Aussage für Aussage an das freigegebene Ziel. Was zu keiner Aufgabe passt,
  bleibt, wo es ist, und steht im Abschluss. In der Library gehen die Lesebedingungen einer `README.md` in
  `AGENTS.qatlas.md` über.
- **`split`:** Gehe nach den
  [Umfangsgrenzen](../../qatlas-core-filing/references/size-limits.md) vor.
- **`entry`:** Ergänze die Zeile mit der Lesebedingung in der Einstiegsdatei.
- **`missing`:** Führe `node <plugin-root>/scripts/qatlas-init.js` aus. Es ergänzt nur, was fehlt, auch
  außerhalb des Ordners, und ersetzt nichts.

Widersprechen sich zwei Aussagen beim Zusammenführen, übernimm keine stillschweigend und frage den Nutzer.

## Abschluss

Führe das Skript erneut aus. Nenne, was übernommen wurde, was offen bleibt und warum. Committe nicht von dir
aus.
