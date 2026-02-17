import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, '..', 'mock-data.db')

let db = null

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath, { readonly: true })
  }
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

// AI Usage Summary nach Tag/Monat/Jahr aus SQLite abrufen
export function getAIUsageSummaryByDay(filters = {}) {
  const database = getDatabase()
  let query = 'SELECT * FROM ai_usage_summary_by_day WHERE 1=1'
  const params = []

  if (filters.from_date) {
    query += ' AND createDate >= ?'
    params.push(filters.from_date)
  }

  if (filters.to_date) {
    query += ' AND createDate <= ?'
    params.push(filters.to_date)
  }

  if (filters.tag) {
    query += ' AND tag = ?'
    params.push(filters.tag)
  }

  if (filters.model) {
    query += ' AND model = ?'
    params.push(filters.model)
  }

  if (filters.modelType) {
    query += ' AND type = ?'
    params.push(filters.modelType)
  }

  if (filters.apiKeyId) {
    query += ' AND apiKeyId = ?'
    params.push(filters.apiKeyId)
  }

  if (filters.userId) {
    query += ' AND technicalUserId = ?'
    params.push(filters.userId)
  }

  query += ' ORDER BY year, month, day'

  const rows = database.prepare(query).all(...params)
  return rows
}

// AI Usage Summary nach Tag gruppiert aus SQLite abrufen
export function getAIUsageSummaryByTag(filters = {}) {
  const database = getDatabase()
  let query = `
    SELECT 
      tag,
      type,
      SUM(requests) as requests,
      SUM(tokensIn) as tokensIn,
      SUM(tokensOut) as tokensOut,
      SUM(requestTokens) as requestTokens,
      SUM(responseTokens) as responseTokens,
      SUM(cost) as cost,
      COUNT(*) as count
    FROM ai_usage_summary_by_day
    WHERE 1=1
  `
  const params = []

  if (filters.from_date) {
    query += ' AND createDate >= ?'
    params.push(filters.from_date)
  }

  if (filters.to_date) {
    query += ' AND createDate <= ?'
    params.push(filters.to_date)
  }

  if (filters.tag) {
    query += ' AND tag = ?'
    params.push(filters.tag)
  }

  if (filters.model) {
    query += ' AND model = ?'
    params.push(filters.model)
  }

  if (filters.modelType) {
    query += ' AND type = ?'
    params.push(filters.modelType)
  }

  if (filters.apiKeyId) {
    query += ' AND apiKeyId = ?'
    params.push(filters.apiKeyId)
  }

  if (filters.userId) {
    query += ' AND technicalUserId = ?'
    params.push(filters.userId)
  }

  query += ' AND tag IS NOT NULL AND tag != "" GROUP BY tag ORDER BY requests DESC'

  const rows = database.prepare(query).all(...params)
  return rows
}

// Extraction Usage Summary nach Tag gruppiert aus SQLite abrufen
export function getExtractionUsageSummaryByTag(filters = {}) {
  const database = getDatabase()
  let query = `
    SELECT 
      tag,
      SUM(operations) as operations,
      SUM(totalPages) as totalPages,
      AVG(averageConfidence) as averageConfidence,
      SUM(cost) as cost,
      COUNT(*) as count
    FROM extraction_usage_summary_by_day
    WHERE 1=1
  `
  const params = []

  if (filters.from_date) {
    query += ' AND createDate >= ?'
    params.push(filters.from_date)
  }

  if (filters.to_date) {
    query += ' AND createDate <= ?'
    params.push(filters.to_date)
  }

  if (filters.tag) {
    query += ' AND tag = ?'
    params.push(filters.tag)
  }

  if (filters.provider) {
    query += ' AND provider = ?'
    params.push(filters.provider)
  }

  if (filters.modelId) {
    query += ' AND modelId = ?'
    params.push(filters.modelId)
  }

  if (filters.apiKeyId) {
    query += ' AND apiKeyId = ?'
    params.push(filters.apiKeyId)
  }

  if (filters.userId) {
    query += ' AND technicalUserId = ?'
    params.push(filters.userId)
  }

  query += ' AND tag IS NOT NULL AND tag != "" GROUP BY tag ORDER BY operations DESC'

  const rows = database.prepare(query).all(...params)
  return rows
}

