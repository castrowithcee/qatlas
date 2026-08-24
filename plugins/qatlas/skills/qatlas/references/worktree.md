---
description: >
  Bedingt geladener Vertrag für die nummerierte Übersicht, kontextgeleitete Anlage und sichere Bereinigung
  zentraler Git-Worktrees durch Qatlas Worktree und Qatlas Run.
type: playbook
edit: locked
license: MIT
---

# Git-Worktrees verwalten

Lies diese Referenz nur, wenn der Nutzer `qatlas worktree` aufruft oder der Git-Ablauf eines
`qatlas run` einen Worktree verlangt. Git registriert alle Worktrees eines Repos gemeinsam; dieses
Register ist die maßgebliche Quelle. Der Ordner unter `~/.qatlas/` ist nur der gemeinsame Ablageort für
alle Agenten desselben Nutzers.

Liegt die Session nicht in einem Git-Repo, melde das als einzigen Befund und ändere nichts.

## Übersicht

Ohne `new` oder einen erkennbaren Aufräumauftrag ändert der Aufruf nichts:

1. Ermittle mit `git worktree list --porcelain` den primären, den aktuellen und alle weiteren Worktrees.
2. Prüfe für jeden erreichbaren Worktree Branch, Status und Upstream. Erfinde für nicht erreichbare Pfade
   keinen Zustand.
3. Zeige eine nummerierte Liste. Jede Zeile nennt Zweck, Branch, Zustand und absoluten Pfad; markiere den
   aktuellen und den primären Arbeitsbaum.

Die Nummer ist nur ein Griff für die gerade gezeigte Liste und keine dauerhafte ID. Vor einer späteren
Änderung lies das Register erneut und prüfe, dass die genannte Nummer noch denselben Pfad und Branch
bezeichnet. Hat sich die Zuordnung verändert, zeige die neue Liste und ändere nichts.

## Anlegen

`qatlas worktree new [Auftrag]` legt einen Worktree für die Arbeit im aktuellen Kontext an. Der optionale
Text beschreibt die Arbeit in natürlicher Sprache; er ist niemals ein technischer Name. Ohne Text gelten
der aktuelle Task, das Projekt und der Gesprächskontext. Frage nur nach dem Arbeitszweck, wenn daraus kein
eindeutiger Auftrag hervorgeht. Der Agent bestimmt Branch, Zweck-Slug und Pfad vollständig selbst.

Ein `qatlas run` braucht kein zusätzliches `new`: Sein ausdrücklicher Aufruf autorisiert die im Git-Ablauf
geforderte Isolation bereits.

1. Ermittle Git-Root, primären Arbeitsbaum, gemeinsames Git-Verzeichnis, Branches, Worktrees und vollständigen
   Status. Committe und stashe nichts. Lokale Änderungen bleiben in ihrem Arbeitsbaum und gelangen nicht in
   den neuen.
2. Leite einen kurzen ASCII-Zweck-Slug aus dem Task oder Auftrag ab. Ein lokaler Task verwendet
   `qatlas/task-<id>-<slug>`; andernfalls entsteht ein eindeutiger `qatlas/<zweck>`-Branch. Verwende einen
   vorhandenen Branch oder Worktree nur weiter, wenn er nachweislich derselben offenen Arbeit gehört.
3. Bilde den Repo-Schlüssel aus den ersten acht kleingeschriebenen Hex-Zeichen eines SHA-256-Hashs über den
   kanonischen absoluten Pfad des gemeinsamen Git-Verzeichnisses. Der Repo-Slug entsteht aus dem Namen des
   primären Arbeitsbaums als kurzer ASCII-Slug. Verwende
   `~/.qatlas/state/worktrees/<repo-schluessel>-<repo-slug>/<zweck>/`.
4. Prüfe Namens-, Branch- und Pfadkollisionen gegen das Git-Register und das Dateisystem. Überschreibe nichts.
   Gehört eine Kollision nicht eindeutig derselben Arbeit, bilde selbst einen unterscheidbaren Zweck oder
   stoppe bei weiterhin unklarer Zuordnung. Der Nutzer vergibt keinen technischen Namen.
5. Löse Branch und Startpunkt vor dem Anlegen auf. Ein vorhandener lokaler Branch startet an seiner eigenen
   Spitze und wird nie zurückgesetzt. Bei einem eindeutig gleichnamigen Remote-Branch darf ein lokaler
   Tracking-Branch entstehen; bei mehreren passenden Remotes frage nach dem gemeinten. Für einen neuen
   Branch gilt der aus Auftrag oder Spine folgende Startpunkt, sonst das aktuelle `HEAD`.
6. Lege den Worktree ausschließlich mit `git worktree add` an; verwende weder `-B` noch `--force`. Prüfe den
   Eintrag danach erneut über `git worktree list --porcelain`.

Melde nach erfolgreicher Anlage Zweck, Branch, Startpunkt und absoluten Pfad. Weise knapp darauf hin, dass
eine neue Agenten-Session in diesem Pfad starten muss. Kopiere keine `.env`, Secrets, Abhängigkeiten oder
anderen ignorierten lokalen Zustand. Eine `.gitignore` des Projekts wird für den zentralen Ablageort nicht
verändert.

## Aufräumen

Der Nutzer darf einen Worktree natürlich über die zuvor gezeigte Nummer oder seinen beschriebenen Zweck
auswählen, etwa „Räum Nummer 4 auf“. Ein bloßes „Räum auf“ bedeutet: Prüfe den gesamten Bestand und entferne
nur eindeutig gefahrlos aufräumbare Einträge; lege alle übrigen mit ihrem Hindernis nummeriert vor.

1. Lies das Register erneut und löse die Auswahl eindeutig auf. Entferne niemals den primären oder den
   aktuellen Arbeitsbaum.
2. Prüfe im Ziel Status, ungetrackte Dateien, Branch, Upstream und nicht integrierte Commits. Ist der
   Arbeitsbaum nicht sauber oder das Integrationsziel nicht eindeutig belegt, entferne nichts und zeige den
   konkreten Zustand. Eine für einen laufenden oder unbekannten Worker beanspruchte Arbeit bleibt bestehen.
3. Entferne einen sauberen, vollständig integrierten Arbeitsbaum mit `git worktree remove <pfad>` und ohne
   `--force`. Der Branch bleibt zunächst erhalten.
4. Lösche den lokalen Branch nur mit `git branch -d`, wenn sein Ziel aus Spine, Auftrag oder ausdrücklichem
   Nutzerkontext eindeutig ist und Git die vollständige Integration bestätigt. Remote-Branches werden nur
   auf ausdrücklichen Wunsch gelöscht.
5. Zeige anschließend den verbleibenden Bestand erneut nummeriert.

Will der Nutzer einen schmutzigen oder nicht integrierten Strang verwerfen, behandle das als eigene
destruktive Aktion: Zeige den exakten Zustand und hole eine ausdrückliche Bestätigung für genau diesen
Worktree ein. Lösche einen Worktree-Ordner nie von Hand.
