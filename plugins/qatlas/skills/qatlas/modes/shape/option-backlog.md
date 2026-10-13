---
description: >
  Shape-Variante für einen bestehenden Task oder einen Backlog-Ausschnitt: Bestand bilden, Drafts einzeln
  reifen, ruhende Arbeit prüfen und den nächsten Horizont disponieren.
type: playbook
edit: locked
license: MIT
---

# Vorhandene Arbeit ausarbeiten

Aus vorhandenen Tasks entsteht wieder ein verständlicher, ausführbarer und bewusst geordneter
Arbeitsvorrat. Dieses Verfahren ist ein optionaler Wiedereinstieg bei unklaren, manuell angelegten oder
durch neue Ergebnisse überholten Aufgaben. Er verändert Planung und Taskverträge, führt aber keine
fachliche Arbeit aus. Nach der Ausarbeitung einer neuen Idee ist er kein Pflichtschritt vor `run`.

`shape <eindeutiger Task>` wählt genau diesen bestehenden Task. `shape backlog [Scope]` wählt die
angegebene Teilmenge; ohne weiteren Scope ist der gesamte maßgebliche offene Backlog gewählt. Das
Hauptziel bei einem Backlog-Scope ist, die offenen Vertragsfragen seiner Drafts einzeln zu besprechen und
jeden geklärten Task auf `ready` zu setzen. Ein angegebener Backlog-Scope begrenzt die Bearbeitung auf
einen Task, ein Projekt oder eine andere im Planungssystem eindeutig bestimmbare Teilmenge. Frage nicht
nach einem Scope, nur weil der Nutzer `shape backlog` ohne weiteren Scope aufgerufen hat.

Verwende diesen Zweig außerdem, wenn ruhende Arbeit geprüft, mehrere Scopes gegeneinander priorisiert oder
eine bestehende `next`-Menge bewusst geändert werden soll. Ein vorhandener Draft kann eine erneute
Untersuchung und denselben fachlichen Zuschnitt wie bei `shape` brauchen; bearbeite ihn hier am bestehenden
Ort, statt für die Klärung einen anderen Einstieg zu verlangen.

## Bestand bilden

1. Löse einen angegebenen Scope im maßgeblichen Planungssystem auf; ohne Angabe gilt der gesamte offene
   Backlog.
2. Ist `.qatlas-project/README.md` vorhanden, folge von dort nur den Lesebedingungen, die für den gewählten
   Scope und seine offenen Vertragsfragen relevant sind. Fachliche Quellen außerhalb des Wissensraums
   bleiben für ihren Gegenstand maßgeblich; bloßes Lesen oder automatische Bereitstellung erhöht ihren Rang
   nicht.
3. Lies zuerst nur Roster beziehungsweise externe Metadaten: Status, Kurzstand, Reihenfolge,
   Abhängigkeiten, Eigentümerschaft und vorhandene Wiedervorlagen.
4. Bilde daraus getrennte Kandidatenmengen für `review`, `draft`, `waiting`, `ready` und `next`.
   Bilde aus den Drafts in fachlich sinnvoller Reihenfolge die Gesprächsschlange. Lies jeden Task erst
   vollständig, wenn er an der Reihe ist.
5. Verändere keinen `in-progress`-Task mit laufendem oder unbekanntem Worker.

Braucht mindestens ein Task der Gesprächsschlange eine echte Nutzerentscheidung, nenne und führe die
Entscheidungsschlange nach dem gemeinsamen Entscheidungsdialog.

Bei großen Beständen halte immer nur einen sinnvollen Ausschnitt und den gerade besprochenen Task vollständig
im Kontext. Die Größe des Bestands ist kein Grund, nach der Übersicht zu stoppen oder Drafts ungeprüft zu
überspringen.

## Disponieren

Arbeite in dieser Reihenfolge, soweit der gewählte Scope die Gruppe enthält:

1. **Drafts einzeln reifen.** Öffne den ersten Task der Gesprächsschlange und benenne seine konkrete offene
   Vertragsfrage zu Ergebnis, Scope-in, Scope-out, Vorgehen, Abnahme oder Ausführungsgrundlage. Ermittle eine
   belegbare Antwort selbst aus dem aktuellen Projektstand. Arbeite die für den Task geltenden
   Entscheidungen, Konventionen und Anforderungen konkret in Ziel, Vorgehen und überprüfbare Abnahme ein;
   eine Quellenliste allein reicht nicht. Braucht es eine Nutzerentscheidung, stelle genau die nächste
   Entscheidung nach dem gemeinsamen Dialog vor und warte auf die Antwort. Arbeite jede geklärte Antwort
   sofort am fachlich passenden Ort in den aktuellen Taskvertrag ein und entferne überholte Varianten. Ist
   ein manuell angelegter oder gewachsener Task als abgegrenzter Auftrag nicht tragfähig oder enthält er
   eigenständig abnehmbare Ergebnisse, teile ihn nach dem Zuschnittblock. Fahre danach mit der nächsten
   offenen Frage oder dem nächsten Draft fort.
2. **Reife belegen.** Setze einen Task nach dem Statusmodell des maßgeblichen Planungssystems auf `ready`,
   sobald er die Ausführungsreife der Backlog-Norm erreicht. Ist eine Frage erst durch ein noch nicht
   vorhandenes Arbeitsergebnis beantwortbar, belasse den Task als `draft` und halte die genaue fehlende
   Information fest. Eine Reihenfolge oder Abhängigkeit allein belegt diese Unreife nicht. Beende den Lauf
   nicht nach der Bestandsaufnahme: Jeder anfangs gewählte Draft wird besprochen oder vom Nutzer
   ausdrücklich zurückgestellt.
3. **Menschliche Gates sichtbar machen.** Kläre echte `review`-Übergaben in diesem Modus nur, wenn der Nutzer
   das ausdrücklich in denselben Aufruf einbezieht.
4. **Ruhende Arbeit prüfen.** Hebe `waiting` nur auf, wenn das Wiederaufnahmesignal belegt eingetreten ist.
5. **Nächsten Horizont bilden.** Bewahre, bilde oder konsolidiere die `next`-Queue nach dem
   Horizontblock.

## Abschluss

Beende erst, wenn jeder anfangs gewählte Draft entweder `ready` ist, mit seiner konkreten derzeit nicht
klärbaren Frage als `draft` verbleibt oder vom Nutzer ausdrücklich zurückgestellt wurde. Nenne dann die
Anzahl der weiterhin `draft`, `waiting`, `review` und neu oder weiterhin `next` liegenden Tasks sowie den
ersten ausführbaren Scope. Starte ihn nicht.
