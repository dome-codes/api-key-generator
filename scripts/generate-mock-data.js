import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, '..', 'data', 'mock-data.db')

const db = new Database(dbPath)
console.log('Öffne Datenbank:', dbPath)

// Konfiguration
const MONTHS_TO_GENERATE = 12
const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
const tags = ['production', 'development', 'testing', 'staging']
const userIds = ['SVC_ADMIN', 'e12345', 'e54321', 'e11111', 'e33333', 'e77777', 'e88888']
const apiKeys = ['api-key-001', 'api-key-002', 'api-key-003', 'api-key-004', 'api-key-005']
const providers = ['azure-form-recognizer', 'aws-textract', 'google-document-ai']
const extractionTags = ['invoice', 'contract', 'receipt', 'form', 'report']
// Model IDs für verschiedene Provider
const modelIds = [
  'prebuilt-layout', // Azure Form Recognizer
  'prebuilt-document', // Azure Form Recognizer
  'prebuilt-invoice', // Azure Form Recognizer
  'prebuilt-receipt', // Azure Form Recognizer
  'prebuilt-businessCard', // Azure Form Recognizer
  'document-intelligence', // Azure Document Intelligence
  'textract-general', // AWS Textract
  'textract-forms', // AWS Textract
  'textract-tables', // AWS Textract
  'document-ai-general', // Google Document AI
  'document-ai-form-parser', // Google Document AI
  'document-ai-ocr', // Google Document AI
]

