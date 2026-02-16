import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, unlinkSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, '..', 'mock-data.db')

// Lösche alte Datenbank falls vorhanden
if (existsSync(dbPath)) {
  console.log('Lösche alte Datenbank...')
  unlinkSync(dbPath)
}

const db = new Database(dbPath)
console.log('SQLite Datenbank erstellt:', dbPath)

// Erstelle Tabellen
db.exec(`
  -- AI Usage Summary nach Tag/Monat/Jahr
  CREATE TABLE IF NOT EXISTS ai_usage_summary_by_day (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    tag TEXT,
    model TEXT,
    apiKeyId TEXT,
    requestTokens INTEGER,
    responseTokens INTEGER,
    tokensIn INTEGER,
    tokensOut INTEGER,
    technicalUserId TEXT,
    createDate TEXT NOT NULL,
    requests INTEGER,
    cost REAL,
    day INTEGER,
    month INTEGER,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- AI Usage Summary nach API Key
  CREATE TABLE IF NOT EXISTS ai_usage_summary_by_apikey (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    tag TEXT,
    model TEXT,
    apiKeyId TEXT NOT NULL,
    requestTokens INTEGER,
    responseTokens INTEGER,
    tokensIn INTEGER,
    tokensOut INTEGER,
    technicalUserId TEXT,
    createDate TEXT NOT NULL,
    requests INTEGER,
    cost REAL,
    day INTEGER,
    month INTEGER,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Extraction Usage Summary nach Tag/Monat/Jahr
  CREATE TABLE IF NOT EXISTS extraction_usage_summary_by_day (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT,
    tag TEXT,
    operations INTEGER,
    totalPages INTEGER,
    averageConfidence REAL,
    cost REAL,
    technicalUserId TEXT,
    apiKeyId TEXT,
    createDate TEXT NOT NULL,
    day INTEGER,
    month INTEGER,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Indizes für bessere Performance
  CREATE INDEX IF NOT EXISTS idx_ai_day_date ON ai_usage_summary_by_day(year, month, day);
  CREATE INDEX IF NOT EXISTS idx_ai_day_createDate ON ai_usage_summary_by_day(createDate);
  CREATE INDEX IF NOT EXISTS idx_ai_apikey_id ON ai_usage_summary_by_apikey(apiKeyId);
  CREATE INDEX IF NOT EXISTS idx_ai_apikey_date ON ai_usage_summary_by_apikey(year, month, day);
  CREATE INDEX IF NOT EXISTS idx_extraction_day_date ON extraction_usage_summary_by_day(year, month, day);
  CREATE INDEX IF NOT EXISTS idx_extraction_day_createDate ON extraction_usage_summary_by_day(createDate);
`)

console.log('✅ Tabellen und Indizes erstellt')

db.close()
console.log('✅ Datenbank initialisiert')
