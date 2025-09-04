// Mock-Daten für API Keys und Usage-Daten
// Diese Daten werden als Grundlage für die Mock API verwendet

// Hardcodierte API Keys
const MOCK_API_KEYS = [
  {
    id: 'api-key-001',
    name: 'Production API Key',
    permissions: ['api-access'],
    created_at: '2025-08-01T10:00:00.000Z',
    expires_at: '2026-08-01T10:00:00.000Z',
    is_active: true,
    user_id: 'user-001',
    user_name: 'Admin User',
  },
  {
    id: 'api-key-002',
    name: 'Development API Key',
    permissions: ['api-access'],
    created_at: '2025-08-15T14:30:00.000Z',
    expires_at: '2026-08-15T14:30:00.000Z',
    is_active: true,
    user_id: 'user-002',
    user_name: 'Developer User',
  },
  {
    id: 'api-key-003',
    name: 'Testing API Key',
    permissions: ['api-access'],
    created_at: '2025-09-01T09:00:00.000Z',
    expires_at: '2026-09-01T09:00:00.000Z',
    is_active: true,
    user_id: 'user-003',
    user_name: 'Tester User',
  },
  {
    id: 'api-key-004',
    name: 'High Usage API Key',
    permissions: ['api-access'],
    created_at: '2025-08-10T08:00:00.000Z',
    expires_at: '2026-08-10T08:00:00.000Z',
    is_active: true,
    user_id: 'user-004',
    user_name: 'High Usage User',
  },
  {
    id: 'api-key-005',
    name: 'Marketing Campaign Key',
    permissions: ['api-access'],
    created_at: '2025-08-20T12:00:00.000Z',
    expires_at: '2026-08-20T12:00:00.000Z',
    is_active: true,
    user_id: 'user-005',
    user_name: 'Marketing User',
  },
  {
    id: 'api-key-006',
    name: 'Analytics Dashboard Key',
    permissions: ['api-access'],
    created_at: '2025-08-25T16:00:00.000Z',
    expires_at: '2026-08-25T16:00:00.000Z',
    is_active: true,
    user_id: 'user-006',
    user_name: 'Analytics User',
  },
  {
    id: 'api-key-007',
    name: 'Customer Support Key',
    permissions: ['api-access'],
    created_at: '2025-09-01T07:00:00.000Z',
    expires_at: '2026-09-01T07:00:00.000Z',
    is_active: true,
    user_id: 'user-007',
    user_name: 'Support User',
  },
  {
    id: 'api-key-008',
    name: 'Research Project Key',
    permissions: ['api-access'],
    created_at: '2025-08-05T09:00:00.000Z',
    expires_at: '2026-08-05T09:00:00.000Z',
    is_active: false, // Deaktiviert
    user_id: 'user-008',
    user_name: 'Research User',
  },
  {
    id: 'api-key-009',
    name: 'Mobile App Key',
    permissions: ['api-access'],
    created_at: '2025-08-12T11:00:00.000Z',
    expires_at: '2026-08-12T11:00:00.000Z',
    is_active: false, // Deaktiviert
    user_id: 'user-009',
    user_name: 'Mobile Developer',
  },
  {
    id: 'api-key-010',
    name: 'Data Processing Key',
    permissions: ['api-access'],
    created_at: '2025-08-18T13:00:00.000Z',
    expires_at: '2026-08-18T13:00:00.000Z',
    is_active: true,
    user_id: 'user-010',
    user_name: 'Data Scientist',
  },
  {
    id: 'api-key-011',
    name: 'Chatbot Integration Key',
    permissions: ['api-access'],
    created_at: '2025-08-22T15:00:00.000Z',
    expires_at: '2026-08-22T15:00:00.000Z',
    is_active: true,
    user_id: 'user-011',
    user_name: 'Chatbot Developer',
  },
  {
    id: 'api-key-012',
    name: 'Content Generation Key',
    permissions: ['api-access'],
    created_at: '2025-08-28T17:00:00.000Z',
    expires_at: '2026-08-28T17:00:00.000Z',
    is_active: true,
    user_id: 'user-012',
    user_name: 'Content Creator',
  },
  {
    id: 'api-key-013',
    name: 'Translation Service Key',
    permissions: ['api-access'],
    created_at: '2025-09-02T19:00:00.000Z',
    expires_at: '2026-09-02T19:00:00.000Z',
    is_active: true,
    user_id: 'user-013',
    user_name: 'Translation Expert',
  },
  {
    id: 'api-key-014',
    name: 'Voice Assistant Key',
    permissions: ['api-access'],
    created_at: '2025-09-05T21:00:00.000Z',
    expires_at: '2026-09-05T21:00:00.000Z',
    is_active: true,
    user_id: 'user-014',
    user_name: 'Voice Developer',
  },
  {
    id: 'api-key-015',
    name: 'Document Analysis Key',
    permissions: ['api-access'],
    created_at: '2025-09-08T23:00:00.000Z',
    expires_at: '2026-09-08T23:00:00.000Z',
    is_active: true,
    user_id: 'user-015',
    user_name: 'Document Analyst',
  },
]

