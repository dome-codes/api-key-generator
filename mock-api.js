import cors from 'cors'
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import * as mockData from './mock-data.js'

// Mock API verwendet nur hardcodierte Daten aus mock-data.js
// Keine Kostenberechnung hier - das macht das Frontend!

const app = express()
const port = 3001

app.use(cors())
app.use(express.json())

// JWT Token Validierung (Mock)
function validateToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[${new Date().toISOString()}] ❌ Kein Bearer Token gefunden`)
    return res.status(401).json({ error: 'Kein gültiger Bearer Token' })
  }

  const token = authHeader.substring(7)

  // JWT Token Parsing
  try {
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      console.log(`[${new Date().toISOString()}] ❌ Ungültiges JWT-Format`)
      return res.status(401).json({ error: 'Ungültiges JWT-Format' })
    }

    // Payload dekodieren
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())

    // Token-Ablauf prüfen
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      console.log(`[${new Date().toISOString()}] ❌ Token ist abgelaufen`)
      return res.status(401).json({ error: 'Token ist abgelaufen' })
    }

    // Rollen aus groups claim extrahieren
    let userRoles = []

    if (payload.groups && Array.isArray(payload.groups)) {
      userRoles = payload.groups
        .map((group) => group.replace(/^\//, ''))
        .filter(
          (group) => group === 'API-Admin' || group === 'API-Default' || group === 'API-Stream',
        )
    }

    // Mock-Token für verschiedene Rollen
    let mockTokenData = {
      sub: payload.sub || 'user-123',
      email: payload.email || 'admin@example.com',
      name: payload.name || 'Admin User',
      family_name: payload.family_name || 'User',
      given_name: payload.given_name || 'Admin',
      preferred_username: payload.preferred_username || 'admin',
      groups: userRoles.length > 0 ? userRoles : ['API-Admin'],
    }

    // Token aus Query-Parameter für Testing
    if (req.query.token) {
      const tokenType = req.query.token
      if (tokenType === 'admin') {
        mockTokenData.groups = ['API-Admin']
      } else if (tokenType === 'default') {
        mockTokenData.groups = ['API-Default']
      } else if (tokenType === 'stream') {
        mockTokenData.groups = ['API-Stream']
      }
    }

    console.log(`[${new Date().toISOString()}] ✅ JWT Token validiert:`, {
      userId: mockTokenData.sub,
      email: mockTokenData.email,
      groups: mockTokenData.groups,
    })

    req.user = mockTokenData
    next()
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ JWT Token Parsing Fehler:`, error)
    return res.status(401).json({ error: 'Ungültiger Token' })
  }
}

// Rollen-basierte Berechtigungsprüfung
function requireRole(requiredRoles) {
  return (req, res, next) => {
    const userGroups = req.user.groups || []
    const allUserRoles = [...userGroups]

    const hasRequiredRole = requiredRoles.some((role) => allUserRoles.includes(role))

    if (!hasRequiredRole) {
      return res.status(403).json({
        error: 'Keine ausreichenden Berechtigungen',
        required: requiredRoles,
        userRoles: allUserRoles,
      })
    }

    next()
  }
}

// In-Memory-Datenbank für API Keys
const apiKeys = {}

// Lade hardcodierte API Keys
mockData.MOCK_API_KEYS.forEach((key) => {
  apiKeys[key.id] = {
    ...key,
    secret:
      'dk_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15),
  }
})

console.log(
  `[MOCK-API] Initialized with ${Object.keys(apiKeys).length} hardcoded API keys:`,
  Object.keys(apiKeys),
)

