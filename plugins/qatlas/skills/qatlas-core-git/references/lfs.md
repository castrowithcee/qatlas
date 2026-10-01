---
description: >
  Über Git LFS für große oder häufig geänderte Binärdateien nach Repo-Policy entscheiden.
license: MIT
type: rule
edit: locked
---

# Git LFS

Entscheide über Git LFS nach Repo-Policy, Dateigröße und Änderungshäufigkeit. Eine vorhandene Zuordnung in
`.gitattributes` oder eine Vorgabe der Projektanweisungen gilt. Kleine, selten geänderte Binärdateien wie
Icons sind ohne solche Vorgabe nicht LFS-pflichtig. Große oder häufig geänderte Binärdateien gehören in Git
LFS oder einen Dateispeicher.

Prüfe vor LFS-Nutzung, ob `git-lfs` installiert ist. Wenn nicht, nenne die Voraussetzung, dass es auf jedem
Gerät vorhanden sein muss. Die Pfadzuordnung liegt in `.gitattributes` und reist mit dem Repo. Führe LFS
nicht eigenmächtig neu ein; eine Migration bestehender Dateien in LFS kann Historie umschreiben und folgt
dann [Historie](history.md).
