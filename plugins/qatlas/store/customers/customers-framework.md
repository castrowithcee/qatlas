---
description: >
  Wie im Kundenbereich gearbeitet wird: Identifikation, Suche, Ablage pro Kunde und die
  Datenschutzleitplanken. Ein Overlay für den Bereich, gilt und wird gelesen, wenn dort gearbeitet wird.
type: meta
edit: locked
---

# Framework: Kunden

<!-- Nach <area>-customers/FRAMEWORK.md kopieren und anpassen. -->

## Identifikation
- Ein Kunde wird über **<ID-Schema> + Kurzname** identifiziert (zum Beispiel eine Fall- oder Kundennummer plus einen
  beschreibenden Kurznamen). Das Schema wird hier einmal festgelegt.
- Ein Unterordner `<id>/` pro Kunde mit einer `INDEX.md` als Kopf; weitere Dateien darunter folgen den
  allgemeinen Ablageregeln.

## Suche
- Zuerst nach der `<id>` suchen (eindeutig), dann nach dem Kurznamen. Bei Unklarheit nachfragen statt raten.

## Ablage pro Kunde
- `<id>/INDEX.md`: der Stammdatensatz des Kunden (Kurzname, Status, worum es geht). **Keine** Kontaktdaten.
- Fälle, Fakten und Entscheidungen als typisierte Dateien unter `<id>/` nach den allgemeinen Ablageregeln.

## Datenschutzleitplanken
- **Keine Kontaktdaten** (Adresse, Telefon, E-Mail, Zahlungsdaten) im Repo, auch nicht, wenn sie
  versehentlich gepostet werden. Der Agent weist darauf hin und nimmt sie nicht auf.
- Stammdaten und Kommunikation liegen im Quellsystem (CRM/Postfach); hier nur, was für die
  Planung nötig ist.
