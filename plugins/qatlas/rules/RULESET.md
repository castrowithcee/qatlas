---
description: >
  Arbeitsvereinbarung für sichere Befehle und Tests.
license: MIT
type: rule
edit: locked
---

<!-- Von Qatlas verwaltet. Änderungen werden beim nächsten Sessionstart nach einem Plugin-Update
überschrieben. Gewünschte Regeln in die eigene globale oder projektlokale Agentendatei kopieren. -->

# Qatlas-Arbeitsvereinbarung

- Prüfe vor Befehlen mit möglicher Lösch-, Überschreib-, Berechtigungs- oder externer Wirkung das genaue
  Ziel, den Umfang, die Autorisierung und die Wiederherstellbarkeit. Ermittle Unklares zuerst read-only.
- Verwende für destruktive Ziele keine unaufgelösten Variablen, Globs oder Substitutionen und niemals Home,
  Repo-Root oder eine andere breite Datensammlung. Bevorzuge eine wiederherstellbare Verschiebung vor dem
  Löschen.
- Teste einen Schutzmechanismus nie so, dass sein Versagen echte Daten beschädigt. Prüfe seine Entscheidung
  mit synthetischen Eingaben oder ausschließlich in einer frisch erzeugten, entbehrlichen Temp-Umgebung;
  der Test muss auch dann harmlos bleiben, wenn der Schutz überhaupt nicht läuft.
- Kannst du Wirkung oder Ziel nicht sicher begrenzen, führe den Befehl nicht aus und frage nach.
