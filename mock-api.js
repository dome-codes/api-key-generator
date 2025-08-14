import cors from 'cors'
import express from 'express'
import { v4 as uuidv4 } from 'uuid'

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
      totalTokens: Math.floor(completionTokensIn + completionTokensOut),
      cost: 0,
      technicalUserId: userId || 'user-123',
      technicalUserName: `User ${userId || 'user-123'}`,
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
        totalTokens: Math.floor(embeddingTokens),
        cost: 0,
        technicalUserId: userId || 'user-123',
        technicalUserName: `User ${userId || 'user-123'}`,
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
        totalTokens: 0,
        cost: 0,
        technicalUserId: userId || 'user-123',
        technicalUserName: `User ${userId || 'user-123'}`,
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
const port = 3001 // Port auf 3001 geändert, um Konflikt mit Keycloak zu vermeiden

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

    // Rollen aus groups claim extrahieren (neue Struktur)
    let userRoles = []

    if (payload.groups && Array.isArray(payload.groups)) {
      userRoles = payload.groups
        .map((group) => group.replace(/^\//, '')) // Entferne führenden Slash
        .filter(
          (group) => group === 'API-Admin' || group === 'API-Default' || group === 'API-Stream',
        )
    }

    // Mock-Token für verschiedene Rollen (für Testing)
    let mockTokenData = {
      sub: payload.sub || 'user-123',
      email: payload.email || 'admin@example.com',
      name: payload.name || 'Admin User',
      family_name: payload.family_name || 'User',
      given_name: payload.given_name || 'Admin',
      preferred_username: payload.preferred_username || 'admin',
      groups: userRoles.length > 0 ? userRoles : ['API-Admin'], // Standard: API-Admin
    }

    // Token aus Query-Parameter oder Header für Testing
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

    // Token-Info loggen
    console.log(`[${new Date().toISOString()}] ✅ JWT Token validiert:`, {
      userId: mockTokenData.sub,
      email: mockTokenData.email,
      name: mockTokenData.name,
      family_name: mockTokenData.family_name,
      given_name: mockTokenData.given_name,
      preferred_username: mockTokenData.preferred_username,
      groups: mockTokenData.groups,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : 'Kein Ablauf',
      originalGroups: payload.groups || [],
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

// Logging Middleware für alle Requests
app.use((req, res, next) => {
  const start = Date.now()
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] ${req.method} ${req.path} - Request started`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[${timestamp}] Request Body:`, JSON.stringify(req.body, null, 2))
  }
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`[${timestamp}] Query Params:`, JSON.stringify(req.query, null, 2))
  }
  if (req.params && Object.keys(req.params).length > 0) {
    console.log(`[${timestamp}] Path Params:`, JSON.stringify(req.params, null, 2))
  }

  // Log response
  const originalSend = res.send
  res.send = function (data) {
    const duration = Date.now() - start
    console.log(
      `[${timestamp}] ${req.method} ${req.path} - Response ${res.statusCode} (${duration}ms)`,
    )
    if (data && typeof data === 'string' && data.length < 1000) {
      console.log(`[${timestamp}] Response Body:`, data)
    } else if (data && typeof data === 'object') {
      console.log(`[${timestamp}] Response Body:`, JSON.stringify(data, null, 2))
    }
    originalSend.call(this, data)
  }

  next()
})

// In-Memory-Datenbank für API Keys (entsprechend OpenAPI Schema)
const apiKeys = {} // { [id]: { id, name, permissions, created_at, expires_at, is_active, secret, user_id } }
const usageData = {} // { [userId]: [{ model, tokens_used, cost, timestamp }] }
const users = {} // { [userId]: { id, email, role, is_active } }

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

// OpenAPI v1 Endpunkte entsprechend der Spezifikation

