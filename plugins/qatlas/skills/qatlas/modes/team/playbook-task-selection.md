---
description: >
  Ausführbare Tasks eines Team-Laufs auswählen, auf Ausführungsreife und Zuständigkeit prüfen und die Auswahl
  bei jedem Nachfüllen neu bewerten.
---

# Tasks auswählen

Nimm in einen Lauf höchstens so viele Tasks auf, wie sein Laufbudget erlaubt. Werte das Budget weder als
Commit- noch als Subagent-Zahl und passe es nicht an die Zahl der `next`-Tasks an. Lass eine größere
`next`-Menge in ihrer bestehenden Reihenfolge für spätere Läufe.

1. Bestimme aus dem Roster oder den externen Metadaten des gewählten Scopes Status, Kurzstand, Reihenfolge,
   Abhängigkeiten und Zuständigkeitssignale. Lies bei einem ausdrücklich gewählten einzelnen Task direkt
   seinen aktuellen Eintrag.
2. Nimm zuerst ausführbare `next`-Tasks in der Reihenfolge des Planungssystems. Gibt es weniger, als das
   Laufbudget erlaubt, fülle den Lauf selbst mit fachlich passenden `ready`-Tasks desselben Scopes auf. Wähle
   nach erfüllbaren Abhängigkeiten, fachlichem Wert, früher Risikoklärung und sinnvoller Integration.
3. Setze einen gewählten `ready`-Task auf `next`, bevor er beansprucht wird.
4. Lies die gewählten Tasks und ihre echten Blocker vollständig.
5. Prüfe jeden Task vor der Aufnahme in ein Paket erneut auf die Ausführungsreife der Backlog-Norm. Ist sie
   nicht erfüllt, setze ihn nach den Regeln der Norm auf `draft` oder `waiting`, nenne ihn im Abschlussblock
   und führe ihn nicht aus. Werte eine technische Schwierigkeit oder eine zusätzliche Datei im fachlichen
   Scope nicht als offene Vertragsfrage.
6. Nimm keinen `in-progress`-Task mit laufendem oder unbekanntem Bearbeiter auf. Kläre zuerst seinen
   Eigentümer und Arbeitsstand.
7. Prüfe vor dem Start bei Git Root, Branch, Upstream, Worktrees und den vollständigen Status. Beginne den
   Lauf nur auf einem sauberen Kontroll-Branch.

Bewerte Auswahl, Reihenfolge, Abhängigkeiten und verbleibendes Laufbudget bei jedem Nachfüllen neu.
