---
description: >
  Serieller autonomer Arbeitslauf für höchstens fünf ausführbare Tasks: Ein Orchestrator disponiert,
  überwacht und integriert, während Subagents genau einen Task zur Zeit umsetzen und nach spätestens zwei
  erfolglosen Korrekturen gesichert an den Nutzer übergeben.
type: playbook
edit: locked
license: MIT
---

# Arbeit ausführen

Aus einem ausdrücklich gewählten Task-, Projekt- oder Backlog-Scope entstehen integrierte, belegte
Ergebnisse oder konkrete menschliche Übergaben. Der initiale Agent ist der Orchestrator. Er hält Scope,
Spine, Taskauswahl, Subagents, Beweise, Integration und Stopbedingungen; die Subagents setzen die fachliche
Arbeit um.

Der Aufruf allein autorisiert im gewählten Scope Subagents, lokale Änderungen, Prüfungen, isolierte
Worktrees und lokale Commits. Er autorisiert keinen Push, Publish, kein Deployment, keine Nachricht an
Dritte und keine sonstige externe oder irreversible Wirkung. Eine konkrete Qatlas-Tooloperation ist nur
zulässig, wenn der aktuelle Nutzerauftrag, der maßgebliche Taskvertrag oder eine geltende globale
beziehungsweise projektlokale Agentendatei Wirkung, Connection, Zielbereich und Grenzen separat und
eindeutig festlegt. Wende dafür `qatlas-core-cli-mcp` an. Eine Abschlussmeldung sendet ausschließlich der
primäre Orchestrator; Subagents senden bei ihrer Fertigmeldung keine Nachricht.

## Laufvertrag festlegen

Bestimme vor der ersten Änderung:

1. **Ziel:** Welcher beobachtbare Zustand beendet den Lauf erfolgreich?
2. **Scope-in:** Welche Tasks, Repos, Pfade und Systeme gehören zum Aufruf?
3. **Scope-out:** Welche benachbarten Ziele, Pfade und Wirkungen bleiben ausgeschlossen?
4. **Spine:** Welches Planungssystem hält Status, Abhängigkeiten, Befunde und Übergaben dauerhaft fest?
5. **Beweise:** Welche Tests, Zustände oder Artefakte belegen den Abschluss?
6. **Grenzen:** Welche Handlung braucht zwingend den Nutzer?

Nutzer- und Projektvorgaben bestimmen das Planungssystem. Nur ohne andere Vorgabe gilt der lokale
Qatlas-Backlog. Ist ein vorgeschriebenes externes System nicht erreichbar, spiegle es nicht in lokale
Dateien; stoppe vor schreibender Arbeit mit dem konkreten Hindernis.

## Tasks auswählen

Ein Lauf bearbeitet höchstens fünf Tasks. Die Zahl der `next`-Tasks verändert diese Grenze nicht. Eine
größere `next`-Menge bleibt in ihrer bestehenden Reihenfolge für spätere Läufe erhalten.

1. Lies zuerst nur Roster beziehungsweise externe Metadaten des gewählten Scopes. Ermittle Status,
   Kurzstand, Reihenfolge, Abhängigkeiten und Besitzsignale. Bei einem ausdrücklich gewählten einzelnen
   Task lies dessen aktuellen Datensatz direkt.
2. Nimm zuerst ausführbare `next`-Tasks in der Reihenfolge des Spine. Sind weniger als fünf vorhanden,
   ergänze den Lauf selbstständig mit fachlich passenden `ready`-Tasks desselben Scopes. Wähle nach
   erfüllbaren Abhängigkeiten, fachlichem Nutzen, früher Risikoklärung und sinnvoller Integration.
3. Ein ausgewählter `ready`-Task wechselt vor seiner Beanspruchung über `next`. `ready` und `next` sind
   exklusive Status; `next` setzt vollständige Ausführungsreife voraus.
