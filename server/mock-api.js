import cors from 'cors'
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import * as mockData from './mock-data.js'
import {
  getAIUsageSummaryByDay,
  getAIUsageSummaryByApiKey,
  getAIUsageSummaryByTag,
  getExtractionUsageSummaryByDay,
  getExtractionUsageSummaryByTag,
  closeDatabase,
} from '../scripts/db-helper.js'

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
  // Bypass für Development (wenn kein Token vorhanden)
  const bypassKeycloak =
    process.env.BYPASS_KEYCLOAK === 'true' || process.env.NODE_ENV === 'development'
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (bypassKeycloak) {
      console.log(
        `[${new Date().toISOString()}] 🔓 Keycloak-Bypass aktiviert - Mock-Token verwendet`,
      )
      req.user = {
        sub: 'mock-user-123',
        email: 'mock-admin@example.com',
        name: 'Mock Admin User',
        groups: ['API-Admin'],
      }
      return next()
    }
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
    const mockTokenData = {
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
const apiKeys = {} // { [id]: { id, name, createdAt, expiresAt, active, secret, userId } }

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
  return `dk_${Math.random()
    .toString(36)
    .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

function createApiKeyObject(name, permissions, userId = null) {
  const now = new Date()
  const expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

  return {
    id: uuidv4(),
    name,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true,
    secret: generateApiKey(),
    userId,
  }
}

// API Endpunkte

// GET /v1/dev/test-500 - Nur zum Testen des Frontend-500-Popups (gibt 500 mit Tracing-ID zurück)
app.get('/v1/dev/test-500', validateToken, (_req, res) => {
  const tracingId = `test-trace-${Date.now()}-${uuidv4().slice(0, 8)}`
  res.status(500).json({ error: tracingId, code: 'TEST_500' })
})

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
    createdAt: apiKey.createdAt,
    expiresAt: apiKey.expiresAt,
    active: apiKey.active,
    secret: apiKey.secret,
  })
})

// GET /v1/admin/apikeys - List all API tokens for admin perspective
app.get('/v1/admin/apikeys', validateToken, (req, res) => {
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Listing all API keys for admin perspective`)

  // Nur Admins können diesen Endpunkt verwenden
  const userRoles = req.user.groups || []
  const isAdmin = userRoles.includes('API-Admin')

  if (!isAdmin) {
    console.log(`[${timestamp}] Access denied - non-admin user tried to access admin endpoint`)
    return res.status(403).json({ error: 'Access denied - Admin permission required' })
  }

  // Alle Keys für Admin anzeigen
  const keys = Object.values(apiKeys)
  console.log(`[${timestamp}] Admin: Returning all ${keys.length} API keys`)

  const responseKeys = keys.map((key) => ({
    id: key.id,
    name: key.name,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    active: key.active,
    userId: key.userId,
    userName: key.userName,
  }))

  res.status(200).json(responseKeys)
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
    keys = Object.values(apiKeys).filter((key) => key.userId === userId)
    console.log(`[${timestamp}] User access - showing ${keys.length} API keys for user ${userId}`)
  }

  const responseKeys = keys.map((key) => ({
    id: key.id,
    name: key.name,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    active: key.active,
    userId: key.userId,
    userName: key.userName,
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

  if (!isAdmin && apiKey.userId !== userId) {
    console.log(
      `[${timestamp}] Access denied - user ${userId} tried to access key ${id} owned by ${apiKey.userId}`,
    )
    return res.status(403).json({ error: 'Access denied' })
  }

  console.log(`[${timestamp}] API key found: "${apiKey.name}" (active: ${apiKey.active})`)
  res.status(200).json({
    id: apiKey.id,
    name: apiKey.name,
    createdAt: apiKey.createdAt,
    expiresAt: apiKey.expiresAt,
    active: apiKey.active,
    userId: apiKey.userId,
    userName: apiKey.userName,
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

  if (!isAdmin && existingKey.userId !== userId) {
    console.log(
      `[${timestamp}] Access denied - user ${userId} tried to rotate key ${id} owned by ${existingKey.userId}`,
    )
    return res.status(403).json({ error: 'Access denied' })
  }

  console.log(`[${timestamp}] Deactivating existing key: "${existingKey.name}"`)
  // Deaktiviere alten Key
  existingKey.active = false

  // Erstelle neuen Key
  const newApiKey = createApiKeyObject(
    name || existingKey.name,
    permissions || existingKey.permissions,
    existingKey.userId,
  )
  apiKeys[newApiKey.id] = newApiKey

  console.log(`[${timestamp}] New API key created with ID: ${newApiKey.id}`)

  res.status(201).json({
    id: newApiKey.id,
    name: newApiKey.name,
    createdAt: newApiKey.createdAt,
    expiresAt: newApiKey.expiresAt,
    active: newApiKey.active,
    secret: newApiKey.secret,
    userId: newApiKey.userId,
    userName: newApiKey.userName,
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
  const isOwner = apiKey.userId === userId

  if (!isAdmin && !isOwner) {
    console.log(`[${timestamp}] ❌ Unauthorized deactivation attempt for key: ${id}`)
    return res.status(403).json({ error: 'Unauthorized to deactivate this API key' })
  }

  // Deaktiviere den API Key
  apiKey.active = false
  apiKey.deactivatedAt = timestamp

  console.log(`[${timestamp}] ✅ API key deactivated successfully: ${id}`)

  res.status(200).json({
    id: apiKey.id,
    name: apiKey.name,
    active: apiKey.active,
    deactivatedAt: apiKey.deactivatedAt,
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

  if (!isAdmin && apiKey.userId !== userId) {
    console.log(
      `[${timestamp}] Access denied - user ${userId} tried to deactivate key ${id} owned by ${apiKey.userId}`,
    )
    return res.status(403).json({ error: 'Access denied' })
  }

  console.log(`[${timestamp}] Deactivating API key: "${apiKey.name}"`)
  apiKey.active = false

  console.log(`[${timestamp}] API key deactivated successfully`)
  res.status(204).send()
})

// Helper-Funktionen für Filterung, Sortierung und Pagination
function applyFilters(data, filters) {
  let filtered = [...data]

  // Date range filter
  if (filters.from_date || filters.to_date) {
    const beforeFilter = filtered.length
    filtered = filtered.filter((item) => {
      let itemDate
      if (item.createDate) {
        itemDate = new Date(item.createDate)
      } else if (item.day && item.month && item.year) {
        // Verwende day/month/year falls vorhanden
        itemDate = new Date(item.year, item.month - 1, item.day)
      } else {
        // Fallback auf aktuelles Datum
        itemDate = new Date()
      }

      const from = filters.from_date ? new Date(filters.from_date) : new Date(0)
      const to = filters.to_date ? new Date(filters.to_date) : new Date(8640000000000000) // Max date

      // Normalisiere auf Tagesebene (ignoriere Zeit) - UTC verwenden um Zeitzonen-Probleme zu vermeiden
      const itemDateOnly = new Date(
        Date.UTC(itemDate.getUTCFullYear(), itemDate.getUTCMonth(), itemDate.getUTCDate()),
      )
      const fromDateOnly = new Date(
        Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
      )
      const toDateOnly = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))

      const isInRange = itemDateOnly >= fromDateOnly && itemDateOnly <= toDateOnly

      // Debug-Logging für erste paar Items
      if (beforeFilter - filtered.length < 5) {
        console.log(`[applyFilters] Date check:`, {
          itemDate: itemDateOnly.toISOString().split('T')[0],
          fromDate: fromDateOnly.toISOString().split('T')[0],
          toDate: toDateOnly.toISOString().split('T')[0],
          isInRange,
          itemYear: itemDate.getUTCFullYear(),
          itemMonth: itemDate.getUTCMonth() + 1,
          itemDay: itemDate.getUTCDate(),
        })
      }

      return isInRange
    })
    console.log(`[applyFilters] Date filter: ${beforeFilter} -> ${filtered.length} items`)
  }

  // Tag filter
  if (filters.tag) {
    filtered = filtered.filter((item) => item.tag === filters.tag)
  }

  // Model filter
  if (filters.model) {
    filtered = filtered.filter(
      (item) => item.model === filters.model || item.modelName === filters.model,
    )
  }

  // usageType (COMPLETION_USAGE etc.) oder modelType (CompletionModelUsage etc.) Filter
  const typeFilter = filters.modelType
  if (typeFilter) {
    filtered = filtered.filter((item) => item.type === typeFilter || item.modelType === typeFilter)
  }

  // API Key filter
  if (filters.apiKeyId) {
    filtered = filtered.filter((item) => item.apiKeyId === filters.apiKeyId)
  }

  // User filter
  if (filters.userId) {
    filtered = filtered.filter(
      (item) => item.technicalUserId === filters.userId || item.userId === filters.userId,
    )
  }

  return filtered
}

function applySorting(data, sort, order) {
  if (!sort) return data

  const sorted = [...data].sort((a, b) => {
    let comparison = 0

    switch (sort) {
      case 'date':
        const dateA = a.createDate
          ? new Date(a.createDate)
          : a.day && a.month && a.year
            ? new Date(a.year, a.month - 1, a.day)
            : new Date(0)
        const dateB = b.createDate
          ? new Date(b.createDate)
          : b.day && b.month && b.year
            ? new Date(b.year, b.month - 1, b.day)
            : new Date(0)
        comparison = dateA.getTime() - dateB.getTime()
        break
      case 'cost':
        comparison = (a.cost || 0) - (b.cost || 0)
        break
      case 'requests':
        comparison = (a.requests || 0) - (b.requests || 0)
        break
      case 'tokensIn':
        comparison = (a.tokensIn || 0) - (b.tokensIn || 0)
        break
      case 'tokensOut':
        comparison = (a.tokensOut || 0) - (b.tokensOut || 0)
        break
      case 'totalTokens':
        comparison =
          (a.tokensIn || 0) + (a.tokensOut || 0) - ((b.tokensIn || 0) + (b.tokensOut || 0))
        break
      case 'model':
        comparison = (a.modelName || a.model || '').localeCompare(b.modelName || b.model || '')
        break
      case 'user':
        comparison = (a.technicalUserName || a.technicalUserId || '').localeCompare(
          b.technicalUserName || b.technicalUserId || '',
        )
        break
      // Extraction-spezifische Felder
      case 'technicalUserId':
        comparison = (a.technicalUserId || '').localeCompare(b.technicalUserId || '')
        break
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '')
        break
      case 'provider':
        comparison = (a.provider || '').localeCompare(b.provider || '')
        break
      case 'pages':
        comparison = (a.pages || 0) - (b.pages || 0)
        break
      case 'confidenceScore':
        comparison = (a.confidenceScore || 0) - (b.confidenceScore || 0)
        break
      case 'createDate':
        const createDateA = a.createDate ? new Date(a.createDate) : new Date(0)
        const createDateB = b.createDate ? new Date(b.createDate) : new Date(0)
        comparison = createDateA.getTime() - createDateB.getTime()
        break
      case 'apiKeyId':
        comparison = (a.apiKeyId || '').localeCompare(b.apiKeyId || '')
        break
      case 'modelId':
        comparison = (a.modelId || '').localeCompare(b.modelId || '')
        break
      case 'documentType':
        comparison = (a.documentType || '').localeCompare(b.documentType || '')
        break
      default:
        comparison = 0
    }

    return order === 'asc' ? comparison : -comparison
  })

  return sorted
}

function applyPagination(data, page = 1, limit = 20) {
  const pageNum = parseInt(page, 10) || 1
  const limitNum = parseInt(limit, 10) || 20
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  return {
    data: data.slice(start, end),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: data.length,
      totalPages: Math.ceil(data.length / limitNum),
    },
  }
}

// usageType (COMPLETION_USAGE) -> modelType (CompletionModelUsage) für Filter/DB
function usageTypeToModelType(usageType) {
  const map = {
    COMPLETION_USAGE: 'CompletionModelUsage',
    EMBEDDING_USAGE: 'EmbeddingModelUsage',
    IMAGE_USAGE: 'ImageModelUsage',
  }
  return map[usageType] || usageType
}

// GET /v1/usage/ai - Get AI usage data (mit Pagination, Sortierung, Filter)
app.get('/v1/usage/ai', validateToken, (req, res) => {
  const {
    from_date,
    to_date,
    page,
    limit,
    tag,
    model,
    modelType: queryModelType,
    usageType: queryUsageType,
    apiKeyId,
    userId,
    sort,
    order,
  } = req.query
  const modelType = usageTypeToModelType(queryUsageType) || queryModelType
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Getting AI usage data with filters:`, req.query)
  console.log(`[${timestamp}] MOCK_USAGE_DATA length:`, mockData.MOCK_USAGE_DATA?.length || 0)

  // Verwende SQLite-Daten für bessere Performance und mehr Daten
  // Konvertiere Summary-Daten zu detaillierten Usage-Daten
  let mockUsage = []
  let filteredUsage = []

  try {
    // Verwende SQLite Summary-Daten und konvertiere sie zu detaillierten Records
    const summaryData = getAIUsageSummaryByDay({
      from_date,
      to_date,
      tag,
      model,
      modelType,
      apiKeyId,
      userId,
    })

    console.log(`[${timestamp}] SQLite returned ${summaryData.length} summary records`)

    // Konvertiere Summary zu detaillierten Records (ein Record pro Summary-Eintrag)
    mockUsage = summaryData.map((summary, index) => ({
      id: `usage-${summary.id || index}`,
      type: summary.type || 'CompletionModelUsage',
      tag: summary.tag || '',
      model: summary.model || '',
      modelName: summary.model || '',
      modelType: summary.type || 'CompletionModelUsage',
      apiKeyId: summary.apiKeyId || '',
      requestTokens: summary.requestTokens || summary.tokensIn || 0,
      responseTokens: summary.responseTokens || summary.tokensOut || 0,
      tokensIn: summary.tokensIn || summary.requestTokens || 0,
      tokensOut: summary.tokensOut || summary.responseTokens || 0,
      technicalUserId: summary.technicalUserId || '',
      technicalUserName: `User ${summary.technicalUserId || ''}`,
      createDate: summary.createDate || new Date().toISOString(),
      requests: summary.requests || 0,
      cost: summary.cost || 0,
      day: summary.day,
      month: summary.month,
      year: summary.year,
    }))

    console.log(
      `[${timestamp}] Using SQLite data, converted ${summaryData.length} summary records to ${mockUsage.length} detailed records`,
    )
    // Daten sind bereits durch SQLite gefiltert, keine weitere Filterung nötig
    filteredUsage = mockUsage
  } catch (error) {
    console.error(
      `[${timestamp}] Error loading from SQLite, falling back to MOCK_USAGE_DATA:`,
      error,
    )
    // Fallback auf hardcodierte Daten - hier Filterung anwenden
    mockUsage = [...mockData.MOCK_USAGE_DATA]
    const filters = {
      from_date,
      to_date,
      tag,
      model,
      modelType,
      apiKeyId,
      userId,
    }
    console.log(`[${timestamp}] Applying filters to fallback data:`, filters)
    filteredUsage = applyFilters(mockUsage, filters)
    console.log(`[${timestamp}] After filtering:`, filteredUsage.length, 'records')
  }

  // Sortierung anwenden
  if (sort) {
    filteredUsage = applySorting(filteredUsage, sort, order || 'desc')
  }

  // Pagination anwenden
  const result = applyPagination(filteredUsage, page, limit)

  console.log(
    `[${timestamp}] Returning ${result.data.length} usage records (page ${result.pagination.page} of ${result.pagination.totalPages})`,
  )

  res.status(200).json({
    data: result.data,
    pagination: result.pagination,
  })
})

// GET /v1/usage/ai/summarize - Get usage summary (mit Pagination, Sortierung, Filter)
app.get('/v1/usage/ai/summarize', validateToken, (req, res) => {
  const {
    from_date,
    to_date,
    by,
    page,
    limit,
    tag,
    model,
    modelType: queryModelType,
    usageType: queryUsageType,
    apiKeyId,
    userId,
  } = req.query
  const modelType = usageTypeToModelType(queryUsageType) || queryModelType
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Getting AI usage summary with filters:`, req.query)

  // Verwende SQLite für bessere Performance
  let mockUsage = []

  // Gruppierung nach 'by' Parameter
  const groupBy = by ? (Array.isArray(by) ? by : by.split(',')) : []
  console.log(`[${timestamp}] GroupBy parameter:`, by, 'parsed:', groupBy)

  // Filter für SQLite-Abfrage
  const filters = {
    from_date,
    to_date,
    tag,
    model,
    modelType,
    apiKeyId,
    userId,
  }

  if (groupBy.includes('apikey') || by === 'apikey') {
    // Verwende SQLite für API Key Gruppierung
    mockUsage = getAIUsageSummaryByApiKey(filters)
    console.log(
      `[${timestamp}] Using SQLite (ai_usage_summary_by_apikey), length:`,
      mockUsage.length,
    )
  } else if (groupBy.includes('tag')) {
    // Verwende SQLite für Tag-Gruppierung
    mockUsage = getAIUsageSummaryByTag(filters)
    console.log(`[${timestamp}] Using SQLite (ai_usage_summary_by_tag), length:`, mockUsage.length)
  } else if (groupBy.includes('day') || groupBy.includes('month') || groupBy.includes('year')) {
    // Verwende SQLite für Tag/Monat/Jahr Gruppierung
    mockUsage = getAIUsageSummaryByDay(filters)
    console.log(`[${timestamp}] Using SQLite (ai_usage_summary_by_day), length:`, mockUsage.length)
    if (mockUsage.length > 0) {
      console.log(
        `[${timestamp}] First item date:`,
        mockUsage[0].createDate,
        'day:',
        mockUsage[0].day,
        'month:',
        mockUsage[0].month,
        'year:',
        mockUsage[0].year,
      )
      console.log(
        `[${timestamp}] Last item date:`,
        mockUsage[mockUsage.length - 1].createDate,
        'day:',
        mockUsage[mockUsage.length - 1].day,
        'month:',
        mockUsage[mockUsage.length - 1].month,
        'year:',
        mockUsage[mockUsage.length - 1].year,
      )
    }
  } else {
    // Fallback auf statische Daten für nicht-gruppierte Abfragen
    mockUsage = [...mockData.MOCK_USAGE_DATA]
    console.log(`[${timestamp}] Using MOCK_USAGE_DATA (fallback), length:`, mockUsage.length)
    // Filter anwenden für Fallback-Daten
    const filteredUsage = applyFilters(mockUsage, filters)
    mockUsage = filteredUsage
  }

  console.log(`[${timestamp}] After filtering:`, mockUsage.length, 'records')

  // Pagination anwenden
  const result = applyPagination(mockUsage, page, limit)

  console.log(
    `[${timestamp}] Returning ${result.data.length} summary records (page ${result.pagination.page} of ${result.pagination.totalPages})`,
  )

  res.status(200).json({
    data: result.data,
    pagination: result.pagination,
  })
})

// Admin Endpunkte

// GET /v1/admin/usage/ai - Get all usage data (Admin only) (mit Pagination, Sortierung, Filter)
app.get('/v1/admin/usage/ai', validateToken, requireRole(['API-Admin']), (req, res) => {
  const {
    from_date,
    to_date,
    page,
    limit,
    tag,
    model,
    modelType: queryModelType,
    usageType: queryUsageType,
    apiKeyId,
    userId,
    sort,
    order,
  } = req.query
  const modelType = usageTypeToModelType(queryUsageType) || queryModelType
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting all AI usage data with filters:`, req.query)

  // Verwende hardcodierte Usage-Daten für Admin
  const mockUsage = [...mockData.MOCK_USAGE_DATA]

  // Filter anwenden
  const filters = {
    from_date,
    to_date,
    tag,
    model,
    modelType,
    apiKeyId,
    userId,
  }
  let filteredUsage = applyFilters(mockUsage, filters)

  // Sortierung anwenden
  if (sort) {
    filteredUsage = applySorting(filteredUsage, sort, order || 'desc')
  }

  // Pagination anwenden
  const result = applyPagination(filteredUsage, page, limit)

  console.log(
    `[${timestamp}] Admin: Returning ${result.data.length} usage records (page ${result.pagination.page} of ${result.pagination.totalPages})`,
  )

  res.status(200).json({
    data: result.data,
    pagination: result.pagination,
  })
})

// GET /v1/admin/usage/ai/summarize - Get usage summary for all users (Admin only) (mit Pagination, Sortierung, Filter)
app.get('/v1/admin/usage/ai/summarize', validateToken, requireRole(['API-Admin']), (req, res) => {
  const {
    from_date,
    to_date,
    by,
    page,
    limit,
    tag,
    model,
    modelType: queryModelType,
    usageType: queryUsageType,
    apiKeyId,
    userId,
    technicalUserId,
  } = req.query
  const modelType = usageTypeToModelType(queryUsageType) || queryModelType
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting AI usage summary with filters:`, req.query)

  // Verwende hardcodierte gruppierte Usage-Daten für Admin
  let mockUsage = []

  // Gruppierung nach 'by' Parameter
  const groupBy = by ? (Array.isArray(by) ? by : by.split(',')) : []

  if (groupBy.includes('apikey') || by === 'apikey') {
    mockUsage = [...mockData.MOCK_USAGE_SUMMARY_BY_APIKEY]
  } else if (groupBy.includes('tag')) {
    // Verwende SQLite für Tag-Gruppierung
    mockUsage = getAIUsageSummaryByTag(filters)
    console.log(
      `[${timestamp}] Admin: Using SQLite (ai_usage_summary_by_tag), length:`,
      mockUsage.length,
    )
  } else if (groupBy.includes('day') || groupBy.includes('month') || groupBy.includes('year')) {
    mockUsage = [...mockData.MOCK_USAGE_SUMMARY_BY_DAY]
  } else {
    mockUsage = [...mockData.MOCK_USAGE_DATA]
  }

  // Filter anwenden (technicalUserId wird zu userId gemappt)
  const filters = {
    from_date,
    to_date,
    tag,
    model,
    modelType,
    apiKeyId,
    userId: userId || technicalUserId,
  }
  const filteredUsage = applyFilters(mockUsage, filters)

  // Pagination anwenden
  const result = applyPagination(filteredUsage, page, limit)

  console.log(
    `[${timestamp}] Admin: Returning ${result.data.length} summary records (page ${result.pagination.page} of ${result.pagination.totalPages})`,
  )

  res.status(200).json({
    data: result.data,
    pagination: result.pagination,
  })
})

// GET /v1/admin/users - Get all users (Admin only)
app.get('/v1/admin/users', validateToken, requireRole(['API-Admin']), (req, res) => {
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting all users`)

  // Extrahiere alle eindeutigen Nutzer aus den API Keys
  const allUsers = mockData.MOCK_API_KEYS.map((key) => ({
    id: key.userId,
    displayName: key.userName,
    technicalUserId: key.userId,
    technicalUserName: key.userName,
    isActive: key.active,
    createdAt: key.createdAt,
  }))

  console.log(`[${timestamp}] Admin: Returning ${allUsers.length} users`)

  res.status(200).json({
    users: allUsers,
  })
})

// Server starten
// Cleanup beim Beenden
process.on('SIGINT', () => {
  console.log('\n[Shutdown] Schließe Datenbank...')
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n[Shutdown] Schließe Datenbank...')
  closeDatabase()
  process.exit(0)
})

app.listen(port, () => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ========================================`)
  console.log(`[${timestamp}] Mock API Server gestartet`)
  console.log(`[${timestamp}] Server läuft auf http://localhost:${port}`)
  console.log(`[${timestamp}] SQLite Datenbank: data/mock-data.db`)
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
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/admin/users - Get all users`)
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/usage/extraction - Get extraction usage`,
  )
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/usage/extraction/summarize - Get extraction summary`,
  )
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/admin/usage/extraction - Admin extraction usage`,
  )
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/admin/usage/extraction/summarize - Admin extraction summary`,
  )
  console.log(`[${timestamp}] ========================================`)
})

// ============================================
// EXTRACTION USAGE ENDPOINTS
// ============================================

// Helper für Extraction-Filter
function applyExtractionFilters(data, filters) {
  let filtered = [...data]
  const beforeFilter = filtered.length

  // Date range filter
  if (filters.from_date || filters.to_date) {
    filtered = filtered.filter((item) => {
      let itemDate
      if (item.createDate) {
        itemDate = new Date(item.createDate)
      } else if (item.day && item.month && item.year) {
        // Verwende day/month/year falls vorhanden
        itemDate = new Date(item.year, item.month - 1, item.day)
      } else {
        // Fallback auf aktuelles Datum
        itemDate = new Date()
      }

      const from = filters.from_date ? new Date(filters.from_date) : new Date(0)
      const to = filters.to_date ? new Date(filters.to_date) : new Date(8640000000000000) // Max date

      // Normalisiere auf Tagesebene (ignoriere Zeit) - UTC verwenden um Zeitzonen-Probleme zu vermeiden
      const itemDateOnly = new Date(
        Date.UTC(itemDate.getUTCFullYear(), itemDate.getUTCMonth(), itemDate.getUTCDate()),
      )
      const fromDateOnly = new Date(
        Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
      )
      const toDateOnly = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))

      const isInRange = itemDateOnly >= fromDateOnly && itemDateOnly <= toDateOnly

      // Debug-Logging für erste paar Items
      if (beforeFilter - filtered.length < 5) {
        console.log(`[applyExtractionFilters] Date check:`, {
          itemDate: itemDateOnly.toISOString().split('T')[0],
          fromDate: fromDateOnly.toISOString().split('T')[0],
          toDate: toDateOnly.toISOString().split('T')[0],
          isInRange,
          itemYear: itemDate.getFullYear(),
          itemMonth: itemDate.getMonth() + 1,
          itemDay: itemDate.getDate(),
          hasDayMonthYear: !!(item.day && item.month && item.year),
        })
      }

      return isInRange
    })
    console.log(`[applyExtractionFilters] Date filter: ${beforeFilter} -> ${filtered.length} items`)
  }

  // Provider filter
  if (filters.provider) {
    filtered = filtered.filter((item) => item.provider === filters.provider)
  }

  // ModelId filter
  if (filters.modelId) {
    filtered = filtered.filter((item) => item.modelId === filters.modelId)
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter((item) => item.status === filters.status)
  }

  // Tag filter
  if (filters.tag) {
    filtered = filtered.filter((item) => item.tag === filters.tag)
  }

  // API Key filter
  if (filters.apiKeyId) {
    filtered = filtered.filter((item) => item.apiKeyId === filters.apiKeyId)
  }

  // User filter
  if (filters.userId) {
    filtered = filtered.filter(
      (item) => item.technicalUserId === filters.userId || item.userId === filters.userId,
    )
  }

  return filtered
}

// GET /v1/usage/extraction - Get extraction usage data
app.get('/v1/usage/extraction', validateToken, (req, res) => {
  const {
    from_date,
    to_date,
    page,
    limit,
    provider,
    modelId,
    status,
    tag,
    apiKeyId,
    userId,
    sort,
    order,
  } = req.query
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Getting extraction usage data with filters:`, req.query)

  const mockExtraction = [...mockData.MOCK_EXTRACTION_DATA]

  // Filter anwenden
  const filters = {
    from_date,
    to_date,
    provider,
    modelId,
    status,
    tag,
    apiKeyId,
    userId,
  }
  let filteredExtraction = applyExtractionFilters(mockExtraction, filters)

  // Sortierung anwenden (ähnlich wie AI Usage)
  if (sort) {
    filteredExtraction = applySorting(filteredExtraction, sort, order || 'desc')
  }

  // Pagination anwenden
  const result = applyPagination(filteredExtraction, page, limit)

  console.log(
    `[${timestamp}] Returning ${result.data.length} extraction records (page ${result.pagination.page} of ${result.pagination.totalPages})`,
  )

  res.status(200).json({
    data: result.data,
    pagination: result.pagination,
  })
})

