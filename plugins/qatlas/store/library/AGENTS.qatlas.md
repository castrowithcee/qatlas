<!-- Qatlas legt diese Datei beim Setup einmalig als ~/qatlas/AGENTS.qatlas.md an und überschreibt sie danach
nie. Sie gehört dir: Passe die globale Arbeitsvereinbarung an deine Arbeitsweise an. Als Agentendatei bleibt
sie frontmatterfrei. -->
# Globale Arbeitsvereinbarung

Diese Vereinbarung gilt projektübergreifend. Native globale und projektlokale Agentenanweisungen haben
Vorrang.

## Bibliothek

Nutzereigene, projektübergreifende Notizen, Wissen, Referenzen und Verfahren liegen in diesem Ordner. Lies
`README.md` hier erst, wenn eine Aufgabe dieses Wissen braucht.

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