4. Lies nur die ausgewählten Tasks und ihre echten Blocker vollständig. Öffne Kommentare oder Historie nur
   bei einem Widerspruch, fehlender entscheidungsrelevanter Begründung oder ausdrücklichem Verweis des
   aktuellen Datensatzes.
5. Prüfe jeden Task unmittelbar vor der Beanspruchung erneut. Hat sein Vertrag eine offene Frage zu
   Ergebnis, Scope, Vorgehen oder Abnahme, setze ihn auf `draft`, informiere den Nutzer konkret und führe
   ihn nicht aus. Eine technische Schwierigkeit allein ist keine offene Vertragsfrage.
6. Verändere keinen `in-progress`-Task mit einem laufenden oder unbekannten Subagent. Kläre zuerst dessen
   Eigentümer und Arbeitsstand.
7. Prüfe bei Git Root, Branch, Upstream, Worktrees und vollständigen Status. Schreibende Arbeit beginnt nur
   auf einem sauberen, seit dem Preflight unveränderten Steuerbranch. Wende vor dem ersten schreibenden
   Git-Schritt den vom Einstieg genannten Git-Ablauf an.

Plane die Auswahl nicht als unveränderlichen Batch. Nach jedem abgeschlossenen oder übergebenen Task
bewertet der Orchestrator Reihenfolge, Abhängigkeiten und verbleibende Laufkapazität neu.

## Genau einen Task ausführen

Es ist immer höchstens ein Task `in-progress`. Beanspruche ihn unmittelbar vor der ersten schreibenden
Ausführung im Spine. Kein Subagent verändert Spine oder Branchverwaltung, erstellt Commits oder startet
eigene Subagents.

### Subagents beauftragen

Der Orchestrator gibt jedem Subagent genau einen abgegrenzten Auftrag mit Task-ID und Titel, Arbeitsort,
erlaubten Zielen, Scope-out, Abnahmekriterien, Prüfungen und Rückgabeformat. Er implementiert die fachliche
Lösung nicht selbst. Kleine Status-, Integrations- und Verifikationsschritte bleiben bei ihm.

Normalerweise setzt ein Subagent den Task um. Braucht derselbe Task legitim mehrere getrennte Rollen oder
Zielbereiche, darf der Orchestrator zwei oder mehr Subagents einsetzen. Ihre Aufträge müssen sich
nachweislich ergänzen, dürfen keine konkurrierenden Lösungen bauen und bleiben gemeinsam im Fehlerbudget
dieses einen Tasks. Ein weiterer Task beginnt erst, wenn der aktive Task abgeschlossen oder gesichert
übergeben ist.

Sende nach dem erfolgreichen Start genau eine knappe Karte:

> **Aufgabe:** #84 - Dateizugriff auf SQL umstellen
>
> **Subagents:** terra · sol

Verwende ID und Titel aus dem Spine. Nenne nur tatsächlich gewählte oder geerbte Modellnamen in kurzer
Form; ist ein Modell nicht bekannt, schreibe `nicht ausgewiesen`. Fehlen die benötigten Subagents, stoppe
vor der Umsetzung und melde diese Voraussetzung. Der Orchestrator ersetzt sie nicht als stiller Subagent.

### Überwachen

Beobachte Arbeitsstand und Rückgaben gegen Taskvertrag, tatsächlichen Diff und vereinbarte Beweise. Greife
ein, wenn ein Subagent den Scope verlässt, ohne Fortschritt festhängt oder eine ausgeschlossene Wirkung
vorbereitet. Begrenze oder stoppe seinen Auftrag, statt durch weitere unspezifische Prompts Token zu
verbrauchen.

Eine Erfolgsmeldung des Subagents ist kein Abschlussbeleg. Der Orchestrator prüft Ergebnis, Diff und
Beweise selbst und klassifiziert jeden Fehlschlag:

