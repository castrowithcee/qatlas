---
name: qatlas-dev-review
description: >
  Prüft auf ausdrücklichen Aufruf einen Code-Diff oder das aktuelle Repository ausschließlich auf belegtes
  Over-Engineering: unnötige Abhängigkeiten, nachgebaute Standardfunktionen, spekulative Abstraktionen,
  ungenutzte Erweiterbarkeit und unnötig umfangreiche Logik. Nennt pro Fundstelle Ort, Beleg und kleineren
  Ersatz, setzt aber nichts um und ersetzt kein Korrektheits-, Sicherheits- oder Performance-Review. Durch
  Nennung von qatlas-dev-review starten.
disable-model-invocation: true
attribution: github.com/DietrichGebert/ponytail
license: MIT
type: skill
edit: locked
---

# Over-Engineering prüfen

Dieser Skill ist ein manueller Einmal-Review. Er sucht ausschließlich nach Komplexität, die ohne Verlust
des verlangten Verhaltens entfernt werden kann. Ein kurzer Diff ist kein Selbstzweck, und kein Befund ist
ein gültiges Ergebnis.

## Scope-in bestimmen

Ein ausdrücklich genannter Scope-in gewinnt:

- Meint der Nutzer den aktuellen Diff, die Änderungen oder den noch nicht eingecheckten Code, prüfe
  gestagte, ungestagte und relevante neue Dateien.
- Meint er das ganze Repo, die Codebasis, ein Audit oder alles, prüfe das aktuelle Git-Repository.
- Nennt er keinen Scope-in, prüfe einen vorhandenen Diff. Gibt es keinen, prüfe das aktuelle Repository.

Nenne die Wahl zu Beginn als `Scope-in: aktueller Diff.` oder `Scope-in: aktuelles Repository.` und frage
nicht nach. „Repository“ meint genau das aktuelle Git-Repo. Durchquere keine eingebetteten oder benachbarten
Repos, wenn der Nutzer sie nicht ausdrücklich nennt.

Nutze beim Repo-Durchgang die von Git erfassten und die relevanten nicht ignorierten Dateien. Überspringe
generierte Ausgaben, eingebundenen Fremdcode, Abhängigkeitsbäume und Build-Artefakte. Prüfe Quellcode, Tests,
Abhängigkeitsmanifeste sowie unmittelbar zugehörige Build- und Runtime-Konfiguration. Ordne die stärksten
belegten Kürzungen zuerst.

## Belegt prüfen

Verfolge Aufrufer, Implementierungen, Konfigurationswege und Tests, bevor du etwas als unnötig einstufst.
Suche insbesondere nach:

- eigener Logik, die eine bereits verwendbare Standardbibliothek oder Plattformfunktion nachbaut;
- einer neuen Abhängigkeit für einen kleinen, nativ lösbaren Zweck;
- Interfaces, Factories, Wrappern oder Schichten ohne zweite Variante und ohne belegte Systemgrenze;
- Flags, Konfiguration, Erweiterungspunkten und Fehlerpfaden, die niemand setzt oder erreicht;
- doppelter oder umständlicher Logik, die sich bei gleichem Verhalten klarer ausdrücken lässt.

Ein Fund braucht einen konkreten Beleg und einen kleineren Ersatz, der das erforderliche Verhalten erhält.
Eine einzelne Implementierung beweist allein noch kein YAGNI: Schnittstellen zu fremden Systemen,
Testgrenzen und bewusst stabile Modulgrenzen können sie rechtfertigen. Dynamische Aufrufe oder
Plugin-Mechanismen dürfen nicht allein wegen einer erfolglosen Textsuche als tot gelten.

## Ausgabe

Eine Zeile pro Fundstelle:

```text
<Datei>:L<Zeile oder Bereich> <Tag>: <unnötiger Mechanismus>; Beleg: <warum entbehrlich>; Ersatz: <kleinere Form>.
```

Tags:

- `delete:` unerreichbarer Code, ungenutztes Feature oder Flexibilität ohne Abnehmer; kein Ersatz nötig.
- `stdlib:` eigene Logik, deren benötigtes Verhalten die Standardbibliothek bereits bereitstellt.
- `native:` Abhängigkeit oder Code für eine passende Funktion der eingesetzten Plattform.
- `yagni:` vorsorgliche Abstraktion oder Konfiguration ohne aktuellen zweiten Fall und ohne notwendige Grenze.
- `shrink:` dasselbe Verhalten mit weniger und zugleich klarerem Code, ohne Code-Golf.

Beispiele:

```text
stats.py:L12-L26 stdlib: eigener Häufigkeitszähler; Beleg: nur hashbare Schlüssel und Ganzzahlen; Ersatz: collections.Counter.
format.ts:L4-L9 native: moment.js nur für ein unterstütztes Datumsformat; Beleg: keine weitere Nutzung oder Zeitzonenlogik; Ersatz: Intl.DateTimeFormat.
repo.py:L88-L112 yagni: AbstractRepository mit einer Implementierung; Beleg: keine externe Grenze und nur ein Aufrufer; Ersatz: konkrete Klasse direkt verwenden.
```

Schließe mit einer nachvollziehbaren Schätzung, soweit sie aus den vorgeschlagenen Änderungen ableitbar ist:
`Potenzial: etwa -<N> Zeilen, -<M> Abhängigkeiten.` Lass eine nicht belastbare Teilzahl weg.

Gibt es keinen Fund, sage `Kein belegtes Over-Engineering gefunden.` und stoppe.

## Scope-out

- Nimm Korrektheitsfehler, Sicherheitslücken und Performanceprobleme nicht als Over-Engineering-Funde auf.
  Weise bei einem erkannten Problem getrennt auf den nötigen normalen Review hin.
- Empfiehl nie, Eingabevalidierung an Trust Boundaries, Schutz vor Datenverlust, Sicherheitsmaßnahmen,
  Grundlagen der Barrierefreiheit oder ausdrückliche Abnahmekriterien wegzukürzen.
- Ein kleiner Smoke-Test oder eine auf `assert` beruhende Selbstprüfung ist das qatlas-dev-Minimum und
  kein Ballast. Entferne erforderliche Verifikation nicht für eine bessere Zeilenbilanz.
- Setze die vorgeschlagenen Änderungen in diesem Durchgang nicht um.
- Triff keine Aussage über Release-Reife. Dieser Review bewertet nur unnötige Komplexität.
