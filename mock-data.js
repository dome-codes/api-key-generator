// Mock-Daten für API Keys und Usage-Daten
// Diese Daten werden als Grundlage für die Mock API verwendet

import { v4 as uuidv4 } from 'uuid'

// Hardcodierte API Keys - Erweitert mit mehr Nutzern und verschiedenen Szenarien
const MOCK_API_KEYS = [
  // ADMIN Gruppe (1 Nutzer)
  {
    id: 'api-key-001',
    name: 'Admin Production Key',
    permissions: ['api-access'],
    createdAt: '2025-09-15T10:00:00.000Z',
    expiresAt: '2026-08-01T10:00:00.000Z',
    active: true,
    userId: 'SVC_ADMIN',
    userName: 'SVC_ADMIN',
  },

  // ENTWICKLUNG Gruppe - e-Nutzer (8 Nutzer)
  {
    id: 'api-key-002',
    name: 'Frontend Development Key',
    permissions: ['api-access'],
    createdAt: '2025-08-15T14:30:00.000Z',
    expiresAt: '2026-08-15T14:30:00.000Z',
    active: true,
    userId: 'e12345',
    userName: 'e12345',
  },
  {
    id: 'api-key-003',
    name: 'Backend Development Key',
    permissions: ['api-access'],
    createdAt: '2025-08-16T09:15:00.000Z',
    expiresAt: '2026-08-16T09:15:00.000Z',
    active: true,
    userId: 'e54321',
    userName: 'e54321',
  },
  {
    id: 'api-key-004',
    name: 'Mobile Development Key',
    permissions: ['api-access'],
    createdAt: '2025-08-17T11:30:00.000Z',
    expiresAt: '2026-08-17T11:30:00.000Z',
    active: true,
    userId: 'e11111',
    userName: 'e11111',
  },
  {
    id: 'api-key-005',
    name: 'DevOps Development Key',
    permissions: ['api-access'],
    createdAt: '2025-08-18T13:45:00.000Z',
    expiresAt: '2026-08-18T13:45:00.000Z',
    active: true,
    userId: 'e33333',
    userName: 'e33333',
  },
  {
    id: 'api-key-006',
    name: 'QA Development Key',
    permissions: ['api-access'],
    createdAt: '2025-08-19T15:20:00.000Z',
    expiresAt: '2026-08-19T15:20:00.000Z',
    active: true,
    userId: 'e77777',
    userName: 'e77777',
  },
  {
    id: 'api-key-007',
    name: 'UI/UX Development Key',
    permissions: ['api-access'],
    createdAt: '2025-09-15T16:10:00.000Z',
    expiresAt: '2026-08-20T16:10:00.000Z',
    active: true,
    userId: 'e88888',
    userName: 'e88888',
  },
  {
    id: 'api-key-008',
    name: 'Data Science Development Key',
    permissions: ['api-access'],
    createdAt: '2025-08-21T08:25:00.000Z',
    expiresAt: '2026-08-21T08:25:00.000Z',
    active: true,
    userId: 'e99999',
    userName: 'e99999',
  },
  {
    id: 'api-key-009',
    name: 'Security Development Key',
    permissions: ['api-access'],
    createdAt: '2025-08-22T10:40:00.000Z',
    expiresAt: '2026-08-22T10:40:00.000Z',
    active: true,
    userId: 'e00000',
    userName: 'e00000',
  },

  // ENTWICKLUNG Gruppe - b-Nutzer (6 Nutzer)
  {
    id: 'api-key-010',
    name: 'Business Analyst Key',
    permissions: ['api-access'],
    createdAt: '2025-08-23T12:00:00.000Z',
    expiresAt: '2026-08-23T12:00:00.000Z',
    active: true,
    userId: 'b67890',
    userName: 'b67890',
  },
  {
    id: 'api-key-011',
    name: 'Business Intelligence Key',
    permissions: ['api-access'],
    createdAt: '2025-08-24T14:15:00.000Z',
    expiresAt: '2026-08-24T14:15:00.000Z',
    active: true,
    userId: 'b98765',
    userName: 'b98765',
  },
  {
    id: 'api-key-012',
    name: 'Business Process Key',
    permissions: ['api-access'],
    createdAt: '2025-08-25T16:30:00.000Z',
    expiresAt: '2026-08-25T16:30:00.000Z',
    active: true,
    userId: 'b22222',
    userName: 'b22222',
  },
  {
    id: 'api-key-013',
    name: 'Business Operations Key',
    permissions: ['api-access'],
    createdAt: '2025-08-26T18:45:00.000Z',
    expiresAt: '2026-08-26T18:45:00.000Z',
    active: true,
    userId: 'b44444',
    userName: 'b44444',
  },
  {
    id: 'api-key-014',
    name: 'Business Strategy Key',
    permissions: ['api-access'],
    createdAt: '2025-08-27T20:00:00.000Z',
    expiresAt: '2026-08-27T20:00:00.000Z',
    active: true,
    userId: 'b55555',
    userName: 'b55555',
  },
  {
    id: 'api-key-015',
    name: 'Business Development Key',
    permissions: ['api-access'],
    createdAt: '2025-08-28T22:15:00.000Z',
    expiresAt: '2026-08-28T22:15:00.000Z',
    active: true,
    userId: 'b66666',
    userName: 'b66666',
  },

  // TECHNISCHE NUTZER Gruppe (6 Nutzer)
  {
    id: 'api-key-016',
    name: 'Monitoring Service Key',
    permissions: ['api-access'],
    createdAt: '2025-08-29T08:30:00.000Z',
    expiresAt: '2026-08-29T08:30:00.000Z',
    active: true,
    userId: 'SVC_MONITOR',
    userName: 'SVC_MONITOR',
  },
  {
    id: 'api-key-017',
    name: 'Analytics Service Key',
    permissions: ['api-access'],
    createdAt: '2025-08-30T10:45:00.000Z',
    expiresAt: '2026-08-30T10:45:00.000Z',
    active: true,
    userId: 'SVC_ANALYTICS',
    userName: 'SVC_ANALYTICS',
  },
  {
    id: 'api-key-018',
    name: 'Data Processing Service Key',
    permissions: ['api-access'],
    createdAt: '2025-08-31T12:00:00.000Z',
    expiresAt: '2026-08-31T12:00:00.000Z',
    active: true,
    userId: 'SVC_DATA',
    userName: 'SVC_DATA',
  },
  {
    id: 'api-key-019',
    name: 'Translation Service Key',
    permissions: ['api-access'],
    createdAt: '2025-09-15T14:15:00.000Z',
    expiresAt: '2026-09-01T14:15:00.000Z',
    active: true,
    userId: 'SVC_TRANSLATE',
    userName: 'SVC_TRANSLATE',
  },
  {
    id: 'api-key-020',
    name: 'Notification Service Key',
    permissions: ['api-access'],
    createdAt: '2025-09-02T16:30:00.000Z',
    expiresAt: '2026-09-02T16:30:00.000Z',
    active: true,
    userId: 'SVC_NOTIFY',
    userName: 'SVC_NOTIFY',
  },
  {
    id: 'api-key-021',
    name: 'Backup Service Key',
    permissions: ['api-access'],
    createdAt: '2025-09-03T18:45:00.000Z',
    expiresAt: '2026-09-03T18:45:00.000Z',
    active: true,
    userId: 'SVC_BACKUP',
    userName: 'SVC_BACKUP',
  },

  // DEFAULT Gruppe (5 Nutzer)
  {
    id: 'api-key-022',
    name: 'Marketing Manager Key',
    permissions: ['api-access'],
    createdAt: '2025-09-04T09:00:00.000Z',
    expiresAt: '2026-09-04T09:00:00.000Z',
    active: true,
    userId: 'john.doe',
    userName: 'john.doe',
  },
  {
    id: 'api-key-023',
    name: 'Sales Manager Key',
    permissions: ['api-access'],
    createdAt: '2025-09-05T11:15:00.000Z',
    expiresAt: '2026-09-05T11:15:00.000Z',
    active: true,
    userId: 'jane.smith',
    userName: 'jane.smith',
  },
  {
    id: 'api-key-024',
    name: 'HR Manager Key',
    permissions: ['api-access'],
    createdAt: '2025-09-06T13:30:00.000Z',
    expiresAt: '2026-09-06T13:30:00.000Z',
    active: true,
    userId: 'mike.wilson',
    userName: 'mike.wilson',
  },
  {
    id: 'api-key-025',
    name: 'Finance Manager Key',
    permissions: ['api-access'],
    createdAt: '2025-09-07T15:45:00.000Z',
    expiresAt: '2026-09-07T15:45:00.000Z',
    active: true,
    userId: 'sarah.jones',
    userName: 'sarah.jones',
  },
  {
    id: 'api-key-026',
    name: 'Customer Success Key',
    permissions: ['api-access'],
    createdAt: '2025-09-08T17:00:00.000Z',
    expiresAt: '2026-09-08T17:00:00.000Z',
    active: false, // Deaktiviert
    userId: 'tom.brown',
    userName: 'tom.brown',
  },

  // Zusätzliche API-Keys für bestehende Nutzer (um doppelte Nutzer zu testen)
  {
    id: 'api-key-027',
    name: 'e12345 Secondary Key',
    permissions: ['api-access'],
    createdAt: '2025-09-15T10:30:00.000Z',
    expiresAt: '2026-09-15T10:30:00.000Z',
    active: true,
    userId: 'e12345',
    userName: 'e12345',
  },
  {
    id: 'api-key-028',
    name: 'e12345 Testing Key',
    permissions: ['api-access'],
    createdAt: '2025-09-16T11:00:00.000Z',
    expiresAt: '2026-09-16T11:00:00.000Z',
    active: true,
    userId: 'e12345',
    userName: 'e12345',
  },
  {
    id: 'api-key-029',
    name: 'john.doe Personal Key',
    permissions: ['api-access'],
    createdAt: '2025-09-17T14:20:00.000Z',
    expiresAt: '2026-09-17T14:20:00.000Z',
    active: true,
    userId: 'john.doe',
    userName: 'john.doe',
  },
  {
    id: 'api-key-030',
    name: 'SVC_ADMIN Backup Key',
    permissions: ['api-access'],
    createdAt: '2025-09-18T09:15:00.000Z',
    expiresAt: '2026-09-18T09:15:00.000Z',
    active: true,
    userId: 'SVC_ADMIN',
    userName: 'SVC_ADMIN',
  },
]

