---
description: >
  Optionale, nutzerweit schaltbare Arbeitsvereinbarung für Git-Sessionstart, sichere Befehle und Tests
  sowie Datenschutz.
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

## Git beim Sessionstart

Prüfe vor der eigentlichen Arbeit das Repo, in dem die Session beginnt. Betrifft die Arbeit später ein
eingebettetes oder benachbartes Repo, prüfe dieses vor dem ersten Eingriff ebenfalls:

1. Ermittle Repo-Root, Branch und Upstream; nimm weder `origin` noch `main` pauschal an.
2. Führe `git worktree list --porcelain` aus und verändere andere Worktrees nicht.
3. Führe bei vorhandenem Remote `git fetch` aus. Scheitert es, melde vor der Arbeit, dass der entfernte
   Stand nicht geprüft werden konnte.
4. Prüfe `git status` und die Abweichung zwischen `HEAD` und Upstream.
5. Ist der Arbeitsbaum sauber und der Branch nur zurück, aktualisiere per Fast-Forward, bevorzugt mit
   `git pull --ff-only`.
6. Ändere bei lokalen Änderungen, Divergenz oder drohenden Konflikten nichts automatisch. Berichte den
   Zustand, bevor du darauf aufbaust.

## Sichere Befehle und Tests

- Prüfe vor Befehlen mit möglicher Lösch-, Überschreib-, Berechtigungs- oder externer Wirkung das genaue
  Ziel, den Umfang, die Autorisierung und die Wiederherstellbarkeit. Ermittle Unklares zuerst read-only.
- Verwende für destruktive Ziele keine unaufgelösten Variablen, Globs oder Substitutionen und niemals Home,
  Repo-Root oder eine andere breite Datensammlung. Bevorzuge eine wiederherstellbare Verschiebung vor dem
  Löschen.
- Teste einen Schutzmechanismus nie so, dass sein Versagen echte Daten beschädigt. Prüfe seine Entscheidung
  mit synthetischen Eingaben oder ausschließlich in einer frisch erzeugten, entbehrlichen Temp-Umgebung;
  der Test muss auch dann harmlos bleiben, wenn der Schutz überhaupt nicht läuft.
- Führe destruktive Git-Befehle wie `reset --hard`, `clean -f`, `checkout --` oder ein überschreibendes
  `restore` nur bei ausdrücklichem Auftrag für das exakt geprüfte Repo und Ziel aus. Verwende niemals
  Force-Push und schreibe geteilte Historie nicht eigenmächtig um.
- Kannst du Wirkung oder Ziel nicht sicher begrenzen, führe den Befehl nicht aus und frage nach.

## Datenschutz

- Behandle jedes Repo, als wäre es öffentlich, sofern seine Agentenanweisungen nichts anderes festlegen.
- Versioniere Planung, Wissen und Struktur, niemals personenbezogene Rohdaten.
- Schreibe keine zuordenbaren Namen, Adressen, Telefonnummern, E-Mail-Adressen, Ausweis-, Zahlungs- oder
  Zugangsdaten in versionierte Dateien.
- Halte Domänenkennungen wie Kunden- oder Fallnummern lokal bei ihrem Thema.
- Schreibe niemals Secrets oder Zugangsdaten ins Repo.
