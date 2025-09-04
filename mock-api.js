import cors from 'cors'
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import * as mockData from './mock-data.js'

// Mock usage data functions
const generateMockUsageData = (userId, startDate = new Date('2025-07-01'), days = 30) => {
  const mockData = []
  const currentDate = new Date(startDate)

  // Available models for different types
  const completionModels = [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'claude-3-sonnet',
    'claude-3-haiku',
  ]

  const embeddingModels = [
    'text-embedding-3-small',
    'text-embedding-3-large',
    'text-embedding-ada-002',
  ]

  const imageModels = ['dall-e-3', 'dall-e-2', 'midjourney-v6']

  // Available tags with different weights for more realistic distribution
  const tags = [
    { name: 'production', weight: 0.4 }, // 40% production
    { name: 'development', weight: 0.25 }, // 25% development
    { name: 'testing', weight: 0.15 }, // 15% testing
    { name: 'staging', weight: 0.1 }, // 10% staging
    { name: 'demo', weight: 0.05 }, // 5% demo
    { name: 'backup', weight: 0.02 }, // 2% backup
    { name: 'archive', weight: 0.015 }, // 1.5% archive
    { name: 'experimental', weight: 0.01 }, // 1% experimental
    { name: 'research', weight: 0.01 }, // 1% research
    { name: 'internal', weight: 0.005 }, // 0.5% internal
  ]

  // Helper function to select tag based on weights
  const selectRandomTag = () => {
    const random = Math.random()
    let cumulativeWeight = 0
    for (const tag of tags) {
      cumulativeWeight += tag.weight
      if (random <= cumulativeWeight) {
        return tag.name
      }
    }
    return tags[0].name // fallback to production
  }

  for (let i = 0; i < days; i++) {
    const day = currentDate.getDate()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()

    // Generate realistic daily usage patterns
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isWeekday = !isWeekend

    // Base multipliers for different days
    const weekdayMultiplier = isWeekday ? 1.2 : 0.6
    const weekendMultiplier = isWeekend ? 0.8 : 1.0

    // CompletionModelUsage - Daily variations with different models and tags
    const completionRequests = Math.floor((Math.random() * 200 + 100) * weekdayMultiplier)
    const completionTokensIn = completionRequests * (Math.random() * 200 + 150)
    const completionTokensOut = completionTokensIn * (Math.random() * 0.4 + 0.3)

    // Generate createDate for detailed usage
    const createDate = new Date(
      year,
      month - 1,
      day,
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60),
    )

    // Random model and tag for completion
    const completionModel = completionModels[Math.floor(Math.random() * completionModels.length)]
    const completionTag = selectRandomTag()

    mockData.push({
      type: 'CompletionModelUsage',
      requests: completionRequests,
      modelName: completionModel,
      tag: completionTag,
      tokensIn: Math.floor(completionTokensIn),
      tokensOut: Math.floor(completionTokensOut),
      technicalUserId: userId || 'user-123',
      createDate: createDate.toISOString(),
    })

    // EmbeddingModelUsage - Less frequent but larger batches
    if (Math.random() > 0.3) {
      // 70% chance per day
      const embeddingRequests = Math.floor((Math.random() * 50 + 20) * weekdayMultiplier)
      const embeddingTokens = embeddingRequests * (Math.random() * 300 + 200)

      const embeddingCreateDate = new Date(
        year,
        month - 1,
        day,
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
      )

      // Random model and tag for embedding
      const embeddingModel = embeddingModels[Math.floor(Math.random() * embeddingModels.length)]
      const embeddingTag = selectRandomTag()

      mockData.push({
        type: 'EmbeddingModelUsage',
        requests: embeddingRequests,
        modelName: embeddingModel,
        tag: embeddingTag,
        tokensIn: Math.floor(embeddingTokens),
        tokensOut: 0,
        technicalUserId: userId || 'user-123',
        createDate: embeddingCreateDate.toISOString(),
      })
    }

    // ImageModelUsage - Occasional usage
    if (Math.random() > 0.7) {
      // 30% chance per day
      const imageRequests = Math.floor((Math.random() * 10 + 5) * weekendMultiplier)
      const quality = Math.random() > 0.5 ? 'hd' : 'standard'
      const sizeWidth = quality === 'hd' ? 1792 : 1024
      const sizeHeight = 1024

      const imageCreateDate = new Date(
        year,
        month - 1,
        day,
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
      )

      // Random model and tag for image
      const imageModel = imageModels[Math.floor(Math.random() * imageModels.length)]
      const imageTag = selectRandomTag()

      mockData.push({
        type: 'ImageModelUsage',
        requests: imageRequests,
        modelName: imageModel,
        tag: imageTag,
        sizeWidth,
        sizeHeight,
        quality,
        tokensIn: 0,
        tokensOut: 0,
        technicalUserId: userId || 'user-123',
        createDate: imageCreateDate.toISOString(),
      })
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return mockData
}

const mockUsageData30Days = (userId) => {
  const startDate = new Date('2025-07-01')
  return generateMockUsageData(userId, startDate, 30)
}

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
const apiKeys = {} // { [id]: { id, name, permissions, created_at, expires_at, is_active, secret, user_id } }

// Lade hardcodierte API Keys aus mock-data.js
mockData.MOCK_API_KEYS.forEach((key) => {
  apiKeys[key.id] = {
    ...key,
    secret: generateApiKey(),
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

// GET /v1/apikeys/{id} - Get a single API token by ID
app.get('/v1/apikeys/:id', validateToken, (req, res) => {
  const { id } = req.params
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Getting API key with ID: ${id} for user: ${userId}`)

  const apiKey = apiKeys[id]

  if (!apiKey) {
    console.log(`[${timestamp}] API key not found with ID: ${id}`)
    return res.status(404).json({ error: 'Token not found' })
  }

  // Prüfe Berechtigung (nur eigene Keys oder Admin)
  const userRoles = req.user.groups || []
  const isAdmin = userRoles.includes('API-Admin')

  if (!isAdmin && apiKey.user_id !== userId) {
    console.log(
      `[${timestamp}] Access denied - user ${userId} tried to access key ${id} owned by ${apiKey.user_id}`,
    )
    return res.status(403).json({ error: 'Access denied' })
  }

  console.log(`[${timestamp}] API key found: "${apiKey.name}" (active: ${apiKey.is_active})`)
  res.status(200).json({
    id: apiKey.id,
    name: apiKey.name,
    permissions: apiKey.permissions,
    created_at: apiKey.created_at,
    expires_at: apiKey.expires_at,
    is_active: apiKey.is_active,
  })
})

// POST /v1/apikeys/{id}/rotate - Rotate an API token
app.post('/v1/apikeys/:id/rotate', validateToken, (req, res) => {
  const { id } = req.params
  const { name, permissions } = req.body
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Rotating API key with ID: ${id} for user: ${userId}`)

  const existingKey = apiKeys[id]
  if (!existingKey) {
    console.log(`[${timestamp}] API key not found for rotation: ${id}`)
    return res.status(404).json({ error: 'Token not found or not rotatable' })
  }

  // Prüfe Berechtigung (nur eigene Keys oder Admin)
  const userRoles = req.user.groups || []
  const isAdmin = userRoles.includes('API-Admin')

  if (!isAdmin && existingKey.user_id !== userId) {
    console.log(
      `[${timestamp}] Access denied - user ${userId} tried to rotate key ${id} owned by ${existingKey.user_id}`,
    )
    return res.status(403).json({ error: 'Access denied' })
  }

  console.log(`[${timestamp}] Deactivating existing key: "${existingKey.name}"`)
  // Deaktiviere alten Key
  existingKey.is_active = false

  // Erstelle neuen Key
  const newApiKey = createApiKeyObject(
    name || existingKey.name,
    permissions || existingKey.permissions,
    existingKey.user_id,
  )
  apiKeys[newApiKey.id] = newApiKey

  console.log(`[${timestamp}] New API key created with ID: ${newApiKey.id}`)

  res.status(201).json({
    id: newApiKey.id,
    name: newApiKey.name,
    permissions: newApiKey.permissions,
    created_at: newApiKey.created_at,
    expires_at: newApiKey.expires_at,
    is_active: newApiKey.is_active,
    secret: newApiKey.secret,
  })
})

// DELETE /v1/apikeys/:id/deactivate - Deactivate an API key
app.delete('/v1/apikeys/:id/deactivate', validateToken, (req, res) => {
  const { id } = req.params
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Deactivating API key: ${id}`)

  const apiKey = apiKeys[id]
  if (!apiKey) {
    console.log(`[${timestamp}] ❌ API key not found: ${id}`)
    return res.status(404).json({ error: 'API key not found' })
  }

  // Prüfe Berechtigung: Nur Besitzer oder Admin kann deaktivieren
  const userRoles = req.user.groups || []
  const isAdmin = userRoles.includes('API-Admin')
  const isOwner = apiKey.user_id === userId

  if (!isAdmin && !isOwner) {
    console.log(`[${timestamp}] ❌ Unauthorized deactivation attempt for key: ${id}`)
    return res.status(403).json({ error: 'Unauthorized to deactivate this API key' })
  }

  // Deaktiviere den API Key
  apiKey.is_active = false
  apiKey.deactivated_at = timestamp

  console.log(`[${timestamp}] ✅ API key deactivated successfully: ${id}`)

  res.status(200).json({
    id: apiKey.id,
    name: apiKey.name,
    is_active: apiKey.is_active,
    deactivated_at: apiKey.deactivated_at,
  })
})

// PUT /v1/apikeys/{id}/deactivate - Deactivate an API token (alternative endpoint)
app.put('/v1/apikeys/:id/deactivate', validateToken, (req, res) => {
  const { id } = req.params
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Deactivating API key with ID: ${id} for user: ${userId}`)

  const apiKey = apiKeys[id]

  if (!apiKey) {
    console.log(`[${timestamp}] API key not found for deactivation: ${id}`)
    return res.status(404).json({ error: 'Token not found' })
  }

  // Prüfe Berechtigung (nur eigene Keys oder Admin)
  const userRoles = req.user.groups || []
  const isAdmin = userRoles.includes('API-Admin')

  if (!isAdmin && apiKey.user_id !== userId) {
    console.log(
      `[${timestamp}] Access denied - user ${userId} tried to deactivate key ${id} owned by ${apiKey.user_id}`,
    )
    return res.status(403).json({ error: 'Access denied' })
  }

  console.log(`[${timestamp}] Deactivating API key: "${apiKey.name}"`)
  apiKey.is_active = false

  console.log(`[${timestamp}] API key deactivated successfully`)
  res.status(204).send()
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

  console.log(`[${timestamp}] Summary data - Total records: ${mockUsage.length}`)

  res.status(200).json({
    usage: mockUsage,
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
  } else if (by === 'day' || by === 'day,month' || by === 'day,month,year') {
    // Gruppiert nach Tag/Monat/Jahr (für Charts)
    mockUsage = [...mockData.MOCK_USAGE_SUMMARY_BY_DAY]
    console.log(
      `[${timestamp}] Admin: Returning usage summary grouped by day: ${mockUsage.length} records`,
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
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/apikeys/:id - Get single API key`)
  console.log(
    `[${timestamp}]   POST http://localhost:${port}/v1/apikeys/:id/rotate - Rotate API key`,
  )
  console.log(
    `[${timestamp}]   DELETE http://localhost:${port}/v1/apikeys/:id/deactivate - Deactivate API key`,
  )
  console.log(
    `[${timestamp}]   PUT  http://localhost:${port}/v1/apikeys/:id/deactivate - Deactivate API key (PUT)`,
  )
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