// POST /v1/apikeys - Create a new API token
app.post('/v1/apikeys', validateToken, (req, res) => {
  const { name, permissions } = req.body
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(
    `[${timestamp}] Creating new API key with name: "${name}" and permissions:`,
    permissions,
  )
  console.log(`[${timestamp}] User ID: ${userId}`)

  if (!name || !permissions || !Array.isArray(permissions)) {
    console.log(`[${timestamp}] Validation failed: Invalid request parameters`)
    return res.status(400).json({
      error: 'Invalid request. Name and permissions array are required.',
    })
  }

  const apiKey = createApiKeyObject(name, permissions, userId)
  apiKeys[apiKey.id] = apiKey

  console.log(`[${timestamp}] API key created successfully with ID: ${apiKey.id}`)
  console.log(`[${timestamp}] Total API keys in database: ${Object.keys(apiKeys).length}`)

  // Simuliere Verzögerung
  setTimeout(() => {
    console.log(`[${timestamp}] Sending response for API key creation`)
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      created_at: apiKey.created_at,
      expires_at: apiKey.expires_at,
      is_active: apiKey.is_active,
      secret: apiKey.secret, // Nur bei Erstellung zurückgegeben
    })
  }, 1000)
})

// GET /v1/apikeys - List all API tokens for the current user
app.get('/v1/apikeys', validateToken, (req, res) => {
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Listing API keys for user: ${userId}`)

  // Filtere Keys nach Benutzer (außer für Admins)
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
    // secret wird nicht zurückgegeben
  }))

  console.log(`[${timestamp}] Returning ${responseKeys.length} API keys`)
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
    // secret wird nicht zurückgegeben
  })
})

// POST /v1/apikeys/{id}/rotate - Rotate an API token
app.post('/v1/apikeys/:id/rotate', validateToken, (req, res) => {
  const { id } = req.params
  const { name, permissions } = req.body
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Rotating API key with ID: ${id} for user: ${userId}`)
  console.log(
    `[${timestamp}] New name: "${name || 'unchanged'}", new permissions:`,
    permissions || 'unchanged',
  )

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
  console.log(`[${timestamp}] Total API keys after rotation: ${Object.keys(apiKeys).length}`)

  setTimeout(() => {
    console.log(`[${timestamp}] Sending rotation response`)
    res.status(201).json({
      id: newApiKey.id,
      name: newApiKey.name,
      permissions: newApiKey.permissions,
      created_at: newApiKey.created_at,
      expires_at: newApiKey.expires_at,
      is_active: newApiKey.is_active,
      secret: newApiKey.secret,
    })
  }, 1000)
})

// PUT /v1/apikeys/{id}/deactivate - Deactivate an API token
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

// Admin Endpunkte

// GET /v1/admin/apikeys - Get all API keys (Admin only)
app.get('/v1/admin/apikeys', validateToken, requireRole(['API-Admin']), (req, res) => {
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting all API keys`)

  const keys = Object.values(apiKeys).map((key) => ({
    id: key.id,
    name: key.name,
    permissions: key.permissions,
    created_at: key.created_at,
    expires_at: key.expires_at,
    is_active: key.is_active,
    user_id: key.user_id,
  }))

  console.log(`[${timestamp}] Admin: Returning ${keys.length} API keys`)
  res.status(200).json(keys)
})

// POST /v1/admin/apikeys - Create API key for specific user (Admin only)
app.post('/v1/admin/apikeys', validateToken, requireRole(['API-Admin']), (req, res) => {
  const { userId, name, permissions } = req.body
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Creating API key for user ${userId}`)
  console.log(`[${timestamp}] Name: "${name}", permissions:`, permissions)

  if (!userId || !name || !permissions || !Array.isArray(permissions)) {
    console.log(`[${timestamp}] Validation failed: Invalid request parameters`)
    return res.status(400).json({
      error: 'Invalid request. UserId, name and permissions array are required.',
    })
  }

  const apiKey = createApiKeyObject(name, permissions, userId)
  apiKeys[apiKey.id] = apiKey

  console.log(`[${timestamp}] Admin: API key created successfully with ID: ${apiKey.id}`)

  setTimeout(() => {
    console.log(`[${timestamp}] Admin: Sending response for API key creation`)
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions,
      created_at: apiKey.created_at,
      expires_at: apiKey.expires_at,
      is_active: apiKey.is_active,
      user_id: apiKey.user_id,
      secret: apiKey.secret,
    })
  }, 1000)
})