// GET /v1/usage/extraction/summarize - Get extraction usage summary
app.get('/v1/usage/extraction/summarize', validateToken, (req, res) => {
  const { from_date, to_date, by, page, limit, provider, modelId, status, tag, apiKeyId, userId } =
    req.query
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Getting extraction usage summary with filters:`, req.query)
  console.log(`[${timestamp}] GroupBy parameter:`, by, typeof by)

  let mockExtraction = []

  // Gruppierung nach 'by' Parameter
  const groupBy = by ? (Array.isArray(by) ? by : typeof by === 'string' ? by.split(',') : [by]) : []
  console.log(`[${timestamp}] Parsed groupBy:`, groupBy)

  // Filter für SQLite-Abfrage
  const filters = {
    from_date,
    to_date,
    provider,
    modelId,
    status,
    tag,
    apiKeyId,
    userId,
  }

  if (groupBy.includes('tag')) {
    // Verwende SQLite für Tag-Gruppierung
    mockExtraction = getExtractionUsageSummaryByTag(filters)
    console.log(
      `[${timestamp}] Using SQLite (extraction_usage_summary_by_tag), length:`,
      mockExtraction.length,
    )
  } else if (groupBy.includes('day') || groupBy.includes('month') || groupBy.includes('year')) {
    // Verwende SQLite für Tag/Monat/Jahr Gruppierung
    mockExtraction = getExtractionUsageSummaryByDay(filters)
    console.log(
      `[${timestamp}] Using SQLite (extraction_usage_summary_by_day), length:`,
      mockExtraction.length,
    )
  } else {
    // Fallback auf statische Daten für nicht-gruppierte Abfragen
    mockExtraction = [...mockData.MOCK_EXTRACTION_DATA]
    console.log(
      `[${timestamp}] Using MOCK_EXTRACTION_DATA (fallback), length:`,
      mockExtraction.length,
    )
    // Filter anwenden für Fallback-Daten
    const filteredExtraction = applyExtractionFilters(mockExtraction, filters)
    mockExtraction = filteredExtraction
  }

  if (mockExtraction.length > 0) {
    console.log(`[${timestamp}] First item:`, {
      day: mockExtraction[0].day,
      month: mockExtraction[0].month,
      year: mockExtraction[0].year,
      createDate: mockExtraction[0].createDate,
    })
  }
  console.log(`[${timestamp}] After filtering:`, mockExtraction.length, 'records')

  // Pagination anwenden
  const result = applyPagination(mockExtraction, page, limit)

  console.log(
    `[${timestamp}] Returning ${result.data.length} extraction summary records (page ${result.pagination.page} of ${result.pagination.totalPages})`,
  )
  console.log(`[${timestamp}] Filter details:`, {
    from_date,
    to_date,
    fromDateParsed: from_date ? new Date(from_date).toISOString() : 'none',
    toDateParsed: to_date ? new Date(to_date).toISOString() : 'none',
  })

  res.status(200).json({
    data: result.data,
    pagination: result.pagination,
  })
})

// GET /v1/admin/usage/extraction - Get all extraction usage data (Admin only)
app.get('/v1/admin/usage/extraction', validateToken, requireRole(['API-Admin']), (req, res) => {
  const {
    from_date,
    to_date,
    page,
    limit,
    provider,
    modelId,
    status,
    tag,
    apiKeyId,
    userId,
    sort,
    order,
  } = req.query
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting all extraction usage data with filters:`, req.query)

  const mockExtraction = [...mockData.MOCK_EXTRACTION_DATA]

  // Filter anwenden
  const filters = {
    from_date,
    to_date,
    provider,
    modelId,
    status,
    tag,
    apiKeyId,
    userId,
  }
  let filteredExtraction = applyExtractionFilters(mockExtraction, filters)

  // Sortierung anwenden
  if (sort) {
    filteredExtraction = applySorting(filteredExtraction, sort, order || 'desc')
  }

  // Pagination anwenden
  const result = applyPagination(filteredExtraction, page, limit)

  console.log(
    `[${timestamp}] Admin: Returning ${result.data.length} extraction records (page ${result.pagination.page} of ${result.pagination.totalPages})`,
  )

  res.status(200).json({
    data: result.data,
    pagination: result.pagination,
  })
})

