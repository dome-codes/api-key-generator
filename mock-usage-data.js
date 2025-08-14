// Extended mock usage data for testing charts and data visualization
// This file contains realistic usage data spanning multiple weeks/months

export const generateMockUsageData = (userId, startDate = new Date('2025-07-01'), days = 30) => {
  const mockData = []
  const currentDate = new Date(startDate)

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

    // CompletionModelUsage - Daily variations
    const completionRequests = Math.floor((Math.random() * 200 + 100) * weekdayMultiplier)
    const completionTokensIn = completionRequests * (Math.random() * 200 + 150)
    const completionTokensOut = completionTokensIn * (Math.random() * 0.4 + 0.3)

    mockData.push({
      modelType: 'CompletionModelUsage',
      requests: completionRequests,
      technicalUserId: userId,
      modelName: 'gpt-4o-mini',
      tag: 'production',
      day,
      month,
      year,
      tokensIn: Math.floor(completionTokensIn),
      tokensOut: Math.floor(completionTokensOut),
      totalTokens: Math.floor(completionTokensIn + completionTokensOut),
      cost: 0, // Wird später berechnet
      technicalUserName: `User ${userId}`,
    })

    // EmbeddingModelUsage - Less frequent but larger batches
    if (Math.random() > 0.3) {
      // 70% chance per day
      const embeddingRequests = Math.floor((Math.random() * 50 + 20) * weekdayMultiplier)
      const embeddingTokens = embeddingRequests * (Math.random() * 300 + 200)

      mockData.push({
        modelType: 'EmbeddingModelUsage',
        requests: embeddingRequests,
        technicalUserId: userId,
        modelName: 'text-embedding-3-small',
        tag: 'production',
        day,
        month,
        year,
        tokensIn: Math.floor(embeddingTokens),
        tokensOut: 0,
        totalTokens: Math.floor(embeddingTokens),
        cost: 0, // Wird später berechnet
        technicalUserName: `User ${userId}`,
      })
    }

    // ImageModelUsage - Occasional usage
    if (Math.random() > 0.7) {
      // 30% chance per day
      const imageRequests = Math.floor((Math.random() * 10 + 5) * weekendMultiplier)
      const quality = Math.random() > 0.5 ? 'hd' : 'standard'
      const sizeWidth = quality === 'hd' ? 1792 : 1024
      const sizeHeight = 1024

      mockData.push({
        modelType: 'ImageModelUsage',
        requests: imageRequests,
        technicalUserId: userId,
        modelName: 'dall-e-3',
        tag: 'production',
        day,
        month,
        year,
        tokensIn: 0,
        tokensOut: 0,
        totalTokens: 0,
        cost: 0, // Wird später berechnet
        technicalUserName: `User ${userId}`,
        sizeWidth,
        sizeHeight,
        quality,
      })
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return mockData
}

// Pre-generated data for different time periods
export const mockUsageData7Days = (userId) => {
  const startDate = new Date('2025-07-25')
  return generateMockUsageData(userId, startDate, 7)
}

export const mockUsageData30Days = (userId) => {
  const startDate = new Date('2025-07-01')
  return generateMockUsageData(userId, startDate, 30)
}

export const mockUsageData90Days = (userId) => {
  const startDate = new Date('2025-06-01')
  return generateMockUsageData(userId, startDate, 90)
}

export const mockUsageDataThisMonth = (userId) => {
  const startDate = new Date('2025-07-01')
  const today = new Date()
  const daysInMonth = today.getDate()
  return generateMockUsageData(userId, startDate, daysInMonth)
}

export const mockUsageDataLastMonth = (userId) => {
  const startDate = new Date('2025-06-01')
  return generateMockUsageData(userId, startDate, 30)
}

// Specific examples for testing
export const mockUsageExamples = {
  daily: [
    {
      modelType: 'CompletionModelUsage',
      requests: 156,
      technicalUserId: 'user-123',
      modelName: 'gpt-4o-mini',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      tokensIn: 23456,
      tokensOut: 12345,
      totalTokens: 35801,
      cost: 0,
      technicalUserName: 'User user-123',
    },
    {
      modelType: 'EmbeddingModelUsage',
      requests: 45,
      technicalUserId: 'user-123',
      modelName: 'text-embedding-3-small',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      tokensIn: 15678,
      tokensOut: 0,
      totalTokens: 15678,
      cost: 0,
      technicalUserName: 'User user-123',
    },
    {
      modelType: 'ImageModelUsage',
      requests: 8,
      technicalUserId: 'user-123',
      modelName: 'dall-e-3',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      sizeWidth: 1024,
      sizeHeight: 1024,
      quality: 'standard',
      tokensIn: 0,
      tokensOut: 0,
      totalTokens: 0,
      cost: 0,
      technicalUserName: 'User user-123',
    },
  ],
  weekly: [
    // Week 1
    {
      modelType: 'CompletionModelUsage',
      requests: 1200,
      technicalUserId: 'user-123',
      modelName: 'gpt-4o-mini',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      tokensIn: 180000,
      tokensOut: 90000,
      totalTokens: 270000,
      cost: 0,
      technicalUserName: 'User user-123',
    },
    {
      modelType: 'EmbeddingModelUsage',
      requests: 300,
      technicalUserId: 'user-123',
      modelName: 'text-embedding-3-small',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      tokensIn: 100000,
      tokensOut: 0,
      totalTokens: 100000,
      cost: 0,
      technicalUserName: 'User user-123',
    },
    // Week 2
    {
      modelType: 'CompletionModelUsage',
      requests: 1400,
      technicalUserId: 'user-123',
      modelName: 'gpt-4o-mini',
      tag: 'production',
      day: 8,
      month: 7,
      year: 2025,
      tokensIn: 210000,
      tokensOut: 105000,
      totalTokens: 315000,
      cost: 0,
      technicalUserName: 'User user-123',
    },
  ],
  monthly: [
    {
      modelType: 'CompletionModelUsage',
      requests: 5000,
      technicalUserId: 'user-123',
      modelName: 'gpt-4o-mini',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      tokensIn: 750000,
      tokensOut: 375000,
      totalTokens: 1125000,
      cost: 0,
      technicalUserName: 'User user-123',
    },
    {
      modelType: 'EmbeddingModelUsage',
      requests: 1200,
      technicalUserId: 'user-123',
      modelName: 'text-embedding-3-small',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      tokensIn: 400000,
      tokensOut: 0,
      totalTokens: 400000,
      cost: 0,
      technicalUserName: 'User user-123',
    },
    {
      modelType: 'ImageModelUsage',
      requests: 250,
      technicalUserId: 'user-123',
      modelName: 'dall-e-3',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      sizeWidth: 1024,
      sizeHeight: 1024,
      quality: 'standard',
      tokensIn: 0,
      tokensOut: 0,
      totalTokens: 0,
      cost: 0,
      technicalUserName: 'User user-123',
    },
  ],
}