// PUT /v1/admin/apikeys/{id}/deactivate - Deactivate API key for any user (Admin only)
app.put(
  '/v1/admin/apikeys/:id/deactivate',
  validateToken,
  requireRole(['API-Admin']),
  (req, res) => {
    const { id } = req.params
    const timestamp = new Date().toISOString()

    console.log(`[${timestamp}] Admin: Deactivating API key with ID: ${id}`)

    const apiKey = apiKeys[id]

    if (!apiKey) {
      console.log(`[${timestamp}] Admin: API key not found for deactivation: ${id}`)
      return res.status(404).json({ error: 'Token not found' })
    }

    console.log(
      `[${timestamp}] Admin: Deactivating API key: "${apiKey.name}" for user: ${apiKey.user_id}`,
    )
    apiKey.is_active = false

    console.log(`[${timestamp}] Admin: API key deactivated successfully`)
    res.status(204).send()
  },
)

// GET /v1/usage/ai - Get AI usage data
app.get('/v1/usage/ai', validateToken, (req, res) => {
  const { from_date, to_date } = req.query
  const userId = req.user.sub
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Getting AI usage data for user: ${userId}`)
  console.log(`[${timestamp}] Date filter - from: ${from_date || 'none'}, to: ${to_date || 'none'}`)

  // Generate detailed mock usage data with createDate
  let mockUsage = []

  if (from_date && to_date) {
    // Custom date range
    const startDate = new Date(from_date)
    const endDate = new Date(to_date)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    mockUsage = generateMockUsageData(userId, startDate, daysDiff)
  } else {
    // Default to 30 days
    mockUsage = mockUsageData30Days(userId)
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
    console.log(
      `[${timestamp}] Filtered usage data: ${filteredUsage.length} entries (from ${mockUsage.length} total)`,
    )
  } else {
    console.log(`[${timestamp}] Returning all usage data: ${mockUsage.length} entries`)
  }

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
  console.log(
    `[${timestamp}] Summary parameters - from: ${from_date || 'none'}, to: ${to_date || 'none'}, by: ${by || 'none'}`,
  )

  // Generate mock data based on the requested time period
  let mockUsage = []

  if (from_date && to_date) {
    // Custom date range
    const startDate = new Date(from_date)
    const endDate = new Date(to_date)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    mockUsage = generateMockUsageData(userId, startDate, daysDiff)
  } else {
    // Default to 30 days
    mockUsage = mockUsageData30Days(userId)
  }

  console.log(`[${timestamp}] Generated ${mockUsage.length} usage records for user ${userId}`)

  res.status(200).json({
    usage: mockUsage,
  })
})

// GET /v1/admin/usage/ai - Get all usage data (Admin only)
app.get('/v1/admin/usage/ai', validateToken, requireRole(['API-Admin']), (req, res) => {
  const { from_date, to_date } = req.query
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting all AI usage data`)
  console.log(`[${timestamp}] Date filter - from: ${from_date || 'none'}, to: ${to_date || 'none'}`)

  // Mock usage data für alle Benutzer
  const mockUsage = [
    {
      user_id: 'user-123',
      model: 'gpt-4',
      tokens_used: 1500,
      cost: 0.045,
      timestamp: new Date().toISOString(),
    },
    {
      user_id: 'user-456',
      model: 'gpt-3.5-turbo',
      tokens_used: 2300,
      cost: 0.00345,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  // Filter by date range if provided
  let filteredUsage = mockUsage
  if (from_date || to_date) {
    filteredUsage = mockUsage.filter((usage) => {
      const usageDate = new Date(usage.timestamp)
      const from = from_date ? new Date(from_date) : new Date(0)
      const to = to_date ? new Date(to_date) : new Date()
      return usageDate >= from && usageDate <= to
    })
    console.log(
      `[${timestamp}] Admin: Filtered usage data: ${filteredUsage.length} entries (from ${mockUsage.length} total)`,
    )
  } else {
    console.log(`[${timestamp}] Admin: Returning all usage data: ${mockUsage.length} entries`)
  }

  res.status(200).json({
    usage: filteredUsage,
  })
})

// GET /v1/admin/usage/ai/summarize - Admin usage summary (mit Security)
app.get('/v1/admin/usage/ai/summarize', validateToken, requireRole(['API-Admin']), (req, res) => {
  const { from_date, to_date, by, model, technicalUserId } = req.query
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Admin: Getting AI usage summary`)
  console.log(
    `[${timestamp}] Admin summary parameters - from: ${from_date || 'none'}, to: ${to_date || 'none'}, by: ${by || 'none'}, model: ${model || 'none'}, technicalUserId: ${technicalUserId || 'none'}`,
  )

  // Generate mock data for all users
  let mockUsage = []

  if (from_date && to_date) {
    // Custom date range
    const startDate = new Date(from_date)
    const endDate = new Date(to_date)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

    // Generate data for multiple users
    const users = ['user-123', 'user-456', 'user-789', 'user-101', 'user-202']
    users.forEach((userId) => {
      const userData = generateMockUsageData(userId, startDate, daysDiff)
      mockUsage.push(...userData)
    })
  } else {
    // Default to 30 days for all users
    const users = ['user-123', 'user-456', 'user-789', 'user-101', 'user-202']
    users.forEach((userId) => {
      const userData = mockUsageData30Days(userId)
      mockUsage.push(...userData)
    })
  }

  // Filter by technicalUserId if specified
  if (technicalUserId) {
    mockUsage = mockUsage.filter((item) => item.technicalUSerid === technicalUserId)
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

// Super Admin Endpunkte

// GET /v1/admin/users - Get all users (Super Admin only)
app.get('/v1/admin/users', validateToken, requireRole(['API-Admin']), (req, res) => {
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Super Admin: Getting all users`)

  // Mock user data
  const mockUsers = [
    {
      id: 'user-123',
      email: 'user@example.com',
      role: 'user',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'admin-456',
      email: 'admin@example.com',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ]

  console.log(`[${timestamp}] Super Admin: Returning ${mockUsers.length} users`)
  res.status(200).json(mockUsers)
})

// PUT /v1/admin/users/{userId}/role - Update user role (Super Admin only)
app.put('/v1/admin/users/:userId/role', validateToken, requireRole(['API-Admin']), (req, res) => {
  const { userId } = req.params
  const { role } = req.body
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Super Admin: Updating role for user ${userId} to ${role}`)

  if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be user, admin, or super_admin' })
  }

  // Mock update
  console.log(`[${timestamp}] Super Admin: Role updated successfully`)
  res.status(200).json({
    id: userId,
    role: role,
    updated_at: new Date().toISOString(),
  })
})

// PUT /v1/admin/users/{userId}/deactivate - Deactivate user (Super Admin only)
app.put(
  '/v1/admin/users/:userId/deactivate',
  validateToken,
  requireRole(['API-Admin']),
  (req, res) => {
    const { userId } = req.params
    const timestamp = new Date().toISOString()

    console.log(`[${timestamp}] Super Admin: Deactivating user ${userId}`)

    // Mock deactivation
    console.log(`[${timestamp}] Super Admin: User deactivated successfully`)
    res.status(204).send()
  },
)

// Legacy Endpunkte für Kompatibilität (falls noch verwendet)
app.get('/api/keys', (req, res) => {
  const email = req.query.email
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Legacy endpoint: Getting API keys for email: ${email}`)

  if (!email) {
    console.log(`[${timestamp}] Legacy endpoint: Email parameter missing`)
    return res.status(400).json({ error: 'E-Mail erforderlich' })
  }

  const keys = Object.values(apiKeys).map((key) => ({
    apiKey: key.secret,
    name: key.name,
    permissions: key.permissions.join(', '),
    createdAt: key.created_at,
    createdBy: 'Domenic Schumacher',
    validUntil: key.expires_at,
    lastUsed: 'Never',
    status: key.is_active ? 'active' : 'revoked',
  }))

  console.log(`[${timestamp}] Legacy endpoint: Returning ${keys.length} API keys`)
  res.json({ keys })
})

