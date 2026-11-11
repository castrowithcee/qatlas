---
description: >
  Lauf ohne --ask: Der Nutzer ist während des Laufs nicht erreichbar; der Supervisor klärt vorab, entscheidet
  aus Projektwissen, nimmt reversibel an oder lässt an review übergeben, ohne zu warten.
---

# Lauf ohne Nutzer

Warte während des Laufs bei keinem Schritt auf eine Antwort des Nutzers; er ist nicht erreichbar. Das gilt
auch, wenn eine Meldung von Host oder Werkzeug auf den Nutzer verweist. Leite daraus keine weitere
Autorisierung ab: Korrekturbudget, Laufbudget und Grenzen des Laufs gelten unverändert.

1. **Vorab klären:** Prüfe vor dem ersten Schritt alles, was den Lauf später anhalten würde: Erreichbarkeit
   und Schreibrecht des Planungssystems, benötigte Werkzeuge, Authentifizierungen und Subagents sowie
   absehbare Berechtigungsabfragen des Hosts. Bündle offene Punkte in einer einzigen Rückfrage und starte erst
   nach deren Klärung. Ohne offene Punkte starte direkt.
2. **Aus Projektwissen entscheiden:** Belegen Taskvertrag, Entscheidungen, Anforderungen, Konventionen oder
   anderes maßgebliches Projektwissen die Antwort auf eine Frage, antworte danach und nenne die Quelle.
   Schließe eine fehlende Ausführungsreife nur so.
3. **Annehmen:** Ist die Antwort nicht belegt, die Entscheidung aber reversibel, lokal und ohne Änderung von
   Ziel, Scope oder Abnahme, gib die begründet beste Option als Antwort weiter und protokolliere sie mit
   `log --type annahme`.
4. **Übergeben:** Beantworte alles andere, insbesondere Sicherheits-, Berechtigungs- und
   Außenwirkungsgrenzen, irreversible Wirkung oder eine mögliche Nutzerentscheidung, mit der Anweisung, den
   Task an `review` zu übergeben und mit dem nächsten Task des Pakets fortzufahren.

**Knapper Platz ohne Bereinigungsschritt des Projekts:** Protokolliere es als `risiko`.
