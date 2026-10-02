---
name: qatlas-help
description: >
  Begleitet auf ausdrücklichen Aufruf durch Qatlas wie ein Handbuch im Gespräch: Vorstellung, Arbeitsablauf,
  Skills, Konfiguration und Befehlskarte. Ohne Argument ein Themenmenü; danach freie Nachfragen. Ändert
  nichts.
disable-model-invocation: true
argument-hint: "[intro|flow|skills|config|card]"
license: MIT
type: skill
edit: locked
---

# Qatlas-Hilfe

Begleite den Nutzer durch Qatlas wie ein Handbuch im Gespräch. Erkläre einfach und ohne vorausgesetztes
Wissen, beginne mit dem Wesentlichen und vertiefe nur auf Nachfrage. Ändere keinen Zustand und führe keinen
Befehl aus; nenne stattdessen den passenden Aufruf.

## Ohne Argument

Antworte ausschließlich mit diesem Menü als gerendertes Markdown:

### Qatlas-Hilfe

Was möchtest du wissen? Wähle ein Thema oder stelle einfach deine Frage.

| Thema | Inhalt |
|---|---|
| `intro` | Was Qatlas ist, welche Probleme es löst und wo es Dinge ablegt |
| `flow` | Wie die Arbeit mit Qatlas von der Einrichtung bis zur Abnahme abläuft |
| `skills` | Welche Skills es gibt und wann sie greifen |
| `config` | Was sich einstellen lässt und was die Einstellungen bewirken |
| `card` | Alle Befehle auf einen Blick |

Aufruf: `qatlas-help <thema>`

## Thema wählen

Lies vor der Antwort vollständig die Referenz des gewählten Themas und gib ihren Inhalt in eigenen, knappen
Worten wieder; `card` gibst du unverändert aus:

- `intro`: [Vorstellung](references/intro.md)
- `flow`: [Arbeitsablauf](references/flow.md)
- `skills`: [Skills](references/skills.md)
- `config`: [Konfiguration](references/config.md)
- `card`: [Befehlskarte](references/card.md)

Eine Nummer, ein Stichwort oder eine freie Frage ordnest du dem passenden Thema zu.

## Begleiten

- Biete nach jedem Thema zwei oder drei naheliegende Anschlussthemen oder -fragen an.
- Beantworte freie Nachfragen aus den Referenzen. Reichen sie nicht, lies den betroffenen Skill dieses
  Plugins und antworte knapp daraus. Kennzeichne, was Qatlas nicht festlegt, statt es zu erfinden.
- Bleib bei Qatlas. Eine allgemeine Recherche beginnst du nur, wenn der Nutzer sie ausdrücklich will.
