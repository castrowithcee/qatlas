---
description: >
  Verweist auf das externe maßgebliche Planungssystem und bindet aktuellen Taskzustand, selektive Historie
  und normale Lese- und Schreibwege ohne lokalen Spiegel.
type: meta
edit: shared
---

# Backlog

- [<projekttitel>](<kanonische-url>) - <anbieter und objekt> ist das einzige maßgebliche Planungssystem.

## Bindung

- **Anbieter und Objekt:** <anbieter, owner oder workspace, projekt oder datenbank>
- **Arbeitspakete:** <objekttyp und fachlicher container>
- **Entwürfe:** <wo unausgereifte ideen leben und wann sie zu arbeit werden>
- **Status:** <feldname>; `<wert>` = <bedeutung>, ...
- **Aktueller Datensatz:** <objekt oder felder mit dem eigenständig ausführbaren aktuellen taskvertrag>
- **Historie:** <kanal für kommentare oder verlauf; nicht maßgeblich und nur bei begründetem bedarf lesen>
- **Lesepolitik:** <auswahlmetadaten für status, reihenfolge, abhängigkeiten und eigentümerschaft; vollständiger
  aktueller datensatz nur für ausgewählte tasks; auslöser und begrenzung für historischen abruf>
- **Schreibweg:** <bevorzugtes tool oder api und nötige laufzeitvoraussetzung, keine secrets>
- **Betriebsgrenzen:** <knappe ständig nötige rate-, batch- oder capability-hinweise>
- **Lokaler Spiegel:** keiner

<!-- Vor dem Schreiben alle Platzhalter ersetzen. Nur Angaben aufnehmen, die ein Agent bei normaler
     Planung, Orchestrierung und Taskarbeit ständig braucht. Der aktuelle Datensatz muss ohne Historie
     ausführbar bleiben. Ausführliche Anbieter- und Migrationshinweise bleiben im zuständigen Skill. -->
