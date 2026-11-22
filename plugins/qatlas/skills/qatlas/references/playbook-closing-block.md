---
description: >
  Gemeinsamer Abschluss von run und shape im Chat: Ergebnis, nummerierte, im Chat beantwortbare
  Nutzerpunkte, neue Tasks, offene Risiken, überlange Dateien und Tasks, Prozessverbesserungen, Kennzahlen
  und ungepushte Commits.
---

# Abschlussblock

Beende den Modus mit genau diesem Block. Jeder Punkt steht nur hier, einmal, mit dem Thema zuerst und der
Task-ID danach. Nummeriere die Punkte von `Entscheiden`, `Prüfen` und `Angenommen` fortlaufend, damit der
Nutzer mit der Nummer antworten kann. Lass leere Kategorien weg.

```markdown
<Projekt> · <Modus> · <Stand, z. B. fertig, 2 Entscheidungen offen>

<Ergebnis: zwei bis vier Sätze dazu, was für den Nutzer jetzt anders ist.>

**Entscheiden**
1. <Thema> (#<ID>)
   <Funktion, Feature oder Fehler>: <was es im Produkt bewirkt und warum es gerade hängt>.
   <Frage>? Empfehlung: <Option>, weil <Grund>.

**Prüfen**
2. <Thema> (#<ID>): <was, wo, woran sich Erfolg zeigt und wann, falls nicht jetzt>.

**Angenommen**
3. <Thema> (#<ID>): <Annahme>, weil <Grund>. Sie zurückzunehmen hätte <Folge>.

**Handeln**
- <Thema> (#<ID>): <Aktion mit genauem Ort oder Befehl>.

**Neu**
- <Thema> (#<ID>): <was>. <Warum es nötig ist>.

**Risiken**
- <Risiko>: <Folge>. <Nötige Aktion oder Entscheidung>.

**Umfang**
- <Datei oder Task (#<ID>)>: <n> Wörter, weil <Grund>.

**Verbesserungen**
- <Schwäche mit ihrem Nachweis aus diesem Lauf> (#<Entwurf-ID>): <Datei>: „<Textvorschlag>“.
- <Werkzeug> <Version>: Beobachtung: <…>. Erwartung: <…>. Nachweis: <…>. Melden: <Adresse, die das Werkzeug nennt>.

**Kennzahlen:** Dauer <Zeit> · <n> Rückfragen · <n> Nacharbeiten · <n> Konflikte · <n> Wiederholungen · <n> Anstöße · summiert über parallele Arbeit: Prüfungen <Zeit> in <n> Durchläufen, <n> rot · Warten auf Test-Slots <Zeit> · Warten auf Integration <Zeit>
**Nicht gepusht:** <Repo>: <Commit-ID> <Betreff>

Weiter in einer neuen Session: <Modi>
```

- **Ergebnis:** was jetzt funktioniert oder sich geändert hat, in den Begriffen des Nutzers, keine Liste von
  Paketen oder Tasks.
- **Entscheiden:** so, dass der Nutzer ohne den Task antworten kann und seine Antwort den Task möglichst
  ausführungsreif macht. Formuliere protokollierte Einträge dafür neu. Herleitung und technische Details
  bleiben im Task.
- **Angenommen:** nur Annahmen, deren Umkehr etwas ändern würde.
- **Risiken:** nur Risiken, die nach dem Lauf noch offen sind, darunter ein unbehobenes Sicherheitsrisiko,
  das nicht öffentlich festgehalten werden darf. Was wie erwartet behandelt wurde, bleibt draußen.
  Code-Stellen gehören in den Task.
- **Umfang:** jede in diesem Lauf angelegte oder gewachsene Datei über der Umfangsgrenze des Wissensraums und
  jeder angelegte oder geänderte Task über dem Prüfwert der Backlog-Norm, mit Umfang und Grund.
- **Verbesserungen:** Ein Eintrag braucht einen Nachweis aus diesem Lauf: eine Rückfrage, eine Nacharbeit,
  eine Übergabe an den Nutzer, ein belegtes Fehlverhalten eines Werkzeugs oder eine protokollierte Annahme
  oder Abweichung, weil zwei Vorgaben sich widersprechen. Ohne Nachweis entsteht kein Eintrag, auch nicht für
  einen Wunsch.
  - **Projekt zuerst:** Lässt sich die Schwäche durch eine Vorgabe des Projekts lösen, etwa in Teststrategie,
    Beitragsregeln, Konventionen oder im Zuschnitt der Tasks, ist sie eine Verbesserung des Projekts, auch
    wenn ein Werkzeug beteiligt war. Erfasse sie vorher als Entwurf im Planungssystem mit der betroffenen
    Datei und dem konkreten Textvorschlag, sodass die Zustimmung des Nutzers genügt, und nenne seine ID.
    Ändere die Vorgabe dafür nicht selbst.
  - **Werkzeug nur bei Defekt:** Löst keine Vorgabe des Projekts die Schwäche, nenne ein Werkzeug, das das
    Projekt nur nutzt, nur, wenn es sich anders verhält, als es selbst beschreibt, oder zwei seiner Regeln
    sich widersprechen. Schreibe den Eintrag als
    fertigen Meldetext mit Werkzeug, Version, Beobachtung, Erwartung und Nachweis, ohne Projektnamen, Pfade
    des Projekts, Task-IDs oder andere Daten des Projekts, und ergänze die Meldeadresse, falls das Werkzeug
    selbst eine nennt. Sende die Meldung nie selbst.
- **Kennzahlen:** eine Zeile in der Reihenfolge der Vorlage. Lass jede Angabe mit dem Wert null weg. Die
  Angaben ab „summiert über parallele Arbeit“ gibt es nur bei `run` und nur, wenn Warten einen wesentlichen
  Teil der Dauer ausmacht. Nenne sie nie ohne diesen Zusatz neben der Dauer, denn als Summe über parallel
  arbeitende Agenten können sie die Dauer übersteigen.
- **Letzte Zeile:** nur Modi mit echter Arbeit: `review` für Tasks in `review`, `shape <eindeutiger Task>`
  für einen Entwurf oder `shape backlog` für mehrere, `run <Scope>` für den ersten ausführbaren Scope nach
  `shape`. Eine neue Idee geht an `goal`. Starte keinen Modus selbst. Ist nichts offen, sagt das die
  Ankerzeile und die Zeile entfällt.

## Antworten in diesem Chat

Der Nutzer antwortet meist sofort. Halte jeden beantworteten Punkt vor Sessionende nach den
Aufzeichnungsregeln von [Entscheidungen vorlegen](playbook-decision-card.md) fest. Kläre nur einen
mehrdeutigen Punkt. Bringe daraus folgende Dateiänderungen in einen weiteren lokalen Commit pro betroffenem
Repo, pushe nichts und bestätige in einer Zeile, was festgehalten wurde.