// Hardcodierte Usage-Daten - Erweitert mit verschiedenen Szenarien
const MOCK_USAGE_DATA = [
  // ADMIN Gruppe - SVC_ADMIN (Hohe Nutzung, verschiedene Modelle)
  {
    type: 'CompletionModelUsage',
    tag: 'admin-production',
    model: 'gpt-4o',
    apiKeyId: 'api-key-001',
    requestTokens: 150000,
    responseTokens: 75000,
    technicalUserId: 'SVC_ADMIN',
    createDate: '2025-09-15T10:00:00.000Z',
    requests: 450,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'admin-monitoring',
    model: 'claude-3-sonnet',
    apiKeyId: 'api-key-001',
    requestTokens: 80000,
    responseTokens: 40000,
    technicalUserId: 'SVC_ADMIN',
    createDate: '2025-09-15T11:30:00.000Z',
    requests: 200,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'admin-analytics',
    model: 'text-embedding-3-large',
    apiKeyId: 'api-key-001',
    requestTokens: 50000,
    responseTokens: 0,
    technicalUserId: 'SVC_ADMIN',
    createDate: '2025-09-15T12:00:00.000Z',
    requests: 100,
  },

  // ENTWICKLUNG Gruppe - e-Nutzer (Verschiedene Entwicklungsbereiche)
  // Frontend Developer - e12345
  {
    type: 'CompletionModelUsage',
    tag: 'frontend-dev',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-002',
    requestTokens: 30000,
    responseTokens: 15000,
    technicalUserId: 'e12345',
    createDate: '2025-09-15T09:00:00.000Z',
    requests: 120,
  },
  {
    type: 'ImageModelUsage',
    tag: 'ui-design',
    model: 'dall-e-3',
    apiKeyId: 'api-key-002',
    sizeWidth: 1792,
    sizeHeight: 1024,
    quality: 'hd',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'e12345',
    createDate: '2025-09-15T14:00:00.000Z',
    requests: 25,
  },

  // Backend Developer - e54321
  {
    type: 'CompletionModelUsage',
    tag: 'backend-dev',
    model: 'gpt-4o',
    apiKeyId: 'api-key-003',
    requestTokens: 45000,
    responseTokens: 22500,
    technicalUserId: 'e54321',
    createDate: '2025-09-15T10:30:00.000Z',
    requests: 180,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'code-analysis',
    model: 'text-embedding-3-small',
    apiKeyId: 'api-key-003',
    requestTokens: 25000,
    responseTokens: 0,
    technicalUserId: 'e54321',
    createDate: '2025-09-15T15:30:00.000Z',
    requests: 80,
  },

  // Mobile Developer - e11111
  {
    type: 'CompletionModelUsage',
    tag: 'mobile-dev',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-004',
    requestTokens: 20000,
    responseTokens: 10000,
    technicalUserId: 'e11111',
    createDate: '2025-09-15T11:00:00.000Z',
    requests: 90,
  },

  // DevOps Developer - e33333
  {
    type: 'CompletionModelUsage',
    tag: 'devops-automation',
    model: 'claude-3-haiku',
    apiKeyId: 'api-key-005',
    requestTokens: 35000,
    responseTokens: 17500,
    technicalUserId: 'e33333',
    createDate: '2025-09-15T13:00:00.000Z',
    requests: 140,
  },

  // QA Developer - e77777
  {
    type: 'CompletionModelUsage',
    tag: 'testing-automation',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-006',
    requestTokens: 25000,
    responseTokens: 12500,
    technicalUserId: 'e77777',
    createDate: '2025-09-15T12:30:00.000Z',
    requests: 100,
  },

  // UI/UX Developer - e88888
  {
    type: 'ImageModelUsage',
    tag: 'ui-prototyping',
    model: 'dall-e-3',
    apiKeyId: 'api-key-007',
    sizeWidth: 1024,
    sizeHeight: 1024,
    quality: 'standard',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'e88888',
    createDate: '2025-09-15T16:00:00.000Z',
    requests: 40,
  },

  // Data Science Developer - e99999
  {
    type: 'CompletionModelUsage',
    tag: 'data-analysis',
    model: 'gpt-4o',
    apiKeyId: 'api-key-008',
    requestTokens: 60000,
    responseTokens: 30000,
    technicalUserId: 'e99999',
    createDate: '2025-09-15T14:30:00.000Z',
    requests: 200,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'data-processing',
    model: 'text-embedding-3-large',
    apiKeyId: 'api-key-008',
    requestTokens: 40000,
    responseTokens: 0,
    technicalUserId: 'e99999',
    createDate: '2025-09-15T17:00:00.000Z',
    requests: 60,
  },

  // Security Developer - e00000
  {
    type: 'CompletionModelUsage',
    tag: 'security-analysis',
    model: 'claude-3-sonnet',
    apiKeyId: 'api-key-009',
    requestTokens: 30000,
    responseTokens: 15000,
    technicalUserId: 'e00000',
    createDate: '2025-09-15T15:00:00.000Z',
    requests: 110,
  },

  // BUSINESS Gruppe - b-Nutzer (Business-orientierte Nutzung)
  // Business Analyst - b67890
  {
    type: 'CompletionModelUsage',
    tag: 'business-analysis',
    model: 'gpt-4o',
    apiKeyId: 'api-key-010',
    requestTokens: 40000,
    responseTokens: 20000,
    technicalUserId: 'b67890',
    createDate: '2025-09-15T08:00:00.000Z',
    requests: 160,
  },

  // Business Intelligence - b98765
  {
    type: 'CompletionModelUsage',
    tag: 'bi-reporting',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-011',
    requestTokens: 35000,
    responseTokens: 17500,
    technicalUserId: 'b98765',
    createDate: '2025-09-15T09:30:00.000Z',
    requests: 130,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'document-analysis',
    model: 'text-embedding-3-small',
    apiKeyId: 'api-key-011',
    requestTokens: 30000,
    responseTokens: 0,
    technicalUserId: 'b98765',
    createDate: '2025-09-15T16:30:00.000Z',
    requests: 70,
  },

  // Business Process - b22222
  {
    type: 'CompletionModelUsage',
    tag: 'process-optimization',
    model: 'claude-3-haiku',
    apiKeyId: 'api-key-012',
    requestTokens: 25000,
    responseTokens: 12500,
    technicalUserId: 'b22222',
    createDate: '2025-09-15T11:15:00.000Z',
    requests: 95,
  },

  // Business Operations - b44444
  {
    type: 'CompletionModelUsage',
    tag: 'operations-management',
    model: 'gpt-4o',
    apiKeyId: 'api-key-013',
    requestTokens: 50000,
    responseTokens: 25000,
    technicalUserId: 'b44444',
    createDate: '2025-09-15T13:45:00.000Z',
    requests: 170,
  },

  // Business Strategy - b55555
  {
    type: 'CompletionModelUsage',
    tag: 'strategic-planning',
    model: 'gpt-4o',
    apiKeyId: 'api-key-014',
    requestTokens: 45000,
    responseTokens: 22500,
    technicalUserId: 'b55555',
    createDate: '2025-09-15T10:15:00.000Z',
    requests: 150,
  },

  // Business Development - b66666
  {
    type: 'CompletionModelUsage',
    tag: 'business-development',
    model: 'claude-3-sonnet',
    apiKeyId: 'api-key-015',
    requestTokens: 30000,
    responseTokens: 15000,
    technicalUserId: 'b66666',
    createDate: '2025-09-15T14:15:00.000Z',
    requests: 120,
  },

  // TECHNISCHE NUTZER Gruppe - SVC-Nutzer (Service-orientierte Nutzung)
  // Monitoring Service - SVC_MONITOR
  {
    type: 'CompletionModelUsage',
    tag: 'system-monitoring',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-016',
    requestTokens: 20000,
    responseTokens: 10000,
    technicalUserId: 'SVC_MONITOR',
    createDate: '2025-09-15T00:00:00.000Z',
    requests: 80,
  },

  // Analytics Service - SVC_ANALYTICS
  {
    type: 'CompletionModelUsage',
    tag: 'data-analytics',
    model: 'gpt-4o',
    apiKeyId: 'api-key-017',
    requestTokens: 80000,
    responseTokens: 40000,
    technicalUserId: 'SVC_ANALYTICS',
    createDate: '2025-09-15T01:00:00.000Z',
    requests: 300,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'analytics-processing',
    model: 'text-embedding-3-large',
    apiKeyId: 'api-key-017',
    requestTokens: 60000,
    responseTokens: 0,
    technicalUserId: 'SVC_ANALYTICS',
    createDate: '2025-09-15T02:00:00.000Z',
    requests: 120,
  },

  // Data Processing Service - SVC_DATA
  {
    type: 'CompletionModelUsage',
    tag: 'data-processing',
    model: 'claude-3-haiku',
    apiKeyId: 'api-key-018',
    requestTokens: 100000,
    responseTokens: 50000,
    technicalUserId: 'SVC_DATA',
    createDate: '2025-09-15T03:00:00.000Z',
    requests: 400,
  },

  // Translation Service - SVC_TRANSLATE
  {
    type: 'CompletionModelUsage',
    tag: 'translation-service',
    model: 'gpt-4o',
    apiKeyId: 'api-key-019',
    requestTokens: 120000,
    responseTokens: 60000,
    technicalUserId: 'SVC_TRANSLATE',
    createDate: '2025-09-15T04:00:00.000Z',
    requests: 500,
  },

  // Notification Service - SVC_NOTIFY
  {
    type: 'CompletionModelUsage',
    tag: 'notification-processing',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-020',
    requestTokens: 30000,
    responseTokens: 15000,
    technicalUserId: 'SVC_NOTIFY',
    createDate: '2025-09-15T05:00:00.000Z',
    requests: 100,
  },

  // Backup Service - SVC_BACKUP
  {
    type: 'CompletionModelUsage',
    tag: 'backup-management',
    model: 'claude-3-haiku',
    apiKeyId: 'api-key-021',
    requestTokens: 15000,
    responseTokens: 7500,
    technicalUserId: 'SVC_BACKUP',
    createDate: '2025-09-15T06:00:00.000Z',
    requests: 60,
  },

  // DEFAULT Gruppe - Normale Nutzer (Verschiedene Business-Bereiche)
  // Marketing Manager - john.doe
  {
    type: 'CompletionModelUsage',
    tag: 'marketing-content',
    model: 'gpt-4o',
    apiKeyId: 'api-key-022',
    requestTokens: 35000,
    responseTokens: 17500,
    technicalUserId: 'john.doe',
    createDate: '2025-09-15T08:30:00.000Z',
    requests: 140,
  },
  {
    type: 'ImageModelUsage',
    tag: 'marketing-graphics',
    model: 'dall-e-3',
    apiKeyId: 'api-key-022',
    sizeWidth: 1024,
    sizeHeight: 1024,
    quality: 'standard',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'john.doe',
    createDate: '2025-09-15T17:30:00.000Z',
    requests: 30,
  },

  // Sales Manager - jane.smith
  {
    type: 'CompletionModelUsage',
    tag: 'sales-proposals',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-023',
    requestTokens: 25000,
    responseTokens: 12500,
    technicalUserId: 'jane.smith',
    createDate: '2025-09-15T09:00:00.000Z',
    requests: 100,
  },

  // HR Manager - mike.wilson
  {
    type: 'CompletionModelUsage',
    tag: 'hr-documentation',
    model: 'claude-3-sonnet',
    apiKeyId: 'api-key-024',
    requestTokens: 20000,
    responseTokens: 10000,
    technicalUserId: 'mike.wilson',
    createDate: '2025-09-15T10:00:00.000Z',
    requests: 80,
  },

  // Finance Manager - sarah.jones
  {
    type: 'CompletionModelUsage',
    tag: 'financial-analysis',
    model: 'gpt-4o',
    apiKeyId: 'api-key-025',
    requestTokens: 30000,
    responseTokens: 15000,
    technicalUserId: 'sarah.jones',
    createDate: '2025-09-15T11:30:00.000Z',
    requests: 120,
  },

  // Customer Success - tom.brown (deaktiviert, aber hat historische Daten)
  {
    type: 'CompletionModelUsage',
    tag: 'customer-support',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-026',
    requestTokens: 15000,
    responseTokens: 7500,
    technicalUserId: 'tom.brown',
    createDate: '2025-08-30T14:00:00.000Z',
    requests: 60,
  },
]

