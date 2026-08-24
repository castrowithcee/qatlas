---
description: >
  Modulare Fähigkeitsprüfung, die aus Ja, Nein, Später oder Unklar nur die für ein Webprodukt relevanten
  Vertiefungsfragen und Architekturfolgen aktiviert.
license: MIT
type: playbook
edit: locked
---

# Fähigkeiten prüfen

## Schnellprüfung

Jede Zeile erhält `ja`, `nein`, `später` oder `unklar` sowie höchstens einen erklärenden Satz.

| Fähigkeit | Leitfrage |
|---|---|
| Identität | Braucht jemand ein Konto oder eine dauerhaft wiedererkennbare Identität? |
| Rollen und Rechte | Dürfen Nutzer unterschiedliche Dinge sehen oder tun? |
| Eigentum und Mandanten | Gehören Daten Personen, Teams, Workspaces oder Organisationen? |
| Zahlungen | Gibt es Käufe, Abos, Kontingente oder kostenpflichtige Berechtigungen? |
| Dateien | Werden Dateien hochgeladen, erzeugt, exportiert oder geteilt? |
| Benachrichtigungen | Braucht das Produkt E-Mail, In-App-, Push- oder andere Hinweise? |
| Externe Integrationen | Werden fremde APIs, Webhooks oder Datenquellen benötigt? |
| Öffentliche API | Greifen unabhängige Clients, Agents oder Dritte zu? |
| Weitere Clients | Sind Mobile, Desktop, CLI, MCP oder Admin UI realistisch? |
| Background Jobs | Gibt es lange, zeitversetzte, geplante oder retry-fähige Arbeit? |
| Realtime | Müssen Änderungen, Presence oder Kollaboration unmittelbar verteilt werden? |
| Offline | Muss ein wesentlicher Ablauf ohne Netzwerk funktionieren? |
| Suche | Reicht relationale Filterung oder wird spezialisierte Volltext-, Vektor- oder Facettensuche nötig? |
| AI | Erzeugt, bewertet oder verarbeitet ein Modell fachlich relevante Inhalte? |
| Nutzerinhalte | Können Nutzer öffentliche oder missbrauchbare Inhalte veröffentlichen? |
| Sensible Daten | Werden besonders schützenswerte oder regulierte Daten verarbeitet? |
| Hohe Last oder Verfügbarkeit | Bestehen konkrete Last-, Latenz-, Regionen- oder Ausfallziele? |

## Vertiefung nur bei Bedarf

### Identität, Rechte und Mandanten

- Anmeldung, Einladungen, Recovery und MFA bestimmen.
- Person, externe Provider-Identität, fachliches Profil und Mitgliedschaft unterscheiden.
- Eigentümer, Rollen, Berechtigungen und Objektgrenzen beschreiben.
- Bei möglichem SaaS klären, ob ein Nutzer mehreren Workspaces angehören kann und wie Daten exportiert oder
  gelöscht werden.

### Zahlungen

- Käufer, Rechnungsempfänger, Produkt beziehungsweise Tarif und freigeschaltete Leistung trennen.
- Einmalzahlung, Abo, Nutzung oder Kontingent bestimmen.
- Webhooks, Idempotenz, Rückerstattung, Kündigung und Ausfall des Payment Providers berücksichtigen.

### Dateien und Integrationen

- Typen, Größen, Lebensdauer, Sichtbarkeit, Scan- oder Verarbeitungsbedarf bestimmen.
- Bei Integrationen Richtung, Auth, Rate Limits, Retries, Webhooks und Ausfallverhalten klären.

### Jobs, Realtime und Offline

- Zulässige Laufzeit, Wiederholung, Reihenfolge und Idempotenz für Jobs bestimmen.
- Bei Realtime Aktualitätsziel, Verbindungsmodell und Konfliktverhalten beschreiben.
- Bei Offline festlegen, welche Daten lokal liegen und wie Konflikte synchronisiert werden.

### AI

- Modellaufgabe, Eingabequellen, erwartetes Ausgabeformat und menschliche Kontrolle festlegen.
- Kosten-, Latenz- und Qualitätsgrenzen sowie Fallbacks bestimmen.
- Prompt Injection, Datenfreigabe, Toolberechtigungen, Protokollierung und Evaluation berücksichtigen.

### Schutz, Last und Verfügbarkeit

- Datenklassifikation, Aufbewahrung, Löschung, Export und Auditbedarf bestimmen.
- Relevante Lastpfade, Latenz, Durchsatz, Ausfallfolgen und Wiederherstellungsziele statt bloßer Nutzerzahl
  benennen.

Das Fähigkeitenprofil erklärt, was jetzt, später oder bewusst nicht benötigt wird. `Später` erzeugt eine
Nahtstelle oder einen Trigger, aber nicht automatisch Infrastruktur im MVP.
