# MindSci

Wissenschafts-Wiki für mentale Gesundheit. Sammelt automatisch peer-reviewed Studien via Claude API und stellt sie durchsuchbar dar.

## Befehle

```bash
# Root-Verzeichnis
npm install
npm run install-all   # alle Abhängigkeiten
npm run dev           # Backend + Frontend
npm run collect       # Scheduler manuell ausführen
```

- Backend:  http://localhost:5002
- Frontend: http://localhost:5175

## Datenbank

`mindsci-app/backend/mindsci.db` (SQLite)

Tabelle `studies`:
- id, title, authors, year, journal, topic, summary, key_findings, study_type, url, doi, file_path, created_at

## API

Basis-URL: `http://localhost:5002/api`

| Method | Pfad | Beschreibung |
|---|---|---|
| GET | /studies | Alle Studien (optional ?topic=&q=) |
| GET | /studies/:id | Einzelne Studie |
| GET | /topics | Alle Topics mit Anzahl |
| GET | /search?q= | Volltextsuche |

## Scheduler

`scheduler/collect-studies.js` — Ruft Claude API auf, sucht aktuelle Studien zu vordefinierten Topics und speichert sie als Markdown + SQLite-Einträge.

```bash
cd scheduler && cp .env.example .env  # ANTHROPIC_API_KEY eintragen
node collect-studies.js               # einmalig ausführen
```

## Themen (Topics)

- Depression
- Angststörungen
- Schlaf & mentale Gesundheit
- Mindfulness & Meditation
- Sport & mentale Gesundheit
- Soziale Verbindung & Einsamkeit
- Stress & Cortisol
- Kognitive Verhaltenstherapie
- Ernährung & mentale Gesundheit
- Digitales Wohlbefinden