// GET /v1/admin/usage/extraction/summarize - Get extraction usage summary (Admin only)
app.get(
  '/v1/admin/usage/extraction/summarize',
  validateToken,
  requireRole(['API-Admin']),
  (req, res) => {
    const {
      from_date,
      to_date,
      by,
      page,
      limit,
      provider,
      modelId,
      status,
      tag,
      apiKeyId,
      userId,
    } = req.query
    const timestamp = new Date().toISOString()

    console.log(`[${timestamp}] Admin: Getting extraction usage summary with filters:`, req.query)

    let mockExtraction = []

    // Gruppierung nach 'by' Parameter
    const groupBy = by ? (Array.isArray(by) ? by : by.split(',')) : []

    if (groupBy.includes('tag')) {
      // Verwende SQLite für Tag-Gruppierung
      const filters = {
        from_date,
        to_date,
        provider,
        modelId,
        status,
        tag,
        apiKeyId,
        userId,
      }
      mockExtraction = getExtractionUsageSummaryByTag(filters)
      console.log(
        `[${timestamp}] Admin: Using SQLite (extraction_usage_summary_by_tag), length:`,
        mockExtraction.length,
      )
    } else if (groupBy.includes('day') || groupBy.includes('month') || groupBy.includes('year')) {
      mockExtraction = [...mockData.MOCK_EXTRACTION_SUMMARY_BY_DAY]
    } else {
      mockExtraction = [...mockData.MOCK_EXTRACTION_DATA]
    }

    // Filter anwenden
    const filters = {
      from_date,
      to_date,
      provider,
      modelId,
      status,
      tag,
      apiKeyId,
      userId,
    }
    const filteredExtraction = applyExtractionFilters(mockExtraction, filters)

    // Pagination anwenden
    const result = applyPagination(filteredExtraction, page, limit)

    console.log(
      `[${timestamp}] Admin: Returning ${result.data.length} extraction summary records (page ${result.pagination.page} of ${result.pagination.totalPages})`,
    )

    res.status(200).json({
      data: result.data,
      pagination: result.pagination,
    })
  },
)
