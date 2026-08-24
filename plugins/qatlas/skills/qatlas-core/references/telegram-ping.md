---
description: >
  Einseitigen Telegram-Kanal für Wartebenachrichtigungen einrichten, das Secret außerhalb des Repos
  speichern und einen Test-Ping senden.
license: MIT
type: playbook
edit: locked
---

# Telegram-Ping einrichten

Richte einen einseitigen Push zu Telegram ein. Stoppt der Agent und wartet auf dich, erreicht dein Telefon
eine Nachricht. Du musst die Session nicht beobachten, antwortest aber weiter am Terminal; der Kanal meldet
nur den Beginn des Wartens.

## Wann

- Nur auf direkte Anfrage des Nutzers. Das Verdrahten eines Benachrichtigungskanals darf nie automatisch starten.
- Nach der Einrichtung feuert der Ping selbstständig. Dieser Skill dient Einrichtung und manuellem Test,
  nicht dem Senden während normaler Arbeit.

## Funktionsweise

Unter Claude feuert der `Notification`-Hook, wenn Claude untätig auf dich wartet, und startet das Sendescript.
Das Secret liegt außerhalb jedes Repos in `~/.qatlas/telegram.json`, wird nur gelesen und nie geloggt. Die
Konfiguration trägt ein ausdrückliches Feld `enabled`; der Ein-/Aus-Zustand wird nicht aus der bloßen Existenz
der Datei geraten. Ausgeschaltet, fehlend oder unausgefüllt bleibt der Kanal still und die Session unverändert.

Codex hat kein Untätigkeits- oder Attention-Event, sondern nur `Stop` pro Zug. Der automatische Ping ist
deshalb vorerst Claude vorbehalten. Das Sendescript selbst ist hostneutral, sodass der manuelle Test auch
unter Codex funktioniert.

## Einmalige Einrichtung

Führe den Nutzer hindurch. Das Script legt Ordner und leeres Gerüst an; der Nutzer trägt nur seine beiden
Werte im eigenen Editor ein, damit das Token nie durch die Session läuft.

Verwende den vom Router aufgelösten `<plugin-root>`. Setze vor einem Script-Aufruf den echten absoluten Pfad
ein. Tippe hier nie `$CLAUDE_PLUGIN_ROOT` in eine Shell, denn der Host ersetzt es nur in Hook-Befehlen.
Verwende auch keinen festen Pfad, weil der Installationspfad die Version trägt.

1. **Grundlage anlegen.** Führe `--init` aus. Es erstellt `~/.qatlas/` und bei fehlender Datei das Gerüst
   `telegram.json` mit `{ "enabled": false, "token": "", "chat_id": "" }` und meldet den Pfad:
   `node "<plugin-root>/scripts/qatlas-telegram-notify.js" --init`
2. **Bot erstellen.** Schreibe in Telegram an `@BotFather`, sende `/newbot` und folge den Fragen. Du erhältst
   ein **Bot-Token** wie `123456:ABC-DEF...`.
3. **Chat-ID holen.** Der Nutzer sendet seinem neuen Bot eine Nachricht, öffnet danach im Browser
   `https://api.telegram.org/bot<TOKEN>/getUpdates` und liest `message.chat.id` aus dem JSON. In der URL wird
   das echte Token eingesetzt. Nur hier erscheint es einmal in einer URL im Browser des Nutzers, nie in der Session.
4. **Beide Werte eintragen.** Der Nutzer öffnet `~/.qatlas/telegram.json` in seinem Editor und fügt Token
   und Chat-ID ein. Biete nicht an, dies für ihn zu schreiben; das Token soll aus dem Session-Transkript
   bleiben. `enabled` bleibt unverändert, der Test schaltet es ein. Dieselbe Datei funktioniert auf jedem
   Gerät. Die Zeile `Host` in der Nachricht zeigt, welches Gerät geklingelt hat.
5. **Testen.** Führe `--test` aus. Bei Erfolg sendet es einen Ping und setzt `enabled: true`. Berichte die
   Ausgabe:
   `node "<plugin-root>/scripts/qatlas-telegram-notify.js" --test`

   Auf dem Gerät des Nutzers muss eine Nachricht eintreffen. Meldet das Script leere Werte oder eine
   Ablehnung von Telegram, gib diese Zeile weiter. Sie nennt die Ursache, ohne das Token zu zeigen.

## Die Nachricht

Ein dichter Header benennt die Session bereits in der Vorschau des Sperrbildschirms, danach folgt der Body:

```
🔔 <host> · <agent>
<dir>/<branch>

<worauf der Agent wartet>
```

Der Body kommt aus der Benachrichtigung des Hosts. Unter Claude ist eine Untätigkeitsmeldung allgemein,
„Waiting for your input“. Ein abgeschlossener Lauf und eine offene Frage bedeuten deshalb beide „du wirst
gebraucht“; der Body unterscheidet sie beim Öffnen. Das ist beabsichtigt, denn in beiden Fällen bist du am Zug.

## Ausschalten

Setze `"enabled": false` in `~/.qatlas/telegram.json`, um den Kanal stummzuschalten und die Werte zu
behalten, oder lösche die Datei ganz. Beides schaltet nur den Kanal aus; alles andere bleibt unverändert.