// Hardcodierte Usage-Daten (gruppiert nach API Key)
const MOCK_USAGE_DATA = [
  // API Key 001 - Production
  {
    type: 'CompletionModelUsage',
    tag: 'production',
    model: 'gpt-4o',
    apiKeyId: 'api-key-001',
    requestTokens: 50000,
    responseTokens: 25000,
    technicalUserId: 'user-001',
    requests: 150,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'production',
    model: 'claude-3-haiku',
    apiKeyId: 'api-key-001',
    requestTokens: 30000,
    responseTokens: 15000,
    technicalUserId: 'user-001',
    requests: 100,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'production',
    model: 'text-embedding-3-large',
    apiKeyId: 'api-key-001',
    requestTokens: 20000,
    responseTokens: 0,
    technicalUserId: 'user-001',
    requests: 50,
  },

  // API Key 002 - Development
  {
    type: 'CompletionModelUsage',
    tag: 'development',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-002',
    requestTokens: 25000,
    responseTokens: 12000,
    technicalUserId: 'user-002',
    requests: 80,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'development',
    model: 'claude-3-haiku',
    apiKeyId: 'api-key-002',
    requestTokens: 15000,
    responseTokens: 8000,
    technicalUserId: 'user-002',
    requests: 60,
  },
  {
    type: 'ImageModelUsage',
    tag: 'development',
    model: 'dall-e-3',
    apiKeyId: 'api-key-002',
    sizeWidth: 1792,
    sizeHeight: 1024,
    quality: 'hd',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'user-002',
    requests: 10,
  },

  // API Key 003 - Testing
  {
    type: 'CompletionModelUsage',
    tag: 'testing',
    model: 'gpt-4o',
    apiKeyId: 'api-key-003',
    requestTokens: 10000,
    responseTokens: 5000,
    technicalUserId: 'user-003',
    requests: 30,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'testing',
    model: 'text-embedding-3-small',
    apiKeyId: 'api-key-003',
    requestTokens: 5000,
    responseTokens: 0,
    technicalUserId: 'user-003',
    requests: 20,
  },

  // API Key 004 - High Usage (über 70% Budget erreicht - ca. 75€)
  {
    type: 'CompletionModelUsage',
    tag: 'high-usage',
    model: 'gpt-4o',
    apiKeyId: 'api-key-004',
    requestTokens: 8000000, // 8M Tokens
    responseTokens: 4000000, // 4M Tokens
    technicalUserId: 'user-004',
    requests: 450,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'high-usage',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-004',
    requestTokens: 4000000, // 4M Tokens
    responseTokens: 2000000, // 2M Tokens
    technicalUserId: 'user-004',
    requests: 300,
  },
  {
    type: 'ImageModelUsage',
    tag: 'high-usage',
    model: 'dall-e-3',
    apiKeyId: 'api-key-004',
    sizeWidth: 1792,
    sizeHeight: 1024,
    quality: 'hd',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'user-004',
    requests: 25,
  },

  // API Key 005 - Marketing Campaign (über 80% Budget erreicht - ca. 82€)
  {
    type: 'CompletionModelUsage',
    tag: 'marketing',
    model: 'gpt-4o',
    apiKeyId: 'api-key-005',
    requestTokens: 9000000, // 9M Tokens
    responseTokens: 4500000, // 4.5M Tokens
    technicalUserId: 'user-005',
    requests: 600,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'marketing',
    model: 'claude-3-haiku',
    apiKeyId: 'api-key-005',
    requestTokens: 3000000, // 3M Tokens
    responseTokens: 1500000, // 1.5M Tokens
    technicalUserId: 'user-005',
    requests: 200,
  },
  {
    type: 'ImageModelUsage',
    tag: 'marketing',
    model: 'dall-e-3',
    apiKeyId: 'api-key-005',
    sizeWidth: 1024,
    sizeHeight: 1024,
    quality: 'standard',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'user-005',
    requests: 50,
  },

  // API Key 006 - Analytics Dashboard (über 90% Budget erreicht - ca. 92€)
  {
    type: 'CompletionModelUsage',
    tag: 'analytics',
    model: 'gpt-4o',
    apiKeyId: 'api-key-006',
    requestTokens: 10000000, // 10M Tokens
    responseTokens: 5000000, // 5M Tokens
    technicalUserId: 'user-006',
    requests: 700,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'analytics',
    model: 'text-embedding-3-large',
    apiKeyId: 'api-key-006',
    requestTokens: 4000000, // 4M Tokens
    responseTokens: 0,
    technicalUserId: 'user-006',
    requests: 250,
  },

  // API Key 007 - Customer Support (über 95% Budget erreicht - ca. 96€)
  {
    type: 'CompletionModelUsage',
    tag: 'support',
    model: 'gpt-4o',
    apiKeyId: 'api-key-007',
    requestTokens: 11000000, // 11M Tokens
    responseTokens: 5500000, // 5.5M Tokens
    technicalUserId: 'user-007',
    requests: 800,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'support',
    model: 'claude-3-haiku',
    apiKeyId: 'api-key-007',
    requestTokens: 3000000, // 3M Tokens
    responseTokens: 1500000, // 1.5M Tokens
    technicalUserId: 'user-007',
    requests: 300,
  },

  // API Key 008 - Research Project (über 100% Budget erreicht - ca. 105€)
  {
    type: 'CompletionModelUsage',
    tag: 'research',
    model: 'gpt-4o',
    apiKeyId: 'api-key-008',
    requestTokens: 12000000, // 12M Tokens
    responseTokens: 6000000, // 6M Tokens
    technicalUserId: 'user-008',
    requests: 900,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'research',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-008',
    requestTokens: 4000000, // 4M Tokens
    responseTokens: 2000000, // 2M Tokens
    technicalUserId: 'user-008',
    requests: 400,
  },
  {
    type: 'ImageModelUsage',
    tag: 'research',
    model: 'dall-e-3',
    apiKeyId: 'api-key-008',
    sizeWidth: 1792,
    sizeHeight: 1024,
    quality: 'hd',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'user-008',
    requests: 75,
  },

  // API Key 009 - Mobile App (normale Nutzung - ca. 15€)
  {
    type: 'CompletionModelUsage',
    tag: 'mobile',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-009',
    requestTokens: 2000000, // 2M Tokens
    responseTokens: 1000000, // 1M Tokens
    technicalUserId: 'user-009',
    requests: 150,
  },

  // API Key 010 - Data Processing (normale Nutzung - ca. 25€)
  {
    type: 'CompletionModelUsage',
    tag: 'data-processing',
    model: 'gpt-4o',
    apiKeyId: 'api-key-010',
    requestTokens: 3000000, // 3M Tokens
    responseTokens: 1500000, // 1.5M Tokens
    technicalUserId: 'user-010',
    requests: 200,
  },

  // API Key 011 - Chatbot Integration (normale Nutzung - ca. 35€)
  {
    type: 'CompletionModelUsage',
    tag: 'chatbot',
    model: 'gpt-4o',
    apiKeyId: 'api-key-011',
    requestTokens: 4000000, // 4M Tokens
    responseTokens: 2000000, // 2M Tokens
    technicalUserId: 'user-011',
    requests: 300,
  },

  // API Key 012 - Content Generation (normale Nutzung - ca. 45€)
  {
    type: 'CompletionModelUsage',
    tag: 'content',
    model: 'gpt-4o',
    apiKeyId: 'api-key-012',
    requestTokens: 5000000, // 5M Tokens
    responseTokens: 2500000, // 2.5M Tokens
    technicalUserId: 'user-012',
    requests: 400,
  },

  // API Key 013 - Translation Service (normale Nutzung - ca. 55€)
  {
    type: 'CompletionModelUsage',
    tag: 'translation',
    model: 'gpt-4o',
    apiKeyId: 'api-key-013',
    requestTokens: 6000000, // 6M Tokens
    responseTokens: 3000000, // 3M Tokens
    technicalUserId: 'user-013',
    requests: 500,
  },

  // API Key 014 - Voice Assistant (normale Nutzung - ca. 65€)
  {
    type: 'CompletionModelUsage',
    tag: 'voice',
    model: 'gpt-4o',
    apiKeyId: 'api-key-014',
    requestTokens: 7000000, // 7M Tokens
    responseTokens: 3500000, // 3.5M Tokens
    technicalUserId: 'user-014',
    requests: 600,
  },

  // API Key 015 - Document Analysis (normale Nutzung - ca. 75€)
  {
    type: 'CompletionModelUsage',
    tag: 'document',
    model: 'gpt-4o',
    apiKeyId: 'api-key-015',
    requestTokens: 8000000, // 8M Tokens
    responseTokens: 4000000, // 4M Tokens
    technicalUserId: 'user-015',
    requests: 700,
  },
]

