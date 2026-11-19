import Anthropic from '@anthropic-ai/sdk';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIKI_DIR = path.join(__dirname, '..', 'wiki');
const DB_PATH = path.join(__dirname, '..', 'mindsci-app', 'backend', 'mindsci.db');

const TOPICS = [
  'Depression',
  'Angststörungen',
  'Schlaf & mentale Gesundheit',
  'Mindfulness & Meditation',
  'Sport & mentale Gesundheit',
  'Soziale Verbindung & Einsamkeit',
  'Stress & Cortisol',
  'Kognitive Verhaltenstherapie',
  'Ernährung & mentale Gesundheit',
  'Digitales Wohlbefinden',
];

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getDb() {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS studies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      authors TEXT,
      year INTEGER,
      journal TEXT,
      topic TEXT NOT NULL,
      summary TEXT,
      key_findings TEXT,
      study_type TEXT,
      url TEXT,
      doi TEXT,
      file_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_topic ON studies(topic);
  `);
  return db;
}

function studyExists(db, title) {
  return db.prepare('SELECT id FROM studies WHERE title = ?').get(title);
}

function saveStudy(db, study, topic) {
  const id = uuidv4();
  const fileName = `${id}.md`;
  const filePath = path.join(WIKI_DIR, fileName);

  const frontmatter = [
    '---',
    `id: ${id}`,
    `title: "${study.title.replace(/"/g, '\\"')}"`,
    `authors: "${(study.authors || '').replace(/"/g, '\\"')}"`,
    `year: ${study.year || 'null'}`,
    `journal: "${(study.journal || '').replace(/"/g, '\\"')}"`,
    `topic: "${topic}"`,
    `study_type: "${study.study_type || ''}"`,
    `url: "${study.url || ''}"`,
    `doi: "${study.doi || ''}"`,
    '---',
    '',
    `# ${study.title}`,
    '',
    '## Zusammenfassung',
    '',
    study.summary || '',
    '',
    '## Kernerkenntnisse',
    '',
    study.key_findings || '',
    '',
  ].join('\n');

  fs.writeFileSync(filePath, frontmatter, 'utf-8');

  db.prepare(`
    INSERT OR IGNORE INTO studies
      (id, title, authors, year, journal, topic, summary, key_findings, study_type, url, doi, file_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    study.title,
    study.authors || null,
    study.year || null,
    study.journal || null,
    topic,
    study.summary || null,
    study.key_findings || null,
    study.study_type || null,
    study.url || null,
    study.doi || null,
    fileName,
  );

  return id;
}

async function collectForTopic(db, topic) {
  console.log(`\n📚 Sammle Studien für: ${topic}`);

  const prompt = `Recherchiere 3 aktuelle, peer-reviewed wissenschaftliche Studien zum Thema "${topic}" und mentale Gesundheit (bevorzugt aus den letzten 3 Jahren).

Antworte NUR mit einem JSON-Array, kein Fließtext davor oder danach. Format:
[
  {
    "title": "Vollständiger Studientitel auf Englisch",
    "authors": "Nachname et al.",
    "year": 2024,
    "journal": "Zeitschriftenname",
    "study_type": "RCT | Meta-Analyse | Kohortenstudie | Review | ...",
    "url": "https://... oder leer",
    "doi": "10.xxxx/... oder leer",
    "summary": "2-3 Sätze auf Deutsch: Was wurde untersucht, wie groß war die Studie, was kam heraus.",
    "key_findings": "Konkrete Zahlen und Effektgrößen auf Deutsch, z.B. '42% Reduktion der Depressionssymptome (p<0.001), Cohen's d=0.8'"
  }
]

Nur real existierende Studien. Falls keine aktuellen gefunden werden, gib ältere (ab 2020) an.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();

  let studies;
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Kein JSON-Array gefunden');
    studies = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`  ✗ JSON-Fehler für ${topic}:`, err.message);
    return 0;
  }

  let saved = 0;
  for (const study of studies) {
    if (!study.title) continue;
    if (studyExists(db, study.title)) {
      console.log(`  → Bereits vorhanden: ${study.title.slice(0, 60)}...`);
      continue;
    }
    saveStudy(db, study, topic);
    console.log(`  ✓ Gespeichert: ${study.title.slice(0, 60)}...`);
    saved++;
  }

  return saved;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Fehler: ANTHROPIC_API_KEY nicht gesetzt. Siehe scheduler/.env.example');
    process.exit(1);
  }

  if (!fs.existsSync(WIKI_DIR)) fs.mkdirSync(WIKI_DIR, { recursive: true });

  const db = getDb();
  const topicsToCollect = process.argv[2]
    ? TOPICS.filter(t => t.toLowerCase().includes(process.argv[2].toLowerCase()))
    : TOPICS;

  console.log(`\n🧠 MindSci Scheduler — ${new Date().toLocaleDateString('de-DE')}`);
  console.log(`Sammle Studien für ${topicsToCollect.length} Topics...\n`);

  let totalSaved = 0;
  for (const topic of topicsToCollect) {
    try {
      const count = await collectForTopic(db, topic);
      totalSaved += count;
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ✗ Fehler bei ${topic}:`, err.message);
    }
  }

  db.close();
  console.log(`\n✅ Fertig. ${totalSaved} neue Studien gespeichert.`);
}

main().catch(console.error);
