---
description: >
  Die maßgebliche next-Queue nach einem Shape-Lauf bewahren, bilden oder konsolidieren.
type: playbook
edit: locked
license: MIT
---

# Nächsten Horizont disponieren

Pflege nach dem Zuschnitt die maßgebliche `next`-Queue:

- Bewahre eine bestehende `next`-Queue; verdränge, ergänze oder sortiere sie nicht still. Neu ausgearbeitete
  oder gereifte Tasks bleiben `ready`, sofern der Nutzer die Queue nicht ausdrücklich in diesem Aufruf ändern
  lässt.
- Ist die Queue leer, wähle aus den `ready`-Tasks des gewählten Scopes selbstständig einen zusammenhängenden
  Horizont von höchstens fünf Tasks und setze ihren Status von `ready` auf `next`; bei weniger passenden
  Tasks nimm entsprechend weniger. `ready` und `next` sind keine gleichzeitigen Eigenschaften desselben
  Tasks.
- Ordne nach erfüllbaren Abhängigkeiten, fachlichem Nutzen, früher Risikoklärung und sinnvoller Integration.
  Die Queue-Reihenfolge ist keine Parallelitätsentscheidung.
- Nimm nie `draft`, `review` oder `waiting` auf und hole keine unbeteiligten `ready`-Tasks aus anderen Scopes
  hinzu. Ein `ready`-Task mit noch unerfüllter Abhängigkeit bleibt vertraglich reif, gehört aber nicht als
  ausführbarer Kandidat nach `next`. Hängt seine Abnahme von einer noch unbekannten Entscheidung im Vorgänger
  ab, bleibt er `draft`.
- Umfasst der gewählte Scope eine bestehende Queue, konsolidiere sie: Entferne Doppelungen, löse
  widersprüchliche Reihenfolgen und prüfe Abhängigkeiten, ohne ausführbare Taskverträge unnötig
  umzuschreiben.
- Der Nutzer darf die Queue ausdrücklich ändern oder über fünf Tasks erweitern; eine von ihm
  zusammengestellte `next`-Menge hat keine harte Größenbegrenzung. Die Grenze gilt nur für die automatische
  Disposition.

Eine bloße Übersicht ist keine Disposition.
