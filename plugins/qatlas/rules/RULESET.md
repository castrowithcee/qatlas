---
description: >
  Optionale, nutzerweit schaltbare Arbeitsvereinbarung für sichere Befehle und Tests sowie Datenschutz.
license: MIT
type: rule
edit: locked
---

<!-- Von Qatlas verwaltet. Änderungen werden beim nächsten Sessionstart nach einem Plugin-Update
überschrieben. Gewünschte Regeln in die eigene globale oder projektlokale Agentendatei kopieren. -->

# Qatlas-Arbeitsvereinbarung

Diese Regeln gelten vollständig, solange ihre Injektion in `~/.qatlas/plugins/config.yaml` aktiviert ist.
Der Nutzer kann sie dort gemeinsam mit dem Qatlas-Sessionstart oder einzeln abschalten. Native globale
und projektlokale Agentenanweisungen haben Vorrang. Ist dieser Block unvollständig oder nur als Vorschau
vorhanden, lies die im Block genannte Quelldatei vollständig, bevor du arbeitest.

## Sichere Befehle und Tests

- Prüfe vor Befehlen mit möglicher Lösch-, Überschreib-, Berechtigungs- oder externer Wirkung das genaue
  Ziel, den Umfang, die Autorisierung und die Wiederherstellbarkeit. Ermittle Unklares zuerst read-only.
- Verwende für destruktive Ziele keine unaufgelösten Variablen, Globs oder Substitutionen und niemals Home,
  Repo-Root oder eine andere breite Datensammlung. Bevorzuge eine wiederherstellbare Verschiebung vor dem
  Löschen.
- Teste einen Schutzmechanismus nie so, dass sein Versagen echte Daten beschädigt. Prüfe seine Entscheidung
  mit synthetischen Eingaben oder ausschließlich in einer frisch erzeugten, entbehrlichen Temp-Umgebung;
  der Test muss auch dann harmlos bleiben, wenn der Schutz überhaupt nicht läuft.
- Kannst du Wirkung oder Ziel nicht sicher begrenzen, führe den Befehl nicht aus und frage nach.
