---
description: >
  Orchestra-Datei für Qatlas Run anlegen, um eine Host-Sektion ergänzen oder ihre Modelle und
  Effort-Stufen prüfen und aktualisieren.
type: playbook
edit: locked
license: MIT
---

# Orchestrierung einrichten

Die kommentierte Vorlage ist [die
Orchestra-Vorlage](../../../store/config/orchestra.example.yaml); `null` bei einem Modellwert markiert dort
einen Platzhalter, `effort: null` dagegen ein Modell ohne Effort-Unterstützung. Die Claude-Code-Vorlage
schlägt Haiku, Sonnet und Opus für `light`, `standard` und `demanding` vor. Fehlt die Nutzerdatei, lies die
Vorlage und ermittle die für den aktuellen Host verfügbaren Modell-IDs beziehungsweise nativen Aliase und
Effort-Stufen. Zeige eine konkret ausgefüllte Fassung mit nur diesem Host und frage, ob du sie dort anlegen
sollst. Schreibe keine Platzhalter; sind Werte nicht prüfbar, frage nach ihnen. Lege die Datei erst nach
Zustimmung an. Ohne Datei und ohne Zustimmung beginne keinen Task; die Modellgrenzen wären nicht belegt.

Prüfe bei einer vorhandenen Datei Format, Host, die drei beschriebenen Profile, Orchestrator-Modell und
alle gewählten Worker-Profile. Akzeptiere als Modellwerte nur vom Host unterstützte IDs oder native Aliase;
deute bloße Familiennamen nicht selbst als Aliase. Fehlt die Sektion des aktuellen Hosts, schlage ihre
konkret ausgefüllte Ergänzung vor und ändere die Nutzerdatei erst nach Zustimmung; beginne bis dahin keinen
Task. Prüfe die eingetragenen Modelle
und Effort-Stufen gegen die aktuell im Host verfügbare Auswahl; verifiziere zweifelhafte oder neue Modelle
anhand aktueller offizieller Host-Angaben. Ist ein Eintrag veraltet oder ist ein neues Modell für ein Profil
plausibel besser, schlage die konkrete Änderung mit Grund vor. Ändere die nutzereigene Datei nur nach
Zustimmung. Ein neues Modell ersetzt einen gültigen Eintrag nicht still. Ein ungültiges Orchestrator-Modell
oder ein für den nötigen Auftrag nicht nutzbares Profil stoppt vor der Task-Beanspruchung; andere gültige
Profile bleiben nutzbar. Behaupte keine Prüfung der Modellverfügbarkeit, die der Host nicht erlaubt.

