---
description: >
  Aktuelle GitHub-Besonderheiten für Issues und Projects: selektiver Kontextabruf, gh-Zugang, Tokenwahl,
  getrennte REST- und GraphQL-Limits, gebündelte Mutationen und nicht pauschal automatisierbare Konfiguration.
source: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects
updated: 2026-08-14
license: MIT
type: fact
edit: locked
---

# GitHub Issues und Projects

Nutze Issues als ausführbare Arbeitseinträge. Project-Drafts eignen sich für unausgereifte Ideen, bis ihr
Taskvertrag reif genug für ein Issue ist. Ein GitHub Project ist Übersicht und Feldmodell; die Issue-Bodies
tragen den eigenständig ausführbaren Kontext.

## Aktueller Kontext und Historie

- Behandle Titel und Issue-Body als maßgeblichen aktuellen Taskvertrag. Halte dort nur weiterhin gültigen
  Scope, Entscheidungen, Stand, Abnahme und die aktuelle Übergabe.
- Nutze Issue-Kommentare für menschliche Kommunikation oder eine bewusst erhaltene Chronologie. Sobald eine
  Antwort bindend wird, arbeite sie in den Body ein; Kommentare dürfen keine Voraussetzung für den nächsten
  Lauf bleiben.
- Lies zur Auswahl nur Project-Felder und knappe Issue-Metadaten. Öffne danach den Body ausgewählter Issues,
  beispielsweise mit `gh issue view <nummer> --json title,body,state,labels`. Verwende `--comments` nicht im
  Normalpfad.
- Bei begründetem Historienbedarf rufe Kommentare paginiert, seit einem bekannten Zeitpunkt oder über eine
  begrenzte GraphQL-Connection wie `comments(last: N)` ab. Der neueste Kommentar allein ist nicht
  maßgeblich; der konsolidierte Body ist es.

## Zugang und geringste Berechtigung

Bevorzuge einen bestehenden, passenden `gh`- oder API-Zugang und prüfe ihn mit `gh auth status`, ohne Tokens
auszugeben. GitHub CLI verlangt für Project-Befehle den Scope `project`. Der Browser- und OAuth-Ablauf von
`gh` hat eine nicht frei reduzierbare Mindestmenge; bei `gh auth login --with-token` nennt die CLI für einen
Classic PAT mindestens `repo`, `read:org` und `gist`. Ergänze nicht vorsorglich weitere Scopes.

Ein Fine-grained PAT ist wegen seiner Repository- und Berechtigungsgrenzen vorzuziehen, wenn der konkrete
Owner und API-Pfad ihn unterstützen. Aktuell unterstützen die REST-Endpunkte für Organisations-Projects
Fine-grained PATs mit Organisationsberechtigung `Projects`; die entsprechenden Endpunkte für
benutzereigene Projects unterstützen sie nicht. Bei einem benutzereigenen privaten Project kann daher ein
dedizierter Classic PAT oder der `gh`-OAuth-Zugang nötig sein. Erkläre diesen Trade-off, wähle den Token-Typ
nicht pauschal und erweitere einen Scope erst nach einem konkreten Berechtigungsfehler.

Speichere Tokens im Credential Store von `gh` oder als geschützte Umgebungsvariable. Übergib sie nicht als
Kommandoargument und schreibe sie nie ins Repo.

## API-Aufteilung

- Verwalte Issue-Inhalte und Metadaten bevorzugt über REST beziehungsweise `gh issue`.
- Löse Project-, Feld-, Options- und Content-Node-IDs einmalig auf.
- GitHub dokumentiert für Projects, dass ein Item zuerst mit `addProjectV2ItemById` hinzugefügt und erst in
  einem folgenden Call mit `updateProjectV2ItemFieldValue` aktualisiert werden kann.
- Bündele danach unabhängige Feldmutationen mit GraphQL-Aliassen in kontrollierten Blöcken. Prüfe die
  Antwort jedes Alias einzeln; ein HTTP-Erfolg bedeutet nicht, dass jede Mutation erfolgreich war.
- Views und einzelne UI-Funktionen sind nicht in jeder API- oder CLI-Version schreibbar. Prüfe die aktuelle
  Capability, bevor du sie automatisierst, und gib sonst eine manuelle UI-Checkliste aus.

## Rate-Limits und Batchgröße

GraphQL hat ein eigenes primäres Budget. Für Nutzer sind es aktuell im Regelfall 5.000 Punkte pro Stunde;
andere Token- und Enterprise-Konstellationen können abweichen. Lies deshalb `x-ratelimit-limit`,
`x-ratelimit-remaining`, `x-ratelimit-used` und `x-ratelimit-reset` aus der Antwort oder nutze das
`rateLimit`-Objekt. Frage den Stand nicht vor jedem Block mit einem separaten Request ab.

Zusätzlich gelten sekundäre Grenzen. GitHub nennt derzeit unter anderem höchstens 100 gleichzeitige Requests
über REST und GraphQL zusammen, 900 REST-Punkte beziehungsweise 2.000 GraphQL-Punkte pro Minute sowie im
Regelfall höchstens 80 inhaltserzeugende Requests pro Minute und 500 pro Stunde. Diese Werte können sich
ohne Vorankündigung ändern. Halte die Concurrency deutlich darunter, nutze kleine bis mittlere Blöcke und
reagiere auf `retry-after` oder Reset-Header. Bei wiederholtem Limitfehler exponentiell warten und mit der
gesicherten Zuordnung fortsetzen; keine Vollmigration blind neu starten.

Für größere Migrationen gilt:

1. Items paginiert in wenigen vollständigen Abfragen lesen.
2. Repository-, Project-, Feld- und Options-IDs genau einmal auflösen und im Lauf wiederverwenden.
3. Issues über REST mit kontrollierter Concurrency erzeugen oder aktualisieren.
4. Items in einem getrennten Schritt dem Project hinzufügen.
5. Status- und andere Project-Felder in gemessenen GraphQL-Batches setzen.
6. Nach jedem Block Fehler, Restbudget und Stichproben prüfen.

## Offizielle Quellen

- GitHub Projects API: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects
- GraphQL-Limits: https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api
- Projects REST und Tokenunterstützung: https://docs.github.com/en/rest/projects/projects
- GitHub CLI Auth: https://cli.github.com/manual/gh_auth_login
- GitHub CLI Projects und Scope: https://cli.github.com/manual/gh_project
- GitHub CLI Issue View: https://cli.github.com/manual/gh_issue_view
- REST Issue Comments: https://docs.github.com/en/rest/issues/comments
- GraphQL Issue: https://docs.github.com/en/graphql/reference/objects#issue

Prüfe diese Quellen vor einer großen Migration erneut. Das Prüfdatum dieser Reference steht im
Frontmatter.
