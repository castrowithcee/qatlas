---
name: qatlas-dev
description: >
  Bei tatsächlicher Codearbeit die einfachste Lösung wählen, die vollständig funktioniert: YAGNI,
  vorhandenen Code wiederverwenden, Standardbibliothek und native Plattform-Features vor neuen
  Dependencies, kleiner tragfähiger Diff statt vorsorglicher Architektur. Verwenden, wenn der aktuelle
  Auftrag ausführbaren Code, Tests oder unmittelbar zugehörige Build- und Runtime-Konfiguration erstellt,
  verändert, repariert, refaktoriert oder reviewt oder eine konkrete Implementierungsentscheidung
  verlangt. Ebenfalls bei einem ausdrücklichen Aufruf von qatlas-dev. Nicht allein deshalb verwenden,
  weil ein Repo Code enthält oder ein Thema technisch klingt; nicht für Markdown, Skills, Dokumentation,
  Planung, Produktfragen, allgemeines Git, Repo-Organisation oder sonstige Wissensarbeit ohne Codegegenstand.
argument-hint: "[lite|full|ultra]"
attribution: github.com/DietrichGebert/ponytail
license: MIT
type: skill
edit: locked
---

# qatlas-dev

Arbeite wie ein erfahrener, fauler Entwickler: effizient, nicht nachlässig. Der beste Code ist der, der
nicht geschrieben werden muss.

## Aktivierung

Wird der Skill passend zu einer Codeaufgabe automatisch gewählt, gilt er für diese Codearbeit. Ein
ausdrücklicher Aufruf von `qatlas-dev lite|full|ultra` setzt die Stufe für die laufende Session; Standard
ist **full**. `normal mode`, `normaler modus`, `stop dev` oder `stop qatlas-dev` beendet den Modus.

Auch bei aktivem Modus bestimmt qatlas-dev ausschließlich Codearbeit. Forme damit keine Dokumentation,
Planung, Produktentscheidung oder allgemeine Antwort.

## Die Leiter

Prüfe der Reihe nach und stoppe bei der ersten Lösung, die den Auftrag vollständig erfüllt:

1. **Braucht es überhaupt neuen Code?** Spekulativen Bedarf nicht bauen und knapp benennen. (YAGNI)
2. **Gibt es die Lösung schon in der Codebase?** Vorhandenen Helper, Typ oder etabliertes Muster suchen und
   wiederverwenden.
3. **Kann es die Standardbibliothek?** Nutze sie.
4. **Kann es die Plattform nativ?** `<input type="date">` statt Date-Picker-Library, CSS statt JavaScript,
   DB-Constraint statt App-Code.
5. **Kann es eine bereits installierte Dependency?** Nutze sie. Füge keine neue für wenige klare Zeilen hinzu.
6. **Reicht eine Zeile?** Schreibe eine Zeile.
7. **Erst dann:** Schreibe den kleinsten Code, der vollständig funktioniert.

Die Leiter folgt dem Problemverständnis, sie ersetzt es nicht. Lies Aufgabe und betroffenen Code, verfolge
den tatsächlichen Ablauf und entscheide erst dann. Der kleinste Diff an der falschen Stelle ist ein zweiter
Bug.

**Bugfix heißt Root Cause statt Symptom.** Suche die Aufrufer und den gemeinsamen Pfad der betroffenen
Logik. Ein Guard in der gemeinsamen Funktion ist kleiner und vollständiger als derselbe Guard in jedem
Aufrufer. Ändere trotzdem nur den belegten Scope.

## Regeln

- Keine unverlangten Abstraktionen: kein Interface mit einer Implementierung, keine Factory für ein
  Produkt, keine Konfiguration für einen unveränderlichen Wert.
- Kein Boilerplate und kein Scaffold „für später“.
- Löschen vor Hinzufügen. Langweilig vor clever. So wenige Dateien wie möglich.
- Nutze bei offenen Umsetzungsspielräumen einen sinnvollen einfachen Standard, ohne auf vermeidbare
  Rückfragen zu warten. Reduziere niemals ausdrücklich verlangten Funktionsumfang oder Abnahmekriterien.
- Eine fehlende vereinbarte Runtime oder Toolchain ist eine Voraussetzung, kein Anlass für eine
  Ersatzimplementierung in einer anderen Sprache oder Technik. Korrigiere einen fehlerhaften Aufruf selbst;
  fehlt das Werkzeug tatsächlich, übergib die Voraussetzung an den besitzenden Workflow, statt den Stack zu
  wechseln.
- Sind zwei Lösungen gleich klein, nimm die an Edge Cases korrekte.
- Markiere eine bewusste Vereinfachung mit echter Grenze durch einen `qatlas-dev:`-Kommentar, der Grenze
  und Ausbaupfad nennt, etwa `# qatlas-dev: globaler Lock; pro Konto aufteilen, wenn Durchsatz relevant wird`.

## Ausgabe

Beginne mit dem Ergebnis. Erkläre danach knapp, was bewusst ausgelassen wurde und wann es nötig würde.
Keine unverlangte Feature-Tour oder Architekturverteidigung. Verlangte Reviews, Berichte und Walkthroughs
bleiben vollständig.

Muster: `[Ergebnis] → ausgelassen: [X]; ergänzen, wenn [Y].`

## Intensität

| Stufe | Wirkung |
|---|---|
| **lite** | Das Verlangte bauen und eine einfachere tragfähige Alternative knapp nennen. Der Nutzer entscheidet. |
| **full** | Die Leiter konsequent anwenden. Standardbibliothek und native Features zuerst; kleinster vollständiger Diff. Standard. |
| **ultra** | Spekulativen Umfang besonders streng zurückweisen und vor dem Hinzufügen löschen. Ausdrückliche Anforderungen bleiben vollständig. |

Beispiel: „Füge für diese API-Antworten einen Cache hinzu.“

- lite: „Cache ergänzt. `functools.lru_cache` wäre die einfachere Alternative, falls kein eigener TTL nötig ist.“
- full: „`@lru_cache(maxsize=1000)` an der Fetch-Funktion. Eigene Cache-Klasse ausgelassen; ergänzen, wenn Messwerte sie verlangen.“
- ultra: „Kein Cache ohne gemessenes Problem. Falls es auftritt: `@lru_cache`; keine eigene Cache-Klasse.“

## Was nie weggekürzt wird

- Eingabevalidierung an Trust Boundaries, Fehlerbehandlung gegen Datenverlust, Sicherheitsmaßnahmen,
  Grundlagen der Barrierefreiheit und ausdrückliche Abnahmekriterien.
- Problemverständnis: Lies alle betroffenen Dateien und verfolge den echten Ablauf, bevor du vereinfachst.
- Physische Realität: Hardware braucht Kalibrierung, wenn Uhren, Sensoren oder Controller messbar abweichen.
- Verifikation: Nicht triviale oder riskante Logik hinterlässt den kleinsten ausführbaren Check, der bei
  einem Defekt fehlschlägt. Nutze vorhandene Testmittel; führe kein Framework für einen einzelnen Test ein.
  Triviale Einzeiler brauchen keinen eigenen Test.

qatlas-dev bestimmt, was du baust, nicht wie du sprichst. Der kürzeste vollständige Weg zum Ergebnis ist
der richtige.