// Beginne Transaktion für bessere Performance
const insertAIByDay = db.prepare(`
  INSERT INTO ai_usage_summary_by_day 
  (type, tag, model, apiKeyId, requestTokens, responseTokens, tokensIn, tokensOut, 
   userId, createDate, requests, cost, day, month, year)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertAIByApiKey = db.prepare(`
  INSERT INTO ai_usage_summary_by_apikey 
  (type, tag, model, apiKeyId, requestTokens, responseTokens, tokensIn, tokensOut, 
   userId, createDate, requests, cost, day, month, year)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertExtractionByDay = db.prepare(`
  INSERT INTO extraction_usage_summary_by_day 
  (provider, modelId, tag, operations, totalPages, averageConfidence, cost, 
   userId, apiKeyId, createDate, day, month, year)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertManyAIByDay = db.transaction((items) => {
  for (const item of items) {
    insertAIByDay.run(
      item.type,
      item.tag,
      item.model,
      item.apiKeyId,
      item.requestTokens,
      item.responseTokens,
      item.tokensIn,
      item.tokensOut,
      item.userId,
      item.createDate,
      item.requests,
      item.cost,
      item.day,
      item.month,
      item.year,
    )
  }
})

const insertManyAIByApiKey = db.transaction((items) => {
  for (const item of items) {
    insertAIByApiKey.run(
      item.type,
      item.tag,
      item.model,
      item.apiKeyId,
      item.requestTokens,
      item.responseTokens,
      item.tokensIn,
      item.tokensOut,
      item.userId,
      item.createDate,
      item.requests,
      item.cost,
      item.day,
      item.month,
      item.year,
    )
  }
})

const insertManyExtractionByDay = db.transaction((items) => {
  for (const item of items) {
    insertExtractionByDay.run(
      item.provider,
      item.modelId,
      item.tag,
      item.operations,
      item.totalPages,
      item.averageConfidence,
      item.cost,
      item.userId,
      item.apiKeyId,
      item.createDate,
      item.day,
      item.month,
      item.year,
    )
  }
})

// Generiere Daten für die letzten N Monate
const today = new Date()
const startDate = new Date(today)
startDate.setMonth(startDate.getMonth() - MONTHS_TO_GENERATE)

console.log(
  `Generiere Daten von ${startDate.toISOString().split('T')[0]} bis ${today.toISOString().split('T')[0]}`,
)

// Zähle Tage
let currentDate = new Date(startDate)
let totalDays = 0
while (currentDate <= today) {
  totalDays++
  currentDate.setDate(currentDate.getDate() + 1)
}

console.log(`Generiere Daten für ${totalDays} Tage...`)

// Generiere AI Usage Summary nach Tag
const aiByDayData = []
const aiByApiKeyData = []
const extractionByDayData = []

currentDate = new Date(startDate)
let dayCount = 0

while (currentDate <= today) {
  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const dayOfWeek = currentDate.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // AI Usage - mehrere Einträge pro Tag
  const entriesPerDay = Math.floor(Math.random() * 6) + 3
  const baseMultiplier = isWeekend ? 0.6 : 1.2

  for (let j = 0; j < entriesPerDay; j++) {
    const requests = Math.floor((Math.random() * 200 + 50) * baseMultiplier)
    const apiKeyId = apiKeys[Math.floor(Math.random() * apiKeys.length)]
    const tag = tags[Math.floor(Math.random() * tags.length)]
    const userId = userIds[Math.floor(Math.random() * userIds.length)]

    // Zufälliger Typ: 60% Completion, 25% Embedding, 15% Image
    const typeRoll = Math.random()
    let type, model, requestTokens, responseTokens, cost

    if (typeRoll < 0.6) {
      // CompletionModelUsage
      type = 'CompletionModelUsage'
      model = models[Math.floor(Math.random() * models.length)]
      requestTokens = Math.floor(requests * (Math.random() * 200 + 150))
      responseTokens = Math.floor(requestTokens * (Math.random() * 0.4 + 0.3))
      cost = requestTokens * 0.000001 + responseTokens * 0.000003
    } else if (typeRoll < 0.85) {
      // EmbeddingModelUsage
      type = 'EmbeddingModelUsage'
      model = 'text-embedding-3-large'
      requestTokens = Math.floor(requests * (Math.random() * 100 + 50))
      responseTokens = 0 // Embeddings haben keine Response-Tokens
      cost = requestTokens * 0.0000001
    } else {
      // ImageModelUsage
      type = 'ImageModelUsage'
      model = 'dall-e-3'
      requestTokens = Math.floor(requests * 10) // Images haben weniger Tokens
      responseTokens = 0
      cost = requests * 0.04 // Images kosten mehr pro Request
    }

    const createDate = new Date(
      year,
      month - 1,
      day,
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60),
    ).toISOString()

    aiByDayData.push({
      type,
      tag,
      model,
      apiKeyId,
      requestTokens,
      responseTokens,
      tokensIn: requestTokens,
      tokensOut: responseTokens,
      userId: userId,
      createDate,
      requests,
      cost,
      day,
      month,
      year,
    })

    // Für API Key Gruppierung: aggregiere pro API Key pro Tag
    const existingApiKeyEntry = aiByApiKeyData.find(
      (e) => e.apiKeyId === apiKeyId && e.day === day && e.month === month && e.year === year,
    )

    if (existingApiKeyEntry) {
      existingApiKeyEntry.requestTokens += requestTokens
      existingApiKeyEntry.responseTokens += responseTokens
      existingApiKeyEntry.tokensIn += requestTokens
      existingApiKeyEntry.tokensOut += responseTokens
      existingApiKeyEntry.requests += requests
      existingApiKeyEntry.cost += cost
    } else {
      aiByApiKeyData.push({
        type,
        tag: 'aggregated',
        model: type === 'CompletionModelUsage' ? 'mixed' : model,
        apiKeyId,
        requestTokens,
        responseTokens,
        tokensIn: requestTokens,
        tokensOut: responseTokens,
        userId: userId,
        createDate,
        requests,
        cost,
        day,
        month,
        year,
      })
    }
  }

  // Extraction Usage - ein Eintrag pro Tag
  const operations = Math.floor((Math.random() * 200 + 50) * baseMultiplier)
  const totalPages = Math.floor(operations * (Math.random() * 3 + 1))
  const averageConfidence = Math.random() * 0.2 + 0.75 // 75-95%
  const cost = operations * (Math.random() * 0.1 + 0.05)
  const provider = providers[Math.floor(Math.random() * providers.length)]
  const modelId = modelIds[Math.floor(Math.random() * modelIds.length)]
  const tag = extractionTags[Math.floor(Math.random() * extractionTags.length)]
  const userId = userIds[Math.floor(Math.random() * userIds.length)]
  const apiKeyId = apiKeys[Math.floor(Math.random() * apiKeys.length)]

  const createDate = new Date(
    year,
    month - 1,
    day,
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
  ).toISOString()

  extractionByDayData.push({
    provider,
    modelId,
    tag,
    operations,
    totalPages,
    averageConfidence,
    cost,
    userId: userId,
    apiKeyId,
    createDate,
    day,
    month,
    year,
  })

  dayCount++
  if (dayCount % 30 === 0) {
    console.log(`  ${dayCount}/${totalDays} Tage verarbeitet...`)
  }

  currentDate.setDate(currentDate.getDate() + 1)
}

console.log(`\nFüge ${aiByDayData.length} AI Usage Einträge (nach Tag) ein...`)
insertManyAIByDay(aiByDayData)

console.log(`Füge ${aiByApiKeyData.length} AI Usage Einträge (nach API Key) ein...`)
insertManyAIByApiKey(aiByApiKeyData)

console.log(`Füge ${extractionByDayData.length} Extraction Usage Einträge ein...`)
insertManyExtractionByDay(extractionByDayData)

// Statistiken
const aiDayCount = db.prepare('SELECT COUNT(*) as count FROM ai_usage_summary_by_day').get()
const aiApiKeyCount = db.prepare('SELECT COUNT(*) as count FROM ai_usage_summary_by_apikey').get()
const extractionCount = db
  .prepare('SELECT COUNT(*) as count FROM extraction_usage_summary_by_day')
  .get()

console.log('\n✅ Daten erfolgreich generiert:')
console.log(`  - AI Usage (nach Tag): ${aiDayCount.count} Einträge`)
console.log(`  - AI Usage (nach API Key): ${aiApiKeyCount.count} Einträge`)
console.log(`  - Extraction Usage: ${extractionCount.count} Einträge`)

db.close()
console.log('\n✅ Datenbank geschlossen')