// Funktion zum Generieren von gruppierten Usage-Daten für mehrere Tage
const generateMockUsageSummaryByDay = (days = 90) => {
  const summaryData = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days)

  const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  const tags = ['production', 'development', 'testing', 'staging']
  const userIds = ['SVC_ADMIN', 'e12345', 'e54321', 'e11111', 'e33333', 'e77777', 'e88888']
  const apiKeys = ['api-key-001', 'api-key-002', 'api-key-003', 'api-key-004', 'api-key-005']

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const day = currentDate.getDate()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Generiere 3-8 Einträge pro Tag
    const entriesPerDay = Math.floor(Math.random() * 6) + 3
    
    for (let j = 0; j < entriesPerDay; j++) {
      const baseMultiplier = isWeekend ? 0.6 : 1.2
      const requests = Math.floor((Math.random() * 200 + 50) * baseMultiplier)
      const requestTokens = Math.floor(requests * (Math.random() * 200 + 150))
      const responseTokens = Math.floor(requestTokens * (Math.random() * 0.4 + 0.3))
      const cost = requestTokens * 0.000001 + responseTokens * 0.000003
      
      summaryData.push({
        type: 'CompletionModelUsage',
        tag: tags[Math.floor(Math.random() * tags.length)],
        model: models[Math.floor(Math.random() * models.length)],
        apiKeyId: apiKeys[Math.floor(Math.random() * apiKeys.length)],
        requestTokens,
        responseTokens,
        tokensIn: requestTokens,
        tokensOut: responseTokens,
        technicalUserId: userIds[Math.floor(Math.random() * userIds.length)],
        createDate: new Date(year, month - 1, day, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString(),
        requests,
        cost,
        day,
        month,
        year,
      })
    }
  }
  
  return summaryData
}

