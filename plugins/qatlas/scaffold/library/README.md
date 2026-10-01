---
description: >
  Einstieg und Suchweg für die nutzereigene Qatlas-Bibliothek mit Konventionen, Regeln, Playbooks und Wissen.
type: meta
edit: shared
---

# Qatlas-Bibliothek

Dies ist die nutzereigene Bibliothek für wiederverwendbare Konventionen, Regeln, Playbooks und Wissen. Sie
ist eine gezielte Auswahl, kein vollständiges Wiki. Projektbezogene Entscheidungen und Laufberichte bleiben
beim jeweiligen Projekt.

Ein Eintrag gilt für eine Aufgabe, wenn sein Thema passt und keine ausdrückliche Nutzeranweisung oder
Projektentscheidung widerspricht. Sein Ablageort allein macht ihn nicht für jedes Projekt verbindlich. Soll
ein Projekt dauerhaft einer Konvention folgen, verweist seine Agentendatei ausdrücklich auf den Eintrag.

## Ordner

- `conventions/` enthält übertragbare Konventionen dazu, wie Arbeit gestaltet wird.
- `playbooks/` enthält Abläufe für wiederkehrende Tätigkeiten.
- `rules/` enthält konkrete Verhaltens- und Schutzregeln, die unabhängig von einem einzelnen Ablauf gelten.
- `knowledge/` enthält Hintergrundwissen und Referenzen für passende Aufgaben.

Soll eine Information global festgehalten werden, prüfe zuerst, ob eine vorhandene Datei oder ein Ordner
inhaltlich passt, und ergänze den maßgeblichen Eintrag statt einer Dublette. Ist die Zuordnung unklar,
schlage einen konkreten Ort vor und frage. Ein klar eigenständiges Thema erhält mit seinem ersten Eintrag
einen Unterordner im passenden Bereich.

## Suchen

1. Prüfe zuerst die Angaben und Entscheidungen des aktuellen Projekts. Öffne diese Bibliothek, wenn eine
   wiederkehrende Nutzerkonvention, eine Regel, ein Playbook oder allgemeines Wissen zur Aufgabe passt.
2. Grenze den Bereich über Ordner- und Dateinamen ein; ein vollständiger Verzeichnisbaum ist kein
   Standardschritt.
3. Suche in den Kandidaten zuerst nach `description`, dann nach `tags`, `type` und `status` im Frontmatter.
   Lies erst danach die Bodies der passenden Dateien.
4. Nenne bei der Verwendung den maßgeblichen Eintrag.

## Pflege

Die Bibliothek gehört dem Nutzer; Qatlas-Updates ersetzen vorhandene Dateien nicht. Inhaltliche Änderungen
erfolgen auf Nutzerauftrag.
