---
name: qatlas-sentinel
description: >
  Beta. Macht die Session auf ausdrücklichen Aufruf zum Leitstand über mehrere Projekte: prüft alle 45
  Minuten ihre Qatlas-Läufe und Planungssysteme und meldet nur, was den Nutzer braucht. Entscheidet nichts
  und ändert in keinem beobachteten Projekt eine Datei, einen Task oder einen Status. Ohne Argument nur die Karte zeigen. Nie automatisch
  starten.
disable-model-invocation: true
argument-hint: "[run]"
---

# Qatlas Sentinel

## Ohne Argument

Antworte nur mit dieser Karte als gerendertes Markdown in der Gesprächssprache. Lies nichts und ändere
nichts:

```card
### Qatlas Sentinel (Beta)

| Argument | Aufgabe |
|---|---|
| `run` | Behält die Projekte aus `qatlas-sentinel.json` dieses Workspace im Blick und meldet alle 45 Minuten, was neu ist. |

Aufruf: `qatlas-sentinel run`
```

Ist das Argument unbekannt, zeige die Karte und nenne es in einem Satz.

## Grenzen

- Melde nur. Beantworte keine Frage eines Laufs, ändere in keinem beobachteten Projekt eine Datei, einen
  Task oder einen Status und starte dort nichts.
- Lies je Takt nur die Ausgabe des Skripts und, wo es ein externes Planungssystem nennt, dessen offene Issues
  mit Titel, Status und Adresse. Öffne Bodies, Berichte, Diffs und Logs nur, wenn der Nutzer danach fragt.
- Fragt der Nutzer im Chat nach, antworte lesend. Will er handeln, nenne Projekt und Aufruf, den er dort
  startet.

## Werkzeuge

`<sentinel>` ist `node <skill-dir>/scripts/qatlas-sentinel.js`, `<skill-dir>` der Ordner dieser `SKILL.md`,
`<qatlas-root>` die `QATLAS PLUGIN ROOT` und `<workspace>` die Projektwurzel dieser Session, alle als
absolute Pfade. Gib jedem Befehl `--workspace <workspace>` mit, `tick` und `seen` auch `--qatlas-root
<qatlas-root>`.

`seen` und `notify` lesen ihren Text von der Standardeingabe. Schreibe ihn mit deinem Datei-Werkzeug, nicht
über die Shell, in eine neue Datei im Temp-Bereich und leite diese Datei ein: in einer POSIX-Shell mit
`<sentinel> … < <Datei>`, in PowerShell mit `Get-Content -Raw <Datei> | <sentinel> …`. Setze Text aus einem
Planungssystem nie in eine Befehlszeile, auch nicht in Anführungszeichen, mit `echo` oder in einem Heredoc.

## Run

1. **Weckruf:** Prüfe, ob du dich in dieser Session selbst zu einer festen Zeit wecken kannst, in Claude Code
   mit einem einmaligen Termin über `CronCreate`. Kann der Host das nicht, starte nicht und nenne das
   Hindernis.
2. **Liste:** Fehlt `<workspace>/qatlas-sentinel.json`, frage den Nutzer nach den Projekten, die du im Blick
   behalten sollst, und lege die Datei als `{"format": 1, "projects": ["<absoluter Pfad>", ...]}` an. Nimm
   nur Projekte, die er nennt.
3. **Meldeweg:** Fehlt `~/.qatlas/plugins/hooks/sentinel.js`, sag dem Nutzer einmal, dass Meldungen nur im
   Chat erscheinen, und biete an, das Modul nach „Meldemodul“ einzurichten. Starte trotzdem.
4. **Dauer:** Sag dem Nutzer einmal, dass der Takt nur läuft, solange diese Session offen ist, und dass er
   ihn nach einem Fortsetzen der Session mit `qatlas-sentinel run` neu startet.
5. Führe den ersten Takt aus.

## Takt

1. **Nächsten Takt planen:** Plane vor allem anderen den nächsten Takt in 45 Minuten als einmaligen Termin mit
   diesem Prompt, Pfade eingesetzt: `qatlas-sentinel Takt: Lies <skill-dir>/SKILL.md und führe genau einen
   Takt nach dem Abschnitt „Takt“ für <workspace> aus.` Steht schon ein solcher Termin aus, plane keinen
   zweiten. So läuft der Takt weiter, auch wenn dieser scheitert.
2. **Stand holen:** Führe `<sentinel> tick` aus. `signals` sind die neuen Hinweise, `external` die Projekte,
   deren Planungssystem du selbst liest.
3. **Externe Planungssysteme:** Lies für jeden Eintrag unter `external` die Bindung in `backlog` und hole
   darüber die offenen Issues mit dem Status, der für `review` oder `waiting` steht. Übergib sie mit `<sentinel>
   seen --project <repo>` als JSON-Liste `[{"id", "title", "status", "url"}]` auf der Standardeingabe, `status`
   als `review` oder `waiting`. Ist das System nicht erreichbar, etwa wegen eines gesperrten Zugangs, rufe
   stattdessen `<sentinel> seen --project <repo> --unreachable` mit dem Grund als Text auf der Standardeingabe
   auf. Die Ausgabe ergänzt `signals`.
4. **Melden:** Gibt es keine neuen Hinweise, beende den Takt ohne Nachricht. Sonst schreibe eine kurze
   Meldung: eine Ankerzeile mit Uhrzeit und Zahl der Hinweise, darunter je Projekt eine Zeile mit dem, was der
   Nutzer tun kann, und der vollen Adresse eines Issues. Zeige sie im Chat und übergib sie auf der
   Standardeingabe an `<sentinel> notify`. Meldet `notify` `failed`, nenne das Detail einmal im Chat.

## Meldemodul

`~/.qatlas/plugins/hooks/sentinel.js` ist ein Nutzermodul: Vorhanden heißt eingeschaltet. `notify` startet es
einmal je Meldung mit einer Zeile JSON auf der Standardeingabe: `event` immer `sentinel`, `workspace` der
absolute Pfad des Workspace und `text` die Meldung. Es hat 60 Sekunden, und ein Fehler hält den Takt nicht
auf.

Richte es nach dem Vorgehen für Nutzermodule von `qatlas-core-config` ein und prüfe es mit
`echo '{"event":"sentinel","workspace":"/tmp/test","text":"Test"}' | node ~/.qatlas/plugins/hooks/sentinel.js`.