// Gruppierte Usage-Daten nach Tag (für Admin Charts) - Generiert für die letzten 90 Tage
const MOCK_USAGE_SUMMARY_BY_DAY = generateMockUsageSummaryByDay(90)

// Funktion zum Generieren von Extraction-Daten für mehrere Tage
const generateMockExtractionData = (days = 90) => {
  const extractionData = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days)

  const providers = ['azure', 'aws', 'google']
  const modelIds = ['model-001', 'model-002', 'model-003']
  const statuses = ['completed', 'processing', 'failed']
  const tags = ['invoice', 'contract', 'receipt', 'form', 'report']
  const userIds = ['SVC_ADMIN', 'e12345', 'e54321', 'e11111', 'e33333']
  const apiKeys = ['api-key-001', 'api-key-002', 'api-key-003', 'api-key-004', 'api-key-005']

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const day = currentDate.getDate()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Generiere 5-15 Einträge pro Tag
    const entriesPerDay = Math.floor(Math.random() * 11) + 5
    
    for (let j = 0; j < entriesPerDay; j++) {
      const baseMultiplier = isWeekend ? 0.6 : 1.2
      const operations = Math.floor((Math.random() * 50 + 10) * baseMultiplier)
      const pages = Math.floor(operations * (Math.random() * 3 + 1))
      const confidence = Math.random() * 0.3 + 0.7 // 70-100%
      const cost = operations * (Math.random() * 0.1 + 0.05)
      
      extractionData.push({
        id: uuidv4(),
        provider: providers[Math.floor(Math.random() * providers.length)],
        modelId: modelIds[Math.floor(Math.random() * modelIds.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        tag: tags[Math.floor(Math.random() * tags.length)],
        operations,
        pages,
        confidence,
        cost,
        technicalUserId: userIds[Math.floor(Math.random() * userIds.length)],
        apiKeyId: apiKeys[Math.floor(Math.random() * apiKeys.length)],
        createDate: new Date(year, month - 1, day, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString(),
        day,
        month,
        year,
      })
    }
  }
  
  return extractionData
}

// Funktion zum Generieren von gruppierten Extraction-Daten für mehrere Tage
const generateExtendedExtractionSummaryByDay = (days = 90) => {
  const summaryData = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days)

  const providers = ['azure', 'aws', 'google']
  const tags = ['invoice', 'contract', 'receipt', 'form', 'report']
  const userIds = ['SVC_ADMIN', 'e12345', 'e54321', 'e11111', 'e33333']
  const apiKeys = ['api-key-001', 'api-key-002', 'api-key-003', 'api-key-004', 'api-key-005']

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const day = currentDate.getDate()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    const baseMultiplier = isWeekend ? 0.6 : 1.2
    const operations = Math.floor((Math.random() * 200 + 50) * baseMultiplier)
    const totalPages = Math.floor(operations * (Math.random() * 3 + 1))
    const averageConfidence = Math.random() * 0.2 + 0.75 // 75-95%
    const cost = operations * (Math.random() * 0.1 + 0.05)
    
    summaryData.push({
      provider: providers[Math.floor(Math.random() * providers.length)],
      tag: tags[Math.floor(Math.random() * tags.length)],
      operations,
      totalPages,
      averageConfidence,
      cost,
      technicalUserId: userIds[Math.floor(Math.random() * userIds.length)],
      apiKeyId: apiKeys[Math.floor(Math.random() * apiKeys.length)],
      createDate: new Date(year, month - 1, day, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)).toISOString(),
      day,
      month,
      year,
    })
  }
  
  return summaryData
}

