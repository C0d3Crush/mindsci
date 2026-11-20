import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import matter from 'gray-matter';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

const db = new Database(path.join(__dirname, 'mindsci.db'));

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
  CREATE INDEX IF NOT EXISTS idx_year ON studies(year);

  CREATE TABLE IF NOT EXISTS tracking_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_key TEXT NOT NULL,
    value REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(feature_key, date)
  );
  CREATE INDEX IF NOT EXISTS idx_tracking_key ON tracking_entries(feature_key, date);
`);

app.get('/api/studies', (req, res) => {
  const { topic, q, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM studies WHERE 1=1';
  const params = [];

  if (topic) {
    query += ' AND topic = ?';
    params.push(topic);
  }
  if (q) {
    query += ' AND (title LIKE ? OR summary LIKE ? OR key_findings LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  query += ' ORDER BY year DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const studies = db.prepare(query).all(...params);
  const total = db.prepare(
    query.replace('SELECT *', 'SELECT COUNT(*) as count').replace(/LIMIT.*$/, '')
  ).get(...params.slice(0, -2));

  res.json({ studies, total: total?.count ?? studies.length });
});

app.get('/api/studies/:id', (req, res) => {
  const study = db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id);
  if (!study) return res.status(404).json({ error: 'Not found' });

  if (study.file_path) {
    const wikiPath = path.join(__dirname, '..', '..', '..', 'wiki', study.file_path);
    if (fs.existsSync(wikiPath)) {
      const raw = fs.readFileSync(wikiPath, 'utf-8');
      const parsed = matter(raw);
      return res.json({ ...study, content: parsed.content });
    }
  }

  res.json(study);
});

app.get('/api/topics', (req, res) => {
  const topics = db.prepare(
    'SELECT topic, COUNT(*) as count FROM studies GROUP BY topic ORDER BY count DESC'
  ).all();
  res.json(topics);
});

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const like = `%${q}%`;
  const results = db.prepare(
    `SELECT * FROM studies
     WHERE title LIKE ? OR summary LIKE ? OR key_findings LIKE ? OR authors LIKE ?
     ORDER BY year DESC LIMIT 20`
  ).all(like, like, like, like);

  res.json(results);
});

// Tracking API
app.get('/api/tracking/:feature_key', (req, res) => {
  const { feature_key } = req.params;
  const since = new Date();
  since.setDate(since.getDate() - 28);
  const entries = db.prepare(
    `SELECT * FROM tracking_entries WHERE feature_key = ? AND date >= ? ORDER BY date ASC`
  ).all(feature_key, since.toISOString().slice(0, 10));
  res.json(entries);
});

app.post('/api/tracking/:feature_key', (req, res) => {
  const { feature_key } = req.params;
  const { value, date } = req.body;
  if (value == null || !date) return res.status(400).json({ error: 'value and date required' });
  db.prepare(
    `INSERT INTO tracking_entries (feature_key, value, date) VALUES (?, ?, ?)
     ON CONFLICT(feature_key, date) DO UPDATE SET value = excluded.value`
  ).run(feature_key, Number(value), date);
  const entry = db.prepare('SELECT * FROM tracking_entries WHERE feature_key = ? AND date = ?').get(feature_key, date);
  res.json(entry);
});

app.listen(PORT, () => console.log(`MindSci Backend läuft auf Port ${PORT}`));
