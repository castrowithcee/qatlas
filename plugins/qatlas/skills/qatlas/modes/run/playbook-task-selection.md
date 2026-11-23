---
description: >
  Ausführbare Tasks eines Laufs auswählen, ihre Zuständigkeit klären und die Auswahl bei jedem Nachfüllen
  neu bewerten.
---

# Tasks auswählen

Nimm in einen Lauf höchstens so viele Tasks auf, wie sein Laufbudget erlaubt. Werte das Budget weder als
Commit- noch als Subagent-Zahl und passe es nicht an die Zahl der `ready`-Tasks an. Lass weitere
`ready`-Tasks in ihrer bestehenden Reihenfolge für spätere Läufe.

1. Bestimme aus der Übersicht des Planungssystems für den gewählten Scope Status, Kurzstand, Reihenfolge,
   Abhängigkeiten und Zuständigkeitssignale. Nennt der Aufruf Tasks ausdrücklich, bestimme das nur für sie.
2. Nimm ausführbare `ready`-Tasks in der Reihenfolge des Planungssystems. Legt es unter ihnen keine
   Reihenfolge fest, wähle nach erfüllbaren Abhängigkeiten, fachlichem Wert, früher Risikoklärung und
   sinnvoller Integration. Einen `deferred`-Task nimmst du nach der Backlog-Norm nur auf, wenn der Aufruf ihn
   ausdrücklich nennt.
3. Lies die gewählten Tasks nicht selbst. Ein einzelner Task bildet ohne Lesen ein Paket. Gib mehrere einem
   lesenden Worker mit dem Profil `standard`, der jeden gewählten Task und seine echten Blocker vollständig
   liest, keine weiteren Kandidaten, und je Task in einer Zeile zurückgibt: Abhängigkeiten, Kopplung mit
   anderen gewählten Tasks samt Grund, jede Datei, die er mit einem anderen gewählten Task teilt, mit der Art
   (dieselben Stellen umbauen, verschiedene Stellen ändern oder nur Einträge ergänzen), das Repo, dessen
   Dateien er ändert, oder keines, den Umfang und eine konkrete offene Vertragsfrage oder fehlende externe
   Voraussetzung, auf die er beim Lesen stößt. Den Umfang meldet er nach den erwarteten Änderungsflächen und
   Prüfschritten: `klein` bei einer eng begrenzten Änderungsfläche mit direkter Prüfung, `mittel` bei
   mehreren zusammenhängenden Änderungsflächen oder einem neuen Test, `groß` bei Änderungsflächen in mehreren
   Bereichen, mehreren aufeinander aufbauenden Umsetzungsschritten oder neuen Prüfschritten über mehrere
   Bereiche.
4. Werte `ready` als belegte Ausführungsreife und prüfe sie weder selbst noch über einen Subagent erneut.
   Meldet der lesende Worker eine konkrete offene Vertragsfrage oder eine fehlende externe Voraussetzung,
   setze den Task nach der Backlog-Norm auf `draft` oder `waiting`, nenne ihn im Abschlussblock und führe ihn
   nicht aus. Werte eine technische Schwierigkeit oder eine zusätzliche Datei im fachlichen Scope nicht als
   offene Vertragsfrage.
5. Nimm keinen `in-progress`-Task mit laufendem oder unbekanntem Bearbeiter auf. Kläre zuerst seinen
   Eigentümer und Arbeitsstand.
6. Prüfe vor dem Start bei Git Root, Branch, Upstream, Worktrees und den vollständigen Status. Beginne den
   Lauf nur auf einem sauberen Kontroll-Branch.

Bewerte Auswahl, Reihenfolge, Abhängigkeiten und verbleibendes Laufbudget bei jedem Nachfüllen neu.