// Hilfsfunktionen
function generateApiKey() {
  return (
    'dk_' +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

function createApiKeyObject(name, permissions, userId = null) {
  const now = new Date()
  const expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

  return {
    id: uuidv4(),
    name: name,
    permissions: permissions,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    is_active: true,
    secret: generateApiKey(),
    user_id: userId,
  }
}

// API Endpunkte

// POST /v1/apikeys - Create a new API token
app.post('/v1/apikeys', validateToken, (req, res) => {
  const { name, permissions } = req.body
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Creating new API key with name: "${name}"`)

  if (!name || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({
      error: 'Invalid request. Name and permissions array are required.',
    })
  }

  const apiKey = createApiKeyObject(name, permissions, userId)
  apiKeys[apiKey.id] = apiKey

  console.log(`[${timestamp}] API key created successfully with ID: ${apiKey.id}`)

  res.status(201).json({
    id: apiKey.id,
    name: apiKey.name,
    permissions: apiKey.permissions,
    created_at: apiKey.created_at,
    expires_at: apiKey.expires_at,
    is_active: apiKey.is_active,
    secret: apiKey.secret,
  })
})

// GET /v1/apikeys - List all API tokens for the current user
app.get('/v1/apikeys', validateToken, (req, res) => {
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Listing API keys for user: ${userId}`)

  const userRoles = req.user.groups || []
  const isAdmin = userRoles.includes('API-Admin')

  let keys
  if (isAdmin) {
    keys = Object.values(apiKeys)
    console.log(`[${timestamp}] Admin access - showing all ${keys.length} API keys`)
  } else {
    keys = Object.values(apiKeys).filter((key) => key.user_id === userId)
    console.log(`[${timestamp}] User access - showing ${keys.length} API keys for user ${userId}`)
  }

  const responseKeys = keys.map((key) => ({
    id: key.id,
    name: key.name,
    permissions: key.permissions,
    created_at: key.created_at,
    expires_at: key.expires_at,
    is_active: key.is_active,
  }))

  res.status(200).json(responseKeys)
})

// GET /v1/usage/ai - Get AI usage data
app.get('/v1/usage/ai', validateToken, (req, res) => {
  const { from_date, to_date } = req.query
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Getting AI usage data for user: ${userId}`)

  // Verwende hardcodierte Usage-Daten
  let mockUsage = [...mockData.MOCK_USAGE_DATA]

  // Filter by date range if provided
  let filteredUsage = mockUsage
  if (from_date || to_date) {
    filteredUsage = mockUsage.filter((usage) => {
      const usageDate = usage.createDate
        ? new Date(usage.createDate)
        : new Date(usage.year, usage.month - 1, usage.day)
      const from = from_date ? new Date(from_date) : new Date(0)
      const to = to_date ? new Date(to_date) : new Date()
      return usageDate >= from && usageDate <= to
    })
  }

  console.log(`[${timestamp}] Returning ${filteredUsage.length} usage records`)

  res.status(200).json({
    usage: filteredUsage,
  })
})

// GET /v1/usage/ai/summarize - Get usage summary
app.get('/v1/usage/ai/summarize', validateToken, (req, res) => {
  const { from_date, to_date, by } = req.query
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Getting AI usage summary for user: ${userId}`)

  // Verwende hardcodierte gruppierte Usage-Daten
  let mockUsage = []

  if (by === 'apikey') {
    // Gruppiert nach API Key (für Progress Bar)
    mockUsage = [...mockData.MOCK_USAGE_SUMMARY_BY_APIKEY]
    console.log(
      `[${timestamp}] Returning usage summary grouped by API Key: ${mockUsage.length} records`,
    )
  } else {
    // Standard: Alle detaillierten Daten
    mockUsage = [...mockData.MOCK_USAGE_DATA]
    console.log(`[${timestamp}] Returning detailed usage data: ${mockUsage.length} records`)
  }

  // Filter by date range if provided
  let filteredUsage = mockUsage
  if (from_date || to_date) {
    filteredUsage = mockUsage.filter((usage) => {
      const usageDate = usage.createDate
        ? new Date(usage.createDate)
        : new Date(usage.year, usage.month - 1, usage.day)
      const from = from_date ? new Date(from_date) : new Date(0)
      const to = to_date ? new Date(to_date) : new Date()
      return usageDate >= from && usageDate <= to
    })
  }

  console.log(`[${timestamp}] Returning ${filteredUsage.length} usage records`)

  res.status(200).json({
    usage: filteredUsage,
  })
})

// Admin Endpunkte

// GET /v1/admin/usage/ai - Get all usage data (Admin only)
app.get('/v1/admin/usage/ai', validateToken, requireRole(['API-Admin']), (req, res) => {
  const { from_date, to_date } = req.query
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting all AI usage data`)

  // Verwende hardcodierte Usage-Daten für Admin
  const mockUsage = [...mockData.MOCK_USAGE_DATA]

  // Filter by date range if provided
  let filteredUsage = mockUsage
  if (from_date || to_date) {
    filteredUsage = mockUsage.filter((usage) => {
      const usageDate = usage.createDate
        ? new Date(usage.createDate)
        : new Date(usage.year, usage.month - 1, usage.day)
      const from = from_date ? new Date(from_date) : new Date(0)
      const to = to_date ? new Date(to_date) : new Date()
      return usageDate >= from && usageDate <= to
    })
  }

  res.status(200).json({
    usage: filteredUsage,
  })
})

// GET /v1/admin/usage/ai/summarize - Get usage summary for all users (Admin only)
app.get('/v1/admin/usage/ai/summarize', validateToken, requireRole(['API-Admin']), (req, res) => {
  const { from_date, to_date, by, model, technicalUserId } = req.query
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting AI usage summary`)

  // Verwende hardcodierte gruppierte Usage-Daten für Admin
  let mockUsage = []

  if (by === 'apikey') {
    // Gruppiert nach API Key (für Progress Bar)
    mockUsage = [...mockData.MOCK_USAGE_SUMMARY_BY_APIKEY]
    console.log(
      `[${timestamp}] Admin: Returning usage summary grouped by API Key: ${mockUsage.length} records`,
    )
  } else {
    // Standard: Alle detaillierten Daten
    mockUsage = [...mockData.MOCK_USAGE_DATA]
    console.log(`[${timestamp}] Admin: Returning detailed usage data: ${mockUsage.length} records`)
  }

  // Filter by technicalUserId if specified
  if (technicalUserId) {
    mockUsage = mockUsage.filter((item) => item.technicalUserId === technicalUserId)
  }

  // Filter by model if specified
  if (model) {
    mockUsage = mockUsage.filter((item) => item.model === model)
  }

  console.log(`[${timestamp}] Admin summary data - Total records: ${mockUsage.length}`)

  res.status(200).json({
    usage: mockUsage,
  })
})

// Server starten
app.listen(port, () => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ========================================`)
  console.log(`[${timestamp}] Mock API Server gestartet`)
  console.log(`[${timestamp}] Server läuft auf http://localhost:${port}`)
  console.log(`[${timestamp}] ========================================`)
  console.log(`[${timestamp}] Verfügbare Endpunkte:`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/apikeys - List API keys`)
  console.log(`[${timestamp}]   POST http://localhost:${port}/v1/apikeys - Create API key`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/usage/ai - Get usage data`)
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/usage/ai/summarize - Get usage summary`,
  )
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/admin/usage/ai - Get all usage data`,
  )
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/admin/usage/ai/summarize - Admin usage summary`,
  )
  console.log(`[${timestamp}] ========================================`)
})