// Extraction Mock-Daten - Generiert für die letzten 90 Tage
const MOCK_EXTRACTION_DATA = generateMockExtractionData(90)

// Gruppierte Extraction-Daten nach Tag - Generiert für die letzten 90 Tage
const MOCK_EXTRACTION_SUMMARY_BY_DAY = generateExtendedExtractionSummaryByDay(90)

// Gruppierte Usage-Daten nach API Key (für Summarize API)
const MOCK_USAGE_SUMMARY_BY_APIKEY = [
  // Beispiel-Daten für Progress Bar
  {
    type: 'CompletionModelUsage',
    tag: 'admin-production',
    model: 'gpt-4o',
    apiKeyId: 'api-key-001',
    requestTokens: 280000,
    responseTokens: 140000,
    technicalUserId: 'SVC_ADMIN',
    createDate: '2025-09-15T10:00:00.000Z',
    requests: 750,
    day: 15,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'frontend-dev',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-002',
    requestTokens: 30000,
    responseTokens: 15000,
    technicalUserId: 'e12345',
    createDate: '2025-09-15T09:00:00.000Z',
    requests: 145,
    day: 15,
    month: 9,
    year: 2025,
  },

  // Usage-Daten für zusätzliche API-Keys (doppelte Nutzer)
  {
    type: 'CompletionModelUsage',
    tag: 'testing',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-027',
    requestTokens: 15000,
    responseTokens: 7500,
    technicalUserId: 'e12345',
    createDate: '2025-09-15T10:30:00.000Z',
    requests: 75,
    day: 15,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'development',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-028',
    requestTokens: 25000,
    responseTokens: 12500,
    technicalUserId: 'e12345',
    createDate: '2025-09-16T11:00:00.000Z',
    requests: 120,
    day: 16,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'personal',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-029',
    requestTokens: 8000,
    responseTokens: 4000,
    technicalUserId: 'john.doe',
    createDate: '2025-09-17T14:20:00.000Z',
    requests: 40,
    day: 17,
    month: 9,
    year: 2025,
  },
  {
    type: 'CompletionModelUsage',
    tag: 'backup',
    model: 'gpt-4o-mini',
    apiKeyId: 'api-key-030',
    requestTokens: 5000,
    responseTokens: 2500,
    technicalUserId: 'SVC_ADMIN',
    createDate: '2025-09-18T09:15:00.000Z',
    requests: 25,
    day: 18,
    month: 9,
    year: 2025,
  },

  // EmbeddingModelUsage Daten für Admin Charts
  {
    type: 'EmbeddingModelUsage',
    tag: 'admin-analytics',
    model: 'text-embedding-3-large',
    apiKeyId: 'api-key-001',
    requestTokens: 50000,
    responseTokens: 0,
    technicalUserId: 'SVC_ADMIN',
    createDate: '2025-09-15T12:00:00.000Z',
    requests: 100,
    day: 15,
    month: 9,
    year: 2025,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'code-analysis',
    model: 'text-embedding-3-small',
    apiKeyId: 'api-key-003',
    requestTokens: 25000,
    responseTokens: 0,
    technicalUserId: 'e54321',
    createDate: '2025-09-15T15:30:00.000Z',
    requests: 80,
    day: 15,
    month: 9,
    year: 2025,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'data-processing',
    model: 'text-embedding-3-large',
    apiKeyId: 'api-key-008',
    requestTokens: 40000,
    responseTokens: 0,
    technicalUserId: 'e99999',
    createDate: '2025-09-15T17:00:00.000Z',
    requests: 60,
    day: 15,
    month: 9,
    year: 2025,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'document-analysis',
    model: 'text-embedding-3-small',
    apiKeyId: 'api-key-011',
    requestTokens: 30000,
    responseTokens: 0,
    technicalUserId: 'b98765',
    createDate: '2025-09-15T16:30:00.000Z',
    requests: 70,
    day: 15,
    month: 9,
    year: 2025,
  },
  {
    type: 'EmbeddingModelUsage',
    tag: 'analytics-processing',
    model: 'text-embedding-3-large',
    apiKeyId: 'api-key-017',
    requestTokens: 60000,
    responseTokens: 0,
    technicalUserId: 'SVC_ANALYTICS',
    createDate: '2025-09-15T02:00:00.000Z',
    requests: 120,
    day: 15,
    month: 9,
    year: 2025,
  },

  // ImageModelUsage Daten für Admin Charts
  {
    type: 'ImageModelUsage',
    tag: 'ui-design',
    model: 'dall-e-3',
    apiKeyId: 'api-key-002',
    sizeWidth: 1792,
    sizeHeight: 1024,
    quality: 'hd',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'e12345',
    createDate: '2025-09-15T14:00:00.000Z',
    requests: 50,
    day: 15,
    month: 9,
    year: 2025,
  },
  {
    type: 'ImageModelUsage',
    tag: 'ui-prototyping',
    model: 'dall-e-3',
    apiKeyId: 'api-key-007',
    sizeWidth: 1024,
    sizeHeight: 1024,
    quality: 'standard',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'e88888',
    createDate: '2025-09-15T16:00:00.000Z',
    requests: 30,
    day: 15,
    month: 9,
    year: 2025,
  },
  {
    type: 'ImageModelUsage',
    tag: 'marketing-graphics',
    model: 'dall-e-3',
    apiKeyId: 'api-key-022',
    sizeWidth: 1024,
    sizeHeight: 1024,
    quality: 'standard',
    requestTokens: 0,
    responseTokens: 0,
    technicalUserId: 'john.doe',
    createDate: '2025-09-15T17:30:00.000Z',
    requests: 30,
    day: 15,
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
  MOCK_USAGE_SUMMARY_BY_DAY,
  MOCK_EXTRACTION_DATA,
  MOCK_EXTRACTION_SUMMARY_BY_DAY,
  getAllApiKeys,
  getAllUsageData,
  getAllUsageSummaryByApiKey,
  getApiKeyById,
  getUsageByApiKeyId,
  getUsageSummaryByApiKeyId,
}