// AI Usage Summary nach API Key aus SQLite abrufen
export function getAIUsageSummaryByApiKey(filters = {}) {
  const database = getDatabase()
  let query = 'SELECT * FROM ai_usage_summary_by_apikey WHERE 1=1'
  const params = []

  if (filters.from_date) {
    query += ' AND createDate >= ?'
    params.push(filters.from_date)
  }

  if (filters.to_date) {
    query += ' AND createDate <= ?'
    params.push(filters.to_date)
  }

  if (filters.tag) {
    query += ' AND tag = ?'
    params.push(filters.tag)
  }

  if (filters.model) {
    query += ' AND model = ?'
    params.push(filters.model)
  }

  if (filters.modelType) {
    query += ' AND type = ?'
    params.push(filters.modelType)
  }

  if (filters.apiKeyId) {
    query += ' AND apiKeyId = ?'
    params.push(filters.apiKeyId)
  }

  if (filters.userId) {
    query += ' AND technicalUserId = ?'
    params.push(filters.userId)
  }

  query += ' ORDER BY apiKeyId, year, month, day'

  const rows = database.prepare(query).all(...params)
  return rows
}

// Extraction Usage Summary nach Tag/Monat/Jahr aus SQLite abrufen
export function getExtractionUsageSummaryByDay(filters = {}) {
  const database = getDatabase()
  let query = 'SELECT * FROM extraction_usage_summary_by_day WHERE 1=1'
  const params = []

  if (filters.from_date) {
    query += ' AND createDate >= ?'
    params.push(filters.from_date)
  }

  if (filters.to_date) {
    query += ' AND createDate <= ?'
    params.push(filters.to_date)
  }

  if (filters.provider) {
    query += ' AND provider = ?'
    params.push(filters.provider)
  }

  if (filters.modelId) {
    query += ' AND modelId = ?'
    params.push(filters.modelId)
  }

  if (filters.tag) {
    query += ' AND tag = ?'
    params.push(filters.tag)
  }

  if (filters.apiKeyId) {
    query += ' AND apiKeyId = ?'
    params.push(filters.apiKeyId)
  }

  if (filters.userId) {
    query += ' AND technicalUserId = ?'
    params.push(filters.userId)
  }

  query += ' ORDER BY year, month, day'

  const rows = database.prepare(query).all(...params)
  return rows
}

// AI Usage Summary nach Tag gruppiert aus SQLite abrufen
export function getAIUsageSummaryByTag(filters = {}) {
  const database = getDatabase()
  let query = `
    SELECT 
      tag,
      type,
      SUM(requests) as requests,
      SUM(tokensIn) as tokensIn,
      SUM(tokensOut) as tokensOut,
      SUM(requestTokens) as requestTokens,
      SUM(responseTokens) as responseTokens,
      SUM(cost) as cost,
      COUNT(*) as count
    FROM ai_usage_summary_by_day
    WHERE 1=1
  `
  const params = []

  if (filters.from_date) {
    query += ' AND createDate >= ?'
    params.push(filters.from_date)
  }

  if (filters.to_date) {
    query += ' AND createDate <= ?'
    params.push(filters.to_date)
  }

  if (filters.tag) {
    query += ' AND tag = ?'
    params.push(filters.tag)
  }

  if (filters.model) {
    query += ' AND model = ?'
    params.push(filters.model)
  }

  if (filters.modelType) {
    query += ' AND type = ?'
    params.push(filters.modelType)
  }

  if (filters.apiKeyId) {
    query += ' AND apiKeyId = ?'
    params.push(filters.apiKeyId)
  }

  if (filters.userId) {
    query += ' AND technicalUserId = ?'
    params.push(filters.userId)
  }

  query += ' AND tag IS NOT NULL AND tag != "" GROUP BY tag ORDER BY requests DESC'

  const rows = database.prepare(query).all(...params)
  return rows
}

// Extraction Usage Summary nach Tag gruppiert aus SQLite abrufen
export function getExtractionUsageSummaryByTag(filters = {}) {
  const database = getDatabase()
  let query = `
    SELECT 
      tag,
      SUM(operations) as operations,
      SUM(totalPages) as totalPages,
      AVG(averageConfidence) as averageConfidence,
      SUM(cost) as cost,
      COUNT(*) as count
    FROM extraction_usage_summary_by_day
    WHERE 1=1
  `
  const params = []

  if (filters.from_date) {
    query += ' AND createDate >= ?'
    params.push(filters.from_date)
  }

  if (filters.to_date) {
    query += ' AND createDate <= ?'
    params.push(filters.to_date)
  }

  if (filters.tag) {
    query += ' AND tag = ?'
    params.push(filters.tag)
  }

  if (filters.provider) {
    query += ' AND provider = ?'
    params.push(filters.provider)
  }

  if (filters.modelId) {
    query += ' AND modelId = ?'
    params.push(filters.modelId)
  }

  if (filters.apiKeyId) {
    query += ' AND apiKeyId = ?'
    params.push(filters.apiKeyId)
  }

  if (filters.userId) {
    query += ' AND technicalUserId = ?'
    params.push(filters.userId)
  }

  query += ' AND tag IS NOT NULL AND tag != "" GROUP BY tag ORDER BY operations DESC'

  const rows = database.prepare(query).all(...params)
  return rows
}
