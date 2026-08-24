---
description: >
  Installiert die aktuelle Qatlas CLI aus dem offiziellen GitHub-Release in ein nutzereigenes Prefix und
  prüft Archiv, Checksumme, Programm und PATH.
license: MIT
type: playbook
edit: locked
---

# Qatlas CLI installieren

Installiere die CLI nur, wenn sie für den autorisierten Auftrag tatsächlich fehlt. Weise zuerst knapp
darauf hin, dass Qatlas benötigt wird. Hole vor Download und Systemänderung die erforderliche Freigabe,
sofern der Nutzer die Installation nicht bereits ausdrücklich beauftragt hat.

## Sichere Quelle

Verwende ausschließlich den neuesten stabilen Release aus
`https://github.com/castrowithcee/qatlas-cli/releases`. Ermittle Release und Assets aktuell über GitHub
oder dessen API. Übernimm keine Versionsnummer aus diesem Skill.

Die Releases liefern derzeit prefix-fertige Archive für Linux und macOS auf `amd64` und `arm64` sowie
Windows auf `amd64`. Prüfe Betriebssystem und Architektur gegen die tatsächlich veröffentlichten Assets.
Ist keine passende Kombination vorhanden, stoppe mit diesem Befund.

Die Release-Binaries sind nicht codesigniert oder notarisiert. Nenne das vor der ersten Installation, ohne
es als Fehler darzustellen.

## Installieren

1. Lade das passende Archiv und `checksums.txt` in ein neu angelegtes temporäres Verzeichnis.
2. Akzeptiere Download-URLs nur von den offiziellen GitHub-Release-Hosts für
   `castrowithcee/qatlas-cli`.
3. Ermittle aus `checksums.txt` exakt die Zeile des gewählten Archivs und prüfe dessen SHA-256-Checksumme.
   Fehlt die Zeile oder stimmt die Checksumme nicht, installiere nichts.
4. Installiere ohne Root-Rechte in ein nutzereigenes Prefix. Verwende auf Linux und macOS standardmäßig
   `~/.local`, auf Windows standardmäßig `%LOCALAPPDATA%\Programs\Qatlas`, sofern der Nutzer keinen
   anderen Pfad bestimmt hat. Überschreibe keine fremde oder nicht eindeutig zu Qatlas gehörende Datei.
5. Stelle sicher, dass der jeweilige `bin`-Ordner im Nutzer-`PATH` liegt. Ändere Shellprofile nicht ohne
   Freigabe; nenne andernfalls die erforderliche Ergänzung.
6. Prüfe die Installation mit `qatlas --version` und `qatlas --help`.

Räume nur das für diesen Vorgang erzeugte temporäre Verzeichnis auf. Setze nach erfolgreicher Installation
mit der Route fort, wegen der die CLI gebraucht wurde. Services, Credentials und Connections richtet der
Nutzer bei Bedarf mit `qatlas tui` ein, ohne Secrets im Chat offenzulegen.
