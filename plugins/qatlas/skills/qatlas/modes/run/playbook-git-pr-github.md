---
description: >
  GitHub-Helfer für die Integration über Pull Requests, wenn das Ziel-Repo auf GitHub liegt und gh verfügbar
  ist: Zugang, Warten auf CI mit ci-wait, Landen mit land, Branch-Aktualisierung und Merge Queue.
---

# Pull Requests auf GitHub

Führe die Plattformschritte der [Integration über Pull Requests](playbook-git-pr.md) auf GitHub mit diesen
Helfern der Lauf-Werkzeuge `<tools>` aus.

- **Zugang:** Prüfe mit `gh auth status`, dass das Login im Ziel-Repo pushen, Pull Requests öffnen und mergen
  darf; Leads und Integrator nutzen dasselbe Login. Öffne den Pull Request mit `gh pr create`.
- **Auf CI warten:** `<tools> ci-wait --pr <n>`. Exit 8 bedeutet, dass das Projekt keine CI hat.
- **Landen:** `<tools> land --pr <n> --report <file>`, mit `--repo <code-repo>` für Code außerhalb des
  Kontrollverzeichnisses. `land` prüft den Head, wartet wie `ci-wait` auf CI, führt per Squash-Merge
  zusammen, belegt den Squash und löscht den Remote-Branch; nutze sein `proof`-Ergebnis als Squash-Nachweis
  für das Aufräumen lokaler Worktrees und Branches. Bei Exit 8 (`no-ci`) bestätige den gemergten Stand, wie
  das Landen ohne CI es verlangt, und rufe `land … --no-ci` auf.
- **Aktueller Stand:** Verlangt der Branch-Schutz ihn, ziehe mit `gh pr update-branch <n>` nach; `land`
  akzeptiert dann den Remote-Head.
- **Merge Queue:** Ist sie aktiv, nutze nicht `land`: Reihe den Pull Request ein und lösche den Remote-Branch
  nach dem Merge durch die Queue mit `git push origin --delete <branch>`.
