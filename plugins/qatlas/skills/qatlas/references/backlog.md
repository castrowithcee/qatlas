---
description: >
  Interaktive Reifung und bewusste Umpriorisierung des maßgeblichen Backlogs von unreifen Paketen über den
  nächsten Ausführungshorizont bis zu menschlichen oder extern wartenden Aufgaben.
type: playbook
edit: locked
license: MIT
---

# Backlog disponieren

Aus einem vorhandenen Arbeitsvorrat entsteht eine verständliche, ausführbare und bewusst geordnete Queue.
Dieser Modus verändert Planung und Taskverträge, führt aber keine fachliche Arbeit aus.

Ohne angegebenen Scope ist der gesamte maßgebliche Backlog gewählt. Das Hauptziel ist dann immer, die
offenen Vertragsfragen seiner Drafts einzeln zu besprechen und jeden geklärten Task auf `ready` zu setzen.
Ein angegebener Scope begrenzt die Bearbeitung auf einen Task, ein Projekt oder eine andere im
Planungssystem eindeutig bestimmbare Teilmenge. Frage nicht nach einem Scope, nur weil der Nutzer keinen
angegeben hat.

Verwende diesen Modus außerdem, wenn ruhende Arbeit geprüft, mehrere Scopes gegeneinander priorisiert oder
eine bestehende `next`-Menge bewusst geändert werden soll. Er ist keine Voraussetzung für die Ausführung
bereits vollständig geklärter Arbeit.

## Bestand bilden

1. Bestimme das maßgebliche Planungssystem. Löse einen angegebenen Scope darin auf; ohne Angabe gilt der
   gesamte offene Backlog.
2. Lies zuerst nur Roster beziehungsweise externe Metadaten: Status, Kurzstand, Reihenfolge,
   Abhängigkeiten, Eigentümerschaft und vorhandene Wiedervorlagen.
3. Bilde daraus getrennte Kandidatenmengen für `review`, `draft`, `waiting`, `ready` und `next`.
   Bilde aus den Drafts in fachlich sinnvoller Reihenfolge die Gesprächsschlange. Lies jeden Task erst
   vollständig, wenn er an der Reihe ist.
4. Verändere keinen `in-progress`-Task mit laufendem oder unbekanntem Worker.

Bei großen Beständen halte immer nur einen sinnvollen Ausschnitt und den gerade besprochenen Task vollständig
im Kontext. Die Größe des Bestands ist kein Grund, nach der Übersicht zu stoppen oder Drafts ungeprüft zu
überspringen.

## Disponieren

Arbeite in dieser Reihenfolge, soweit der gewählte Scope die Gruppe enthält:

1. **Drafts einzeln reifen.** Öffne den ersten Task der Gesprächsschlange und benenne seine konkrete offene
   Vertragsfrage zu Ergebnis, Scope-in, Scope-out, Vorgehen oder Abnahme. Ermittle eine belegbare Antwort
   selbst aus dem aktuellen Projektstand. Braucht es eine Nutzerentscheidung, stelle genau die nächste
   entscheidungsrelevante Frage mit einer begründeten Empfehlung und warte auf die Antwort. Arbeite jede
   geklärte Antwort sofort am fachlich passenden Ort in den aktuellen Taskvertrag ein und entferne
   überholte Varianten. Fahre danach mit der nächsten offenen Frage oder dem nächsten Draft fort.
2. **Reife belegen.** Setze einen Task nach dem Statusmodell des maßgeblichen Planungssystems auf `ready`,
   sobald keine bekannte Vertragsfrage bleibt. Ist eine Frage erst durch ein noch nicht vorhandenes
   Arbeitsergebnis oder ein externes Ereignis beantwortbar, belasse den Task als `draft` und halte die
   genaue fehlende Information sowie den erkennbaren Wiederaufnahmeauslöser fest. Eine Reihenfolge oder
   Abhängigkeit allein belegt diese Unreife nicht. Beende den Lauf nicht nach der Bestandsaufnahme: Jeder
   anfangs gewählte Draft wird besprochen oder vom Nutzer ausdrücklich zurückgestellt.
3. **Menschliche Gates sichtbar machen.** Kläre echte `review`-Übergaben in diesem Modus nur, wenn der Nutzer
   das ausdrücklich in denselben Aufruf einbezieht.
4. **Ruhende Arbeit prüfen.** Hebe `waiting` nur auf, wenn das Wiederaufnahmesignal belegt eingetreten ist.
5. **Nächsten Horizont bilden.** Bewahre eine bestehende `next`-Queue, sofern der Nutzer sie nicht
   ausdrücklich in diesem Aufruf ändern lässt. Ist sie leer, wähle aus den `ready`-Tasks des gewählten
   Scopes selbstständig einen zusammenhängenden nächsten Horizont von höchstens fünf Tasks und setze ihren
   Status auf `next`. Wähle nach erfüllbaren Abhängigkeiten, fachlichem Nutzen, früher Risikoklärung und
   sinnvoller Integration; bei weniger als fünf passenden Tasks nimm entsprechend weniger. Eine bloße
   Übersicht ist keine Disposition.
6. **Bestehende Queue konsolidieren.** Entferne Doppelungen, löse widersprüchliche Reihenfolgen und prüfe
   Abhängigkeiten, ohne ausführbare Taskverträge unnötig umzuschreiben.

## Grenzen

- Erzeuge keine künstlichen Tasks nur, um eine ferne Idee vollständig zu nummerieren. Materialisiere
  eigenständige Pakete, wenn ihr Vertrag verstanden ist; halte spätere Horizonte kompakt im Projektwissen.
- Setze nichts auf `in-progress` oder `done` und beginne keine Implementierung.
- Eine ausdrücklich vom Nutzer zusammengestellte `next`-Menge hat keine harte Größenbegrenzung.
- Bewahre keine Review- oder Planungshistorie im Task. Er bleibt der konsolidierte aktuelle Stand.

Beende erst, wenn jeder anfangs gewählte Draft entweder `ready` ist, mit seiner konkreten derzeit nicht
klärbaren Frage als `draft` verbleibt oder vom Nutzer ausdrücklich zurückgestellt wurde. Nenne dann die
Anzahl der weiterhin `draft`, `waiting`, `review` und neu oder weiterhin `next` liegenden Tasks sowie den
ersten ausführbaren Scope. Starte ihn nicht.