// Gruppierte Usage-Daten nach API Key (für Summarize API)
const MOCK_USAGE_SUMMARY_BY_APIKEY = [
  {
    type: 'CompletionModelUsage',
    tag: 'production',
    model: 'gpt-4o',
    apiKeyId: 'api-key-001',
    requestTokens: 80000, // Summe von gpt-4o + claude-3-haiku + embedding
    responseTokens: 40000,
    technicalUserId: 'user-001',
    requests: 300, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'development',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-002',
    requestTokens: 40000, // Summe von gpt-4o-mini + claude-3-haiku + dall-e-3
    responseTokens: 20000,
    technicalUserId: 'user-002',
    requests: 150, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'testing',
    model: 'gpt-4o',
    apiKeyId: 'api-key-003',
    requestTokens: 15000, // Summe von gpt-4o + embedding
    responseTokens: 5000,
    technicalUserId: 'user-003',
    requests: 50, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'high-usage',
    model: 'gpt-4o',
    apiKeyId: 'api-key-004',
    requestTokens: 12000000, // Summe aller Tokens für High Usage
    responseTokens: 6000000,
    technicalUserId: 'user-004',
    requests: 775, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'marketing',
    model: 'gpt-4o',
    apiKeyId: 'api-key-005',
    requestTokens: 12000000, // Summe aller Tokens für Marketing
    responseTokens: 6000000,
    technicalUserId: 'user-005',
    requests: 850, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'analytics',
    model: 'gpt-4o',
    apiKeyId: 'api-key-006',
    requestTokens: 14000000, // Summe aller Tokens für Analytics
    responseTokens: 5000000,
    technicalUserId: 'user-006',
    requests: 950, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'support',
    model: 'gpt-4o',
    apiKeyId: 'api-key-007',
    requestTokens: 14000000, // Summe aller Tokens für Support
    responseTokens: 7000000,
    technicalUserId: 'user-007',
    requests: 1100, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'research',
    model: 'gpt-4o',
    apiKeyId: 'api-key-008',
    requestTokens: 16000000, // Summe aller Tokens für Research
    responseTokens: 8000000,
    technicalUserId: 'user-008',
    requests: 1375, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'mobile',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-009',
    requestTokens: 2000000, // Summe aller Tokens für Mobile App
    responseTokens: 1000000,
    technicalUserId: 'user-009',
    requests: 150, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'data-processing',
    model: 'gpt-4o',
    apiKeyId: 'api-key-010',
    requestTokens: 3000000, // Summe aller Tokens für Data Processing
    responseTokens: 1500000,
    technicalUserId: 'user-010',
    requests: 200, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'chatbot',
    model: 'gpt-4o',
    apiKeyId: 'api-key-011',
    requestTokens: 4000000, // Summe aller Tokens für Chatbot
    responseTokens: 2000000,
    technicalUserId: 'user-011',
    requests: 300, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'content',
    model: 'gpt-4o',
    apiKeyId: 'api-key-012',
    requestTokens: 5000000, // Summe aller Tokens für Content Generation
    responseTokens: 2500000,
    technicalUserId: 'user-012',
    requests: 400, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'translation',
    model: 'gpt-4o',
    apiKeyId: 'api-key-013',
    requestTokens: 6000000, // Summe aller Tokens für Translation
    responseTokens: 3000000,
    technicalUserId: 'user-013',
    requests: 500, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'voice',
    model: 'gpt-4o',
    apiKeyId: 'api-key-014',
    requestTokens: 7000000, // Summe aller Tokens für Voice Assistant
    responseTokens: 3500000,
    technicalUserId: 'user-014',
    requests: 600, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'document',
    model: 'gpt-4o',
    apiKeyId: 'api-key-015',
    requestTokens: 8000000, // Summe aller Tokens für Document Analysis
    responseTokens: 4000000,
    technicalUserId: 'user-015',
    requests: 700, // Summe aller Requests
    day: 1,
    month: 9,
    year: 2025,
  },
]

// Helper-Funktionen
const getApiKeyById = (id) => {
  return MOCK_API_KEYS.find((key) => key.id === id)
}

const getUsageByApiKeyId = (apiKeyId) => {
  return MOCK_USAGE_DATA.filter((usage) => usage.apiKeyId === apiKeyId)
}

const getUsageSummaryByApiKeyId = (apiKeyId) => {
  return MOCK_USAGE_SUMMARY_BY_APIKEY.find((summary) => summary.apiKeyId === apiKeyId)
}

const getAllUsageData = () => {
  return [...MOCK_USAGE_DATA]
}

const getAllUsageSummaryByApiKey = () => {
  return [...MOCK_USAGE_SUMMARY_BY_APIKEY]
}

const getAllApiKeys = () => {
  return [...MOCK_API_KEYS]
}

// Export für Mock API
export {
  MOCK_API_KEYS,
  MOCK_USAGE_DATA,
  MOCK_USAGE_SUMMARY_BY_APIKEY,
  getAllApiKeys,
  getAllUsageData,
  getAllUsageSummaryByApiKey,
  getApiKeyById,
  getUsageByApiKeyId,
  getUsageSummaryByApiKeyId,
}
