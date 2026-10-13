---
description: >
  Ohne erreichbaren Nutzer entscheiden: vorab klären, aus Projektwissen entscheiden, reversibel annehmen
  oder als menschliche Übergabe festhalten.
type: playbook
edit: locked
license: MIT
---

# Ohne Nutzer entscheiden

Dieses Vorgehen gilt, wenn ein Modus ohne erreichbaren Nutzer läuft. Was nach einer Übergabe geschieht und
wo Annahmen berichtet werden, legt das Flag des Modus fest.

1. **Vorab klären:** Prüfe vor dem ersten Schritt alles, was den Lauf später anhalten würde: Orchestrierung,
   Erreichbarkeit und Schreibrecht des Spine, benötigte Werkzeuge, Authentifizierungen und Subagents sowie
   absehbare Berechtigungsabfragen des Hosts. Bündle offene Punkte in einer einzigen Rückfrage und starte
   erst nach deren Klärung. Ohne offene Punkte starte direkt.
2. **Aus Projektwissen entscheiden:** Belegen Taskvertrag, Entscheidungen, Anforderungen, Konventionen oder
   anderes maßgebliches Projektwissen die Antwort auf eine Frage, die sonst den Nutzer bräuchte, entscheide
   danach und halte Entscheidung und Quelle im Task fest. Eine fehlende Ausführungsreife schließt du nur so.
3. **Annehmen:** Ist die Antwort nicht belegt, die Entscheidung aber reversibel, lokal und ohne Änderung von
   Ziel, Scope oder Abnahme, wähle die begründet beste Option und halte sie im Task als Annahme fest.
4. **Übergeben:** Alles andere, insbesondere Sicherheits-, Berechtigungs- und Außenwirkungsgrenzen,
   irreversible Wirkung oder eine mögliche Nutzerentscheidung, ist eine menschliche Übergabe an `review`.

Das Vorgehen erweitert keine Autorisierung. Korrekturbudget, Stopbedingungen und Modusgrenzen gelten
unverändert.
