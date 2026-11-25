---
description: >
  GitHub-Helfer für die Integration über Pull Requests, wenn das Ziel-Repo auf GitHub liegt und gh verfügbar
  ist: Zugang, Landen mit land, Branch-Aktualisierung und Merge Queue.
---

# Pull Requests auf GitHub

Führe die Plattformschritte der [Integration über Pull Requests](playbook-git-pr.md) auf GitHub mit diesen
Helfern der Lauf-Werkzeuge `<tools>` aus.

- **Zugang:** Prüfe mit `gh auth status`, dass das Login im Ziel-Repo pushen, Pull Requests öffnen und mergen
  darf. Leads und Integrator nutzen dasselbe Login. Öffne den Pull Request mit `gh pr create`.
- **Landen:** `<tools> land --pr <n> --report <file>`, mit `--repo <code-repo>` für Code außerhalb des
  Kontrollverzeichnisses. `land` prüft den Head, wartet auf CI, mergt in der Form aus `merge-method` des
  Berichts, belegt sie und löscht den Remote-Branch. Nutze sein `proof`-Ergebnis als Nachweis für das
  Aufräumen lokaler Worktrees und Branches. Bei Exit 8 (`no-ci`) bestätige den gemergten Stand, wie
  das Landen ohne CI es verlangt, und rufe `land … --no-ci` auf. Hast du einen Konflikt selbst gelöst, ergänze
  `--resolved`, damit `land` deinen Merge-Commit der Basis als Head annimmt.
- **Zulässige Formen:** `gh api repos/<owner>/<repo>` liefert sie mit `allow_merge_commit`,
  `allow_squash_merge` und `allow_rebase_merge`.
- **Aktueller Stand:** Verlangt der Branch-Schutz ihn, ziehe mit `gh pr update-branch <n>` nach. Dann
  akzeptiert `land` den Remote-Head.
- **Merge Queue:** Ist sie aktiv, nutze nicht `land`: Reihe den Pull Request ein und lösche den Remote-Branch
  nach dem Merge durch die Queue mit `git push origin --delete <branch>`.