app.get('/api/key-stats', (req, res) => {
  const email = req.query.email
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] Legacy endpoint: Getting key stats for email: ${email}`)

  if (!email) {
    console.log(`[${timestamp}] Legacy endpoint: Email parameter missing for stats`)
    return res.status(400).json({ error: 'E-Mail erforderlich' })
  }

  const keys = Object.values(apiKeys)
  let active = 0,
    expired = 0,
    revoked = 0

  for (const k of keys) {
    if (k.is_active) active++
    else if (new Date(k.expires_at) < new Date()) expired++
    else revoked++
  }

  const stats = {
    total: keys.length,
    active,
    expired,
    revoked,
    costs: (keys.length * 0.05).toFixed(2),
  }

  console.log(
    `[${timestamp}] Legacy endpoint: Key stats - Total: ${stats.total}, Active: ${stats.active}, Expired: ${stats.expired}, Revoked: ${stats.revoked}, Costs: $${stats.costs}`,
  )
  res.json(stats)
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Health check requested`)
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ========================================`)
  console.log(`[${timestamp}] Mock API Server gestartet`)
  console.log(`[${timestamp}] Server läuft auf http://localhost:${port}`)
  console.log(`[${timestamp}] ========================================`)
  console.log(`[${timestamp}] Verfügbare Endpunkte:`)
  console.log(`[${timestamp}] OpenAPI v1 Endpunkte (mit JWT Auth):`)
  console.log(`[${timestamp}]   POST http://localhost:${port}/v1/apikeys - Create API key`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/apikeys - List API keys`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/apikeys/:id - Get single API key`)
  console.log(
    `[${timestamp}]   POST http://localhost:${port}/v1/apikeys/:id/rotate - Rotate API key`,
  )
  console.log(
    `[${timestamp}]   PUT  http://localhost:${port}/v1/apikeys/:id/deactivate - Deactivate API key`,
  )
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/usage/ai - Get usage data`)
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/usage/ai/summarize - Get usage summary`,
  )
  console.log(`[${timestamp}] Admin Endpunkte:`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/admin/apikeys - Get all API keys`)
  console.log(
    `[${timestamp}]   POST http://localhost:${port}/v1/admin/apikeys - Create API key for user`,
  )
  console.log(
    `[${timestamp}]   PUT  http://localhost:${port}/v1/admin/apikeys/:id/deactivate - Deactivate any API key`,
  )
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/admin/usage/ai - Get all usage data`,
  )
  console.log(
    `[${timestamp}]   GET  http://localhost:${port}/v1/admin/usage/ai/summarize - Admin usage summary`,
  )
  console.log(`[${timestamp}] Admin Endpunkte (User Management):`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/v1/admin/users - Get all users`)
  console.log(
    `[${timestamp}]   PUT  http://localhost:${port}/v1/admin/users/:id/role - Update user role`,
  )
  console.log(
    `[${timestamp}]   PUT  http://localhost:${port}/v1/admin/users/:id/deactivate - Deactivate user`,
  )
  console.log(`[${timestamp}] Legacy Endpunkte:`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/api/keys - Legacy API keys`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/api/key-stats - Legacy key stats`)
  console.log(`[${timestamp}]   GET  http://localhost:${port}/api/health - Health check`)
  console.log(`[${timestamp}] ========================================`)
  console.log(`[${timestamp}] JWT Token Testing:`)
  console.log(`[${timestamp}]   ?token=admin - Für API-Admin-Rolle`)
  console.log(`[${timestamp}]   ?token=default - Für API-Default-Rolle`)
  console.log(`[${timestamp}]   ?token=stream - Für API-Stream-Rolle`)
  console.log(`[${timestamp}] ========================================`)
})
