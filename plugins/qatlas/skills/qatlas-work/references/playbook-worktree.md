---
description: >
  Ablauf für qatlas-work tree: nummerierte Übersicht der Git-Worktrees, kontextgeleitete Anlage und vom
  Nutzer ausgewähltes, sicheres Aufräumen.
type: playbook
edit: locked
license: MIT
---

# Git-Worktrees verwalten

Lies vor jeder Anlage oder Bereinigung vollständig den [Worktree-Vertrag](worktree-contract.md). Liegt die
Session nicht in einem Git-Repo, melde das als einzigen Befund und ändere nichts.

## Übersicht

Ohne `new` oder einen erkennbaren Aufräumauftrag ändert der Aufruf nichts:

1. Ermittle mit `git worktree list --porcelain` den primären, den aktuellen und alle weiteren Worktrees.
2. Prüfe für jeden erreichbaren Worktree Branch, Status und Upstream. Erfinde für nicht erreichbare Pfade
   keinen Zustand.
3. Zeige eine nummerierte Liste. Jede Zeile nennt Zweck, Branch, Zustand und absoluten Pfad; markiere den
   aktuellen und den primären Arbeitsbaum.

Die Nummer ist nur ein Griff für die gerade gezeigte Liste. Lies das Register vor einer späteren Änderung
erneut und prüfe, dass die Nummer noch denselben Pfad und Branch bezeichnet; sonst zeige die neue Liste und
ändere nichts.

## Anlegen

`qatlas-work tree new [Auftrag]` legt einen Worktree für die Arbeit im aktuellen Kontext an. Der optionale
Text beschreibt die Arbeit in natürlicher Sprache und ist nie ein technischer Name. Ohne Text gelten der
aktuelle Task, das Projekt und der Gesprächskontext. Frage nur nach dem Arbeitszweck, wenn daraus kein
eindeutiger Auftrag hervorgeht. Branch, Zweck-Slug und Pfad bestimmst du nach dem Vertrag selbst.

Melde nach der Anlage Zweck, Branch, Startpunkt und absoluten Pfad und weise darauf hin, dass eine neue
Agenten-Session in diesem Pfad starten muss.

## Aufräumen

Der Nutzer wählt einen Worktree über die gezeigte Nummer oder seinen beschriebenen Zweck aus, etwa „Räum
Nummer 4 auf“. Ein bloßes „Räum auf“ bedeutet: Prüfe den gesamten Bestand nach dem Vertrag, entferne nur
eindeutig gefahrlos aufräumbare Einträge und lege alle übrigen mit ihrem Hindernis nummeriert vor. Zeige
danach den verbleibenden Bestand erneut nummeriert.
