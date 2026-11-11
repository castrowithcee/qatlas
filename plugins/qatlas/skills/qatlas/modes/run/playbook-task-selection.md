---
description: >
  Ausführbare Tasks eines Laufs auswählen, ihre Zuständigkeit klären und die Auswahl bei jedem Nachfüllen
  neu bewerten.
---

# Tasks auswählen

Nimm in einen Lauf höchstens so viele Tasks auf, wie sein Laufbudget erlaubt. Werte das Budget weder als
Commit- noch als Subagent-Zahl und passe es nicht an die Zahl der `next`-Tasks an. Lass eine größere
`next`-Menge in ihrer bestehenden Reihenfolge für spätere Läufe.

1. Bestimme aus dem Roster oder den externen Metadaten des gewählten Scopes Status, Kurzstand, Reihenfolge,
   Abhängigkeiten und Zuständigkeitssignale. Nennt der Aufruf Tasks ausdrücklich, bestimme das nur für sie.
2. Nimm zuerst ausführbare `next`-Tasks in der Reihenfolge des Planungssystems. Gibt es weniger, als das
   Laufbudget erlaubt, fülle den Lauf selbst mit fachlich passenden `ready`-Tasks desselben Scopes auf. Wähle
   nach erfüllbaren Abhängigkeiten, fachlichem Wert, früher Risikoklärung und sinnvoller Integration.
3. Setze einen gewählten `ready`-Task auf `next`, bevor er beansprucht wird.
4. Lies die gewählten Tasks nicht selbst. Ein einzelner Task bildet ohne Lesen ein Paket. Gib mehrere einem
   lesenden Worker mit dem Profil `standard`, der jeden gewählten Task und seine echten Blocker vollständig
   liest, keine weiteren Kandidaten, und je Task in einer Zeile zurückgibt: Abhängigkeiten, Kopplung mit
   anderen gewählten Tasks samt Grund, zentrale Dateien, die er mit anderen teilt, Umfang und eine konkrete
   offene Vertragsfrage oder fehlende externe Voraussetzung, auf die er beim Lesen stößt.
5. Werte `ready` und `next` als belegte Ausführungsreife und prüfe sie weder selbst noch über einen Subagent
   erneut. Meldet der lesende Worker eine konkrete offene Vertragsfrage oder eine fehlende externe
   Voraussetzung, setze den Task nach der Backlog-Norm auf `draft` oder `waiting`, nenne ihn im Abschlussblock
   und führe ihn nicht aus. Werte eine technische Schwierigkeit oder eine zusätzliche Datei im fachlichen
   Scope nicht als offene Vertragsfrage.
6. Nimm keinen `in-progress`-Task mit laufendem oder unbekanntem Bearbeiter auf. Kläre zuerst seinen
   Eigentümer und Arbeitsstand.
7. Prüfe vor dem Start bei Git Root, Branch, Upstream, Worktrees und den vollständigen Status. Beginne den
   Lauf nur auf einem sauberen Kontroll-Branch.

Bewerte Auswahl, Reihenfolge, Abhängigkeiten und verbleibendes Laufbudget bei jedem Nachfüllen neu.
