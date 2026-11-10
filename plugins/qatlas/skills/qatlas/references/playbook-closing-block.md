---
description: >
  Gemeinsamer Abschluss von team und shape im Chat: Ergebnis, nummerierte, im Chat beantwortbare
  Nutzerpunkte, neue Tasks, offene Risiken, Prozessverbesserungen, Kennzahlen und ungepushte Commits.
---

# Abschlussblock

Beende den Modus mit genau diesem Block. Jeder Punkt steht nur hier, einmal, mit dem Thema zuerst und der
Task-ID danach. Nummeriere die Punkte von `Entscheiden`, `Prüfen` und `Angenommen` fortlaufend, damit der
Nutzer mit der Nummer antworten kann. Lass leere Kategorien weg.

```markdown
<Projekt> · <Modus> · <Stand, z. B. fertig, 2 Entscheidungen offen>

<Ergebnis: zwei bis vier Sätze dazu, was für den Nutzer jetzt anders ist.>

**Entscheiden**
1. <Thema> (#<ID>): <Kontext in einem Satz>. <Frage>? Empfehlung: <Option>, weil <Grund>.

**Prüfen**
2. <Thema> (#<ID>): <was, wo, woran sich Erfolg zeigt; wann, falls nicht jetzt>.

**Angenommen**
3. <Thema> (#<ID>): <Annahme>, weil <Grund>; sie zurückzunehmen hätte <Folge>.

**Handeln**
- <Thema> (#<ID>): <Aktion mit genauem Ort oder Befehl>.

**Neu**
- <Thema> (#<ID>): <was> - <warum es nötig ist>.

**Risiken**
- <Risiko>: <Folge> - <nötige Aktion oder Entscheidung>.

**Verbesserungen**
- <Schwäche des Verfahrens mit ihrem Nachweis>: <konkreter Ansatz>.

**Kennzahlen:** <eine Zeile>
**Nicht gepusht:** <Repo>: <Commit-ID> <Betreff>

Weiter in einer neuen Session: <Modi>
```

- **Ergebnis:** was jetzt funktioniert oder sich geändert hat, in den Begriffen des Nutzers; keine Liste von
  Paketen oder Tasks.
- **Angenommen:** nur Annahmen, deren Umkehr etwas ändern würde.
- **Risiken:** nur Risiken, die nach dem Lauf noch offen sind, darunter ein unbehobenes Sicherheitsrisiko,
  das nicht öffentlich festgehalten werden darf. Was wie erwartet behandelt wurde, bleibt draußen;
  Code-Stellen gehören in den Task.
- **Verbesserungen:** Muster dieses Laufs bei Zuschnitt, Taskverträgen, Prüfungen oder Umgebung, abgeleitet
  aus Korrekturen, Nacharbeiten, Konflikten, Wiederholungen, Anstößen, Stillständen, Rückfragen und
  Abweichungen; nur mit konkretem Ansatz, keine Produktideen.
- **Kennzahlen:** Dauer und die von null verschiedenen Zahlen an Rückfragen, Nacharbeiten, Konflikten,
  Wiederholungen und Anstößen.
- **Letzte Zeile:** nur Modi mit echter Arbeit: `review` für Tasks in `review`, `shape <eindeutiger Task>`
  für einen Entwurf oder `shape backlog` für mehrere, `team <Scope>` für den ersten ausführbaren Scope nach
  `shape`. Eine neue Idee geht an `goal`. Starte keinen Modus selbst. Ist nichts offen, sagt das die
  Ankerzeile und die Zeile entfällt.

## Antworten in diesem Chat

Der Nutzer antwortet meist sofort. Halte jeden beantworteten Punkt vor Sessionende nach den
Aufzeichnungsregeln von [Entscheidungen vorlegen](playbook-decision-card.md) fest; kläre nur einen
mehrdeutigen Punkt. Bringe daraus folgende Dateiänderungen in einen weiteren lokalen Commit pro betroffenem
Repo, pushe nichts und bestätige in einer Zeile, was festgehalten wurde.