- **Ausführungsfehler:** Ein falscher Pfad, Tippfehler, Quoting oder ungeeigneter Flag hat die Lösung noch
  nicht geprüft. Korrigiere den Aufruf einmal gezielt. Wiederholt sich derselbe Fehler, behandle ihn als
  fehlende Voraussetzung oder Lösungsfehler, nicht als unbegrenzte neue Runde.
- **Fehlende Voraussetzung:** Runtime, Werkzeug, Berechtigung, Ressource oder Nutzereingabe fehlen. Starte
  keinen Ersatzansatz. Sichere den Task unmittelbar für `review` oder `waiting`.
- **Lösungsfehler:** Der Ansatz wurde ausgeführt, erfüllt aber ein Abnahmekriterium nicht. Leite aus Diagnose
  oder neuer Evidenz eine konkrete Korrektur ab.

### Höchstens zwei Korrekturen

Der initiale Umsetzungsversuch zählt nicht als Korrektur. Danach sind pro Task insgesamt höchstens zwei
gezielte Korrekturversuche erlaubt, auch wenn mehrere Abnahmekriterien betroffen sind. Jede Korrektur braucht
neue Evidenz und eine daraus abgeleitete Änderung; bloßes Umformulieren, ein anderer Subagent oder eine neue
Session setzt den Zähler nicht zurück.

Ist das Kriterium nach der zweiten Korrektur weiterhin nicht erfüllt:

1. Stoppe jede weitere Umsetzung dieses Tasks.
2. Sichere den aktuellen Diff, die belegte Ursache, die zwei geprüften Korrekturen und die noch verletzte
   Abnahme kompakt im Task.
3. Setze den Task auf `review` und formuliere die konkrete Nutzerentscheidung zu Voraussetzung,
   Ansatzwechsel, Scope oder Zurückstellung.
4. Starte keinen Checker oder Ersatz-Subagent als verdeckte dritte Korrekturrunde.

Hängen verbleibende Tasks von diesem Ergebnis ab, stoppe den gesamten Lauf und übergib dem Nutzer die
Entscheidung. Nur nachweislich unabhängige Tasks dürfen innerhalb der verbleibenden Fünfergrenze seriell
weiterlaufen.

## Integrieren und abschließen

Integriere die Arbeit des aktiven Tasks, führe seine gemeinsamen Prüfungen aus und pflege Task,
Abschlussbericht und Spine nach dem maßgeblichen Vertrag. Setze ihn erst auf `done`, wenn alle Kriterien auf
dem Steuerbranch belegt sind.

Muss der Nutzer entscheiden, prüfen oder handeln, setze den Task auf `review`. Verhindert eine externe
Voraussetzung, Ressource oder Umgebung die Fortsetzung, setze ihn nach dem maßgeblichen Statusmodell auf
`waiting`. Eine unerfüllte interne Task-Abhängigkeit verändert den Status nicht; die Reihenfolge im Spine
genügt.

Beginne erst danach mit dem nächsten ausgewählten Task. Wiederhole Auswahl, Umsetzung und Integration, bis
fünf Tasks bearbeitet sind oder eine Stopbedingung eintritt.

## Stopbedingungen

Beende den Lauf, sobald eine dieser Bedingungen gilt:

- Fünf Tasks wurden abgeschlossen oder gesichert übergeben.
- Der gewählte Scope ist vollständig und belegt abgeschlossen.
- Es gibt im Scope weder ausführbares `next` noch ausführbares `ready`.
- Ein fehlgeschlagener Task blockiert die verbleibende Arbeit.
- Es bleibt nur Arbeit mit unerfüllten Abhängigkeiten, `waiting`, `draft` oder menschlicher Übergabe.
- Eine Scope-, Risiko-, Außenwirkungs- oder Berechtigungsgrenze ist erreicht.
- Der Steuerbranch wurde seit dem Preflight fremd verändert.

Sichere vor dem Ende Spine, Abschlussberichte und erlaubte lokale Commits. Berichte Ergebnis, maßgebliche
Beweise und konkrete menschliche Übergaben knapp. Pushe nichts.
