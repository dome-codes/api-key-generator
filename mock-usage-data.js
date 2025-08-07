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
      type: 'CompletionModelUsage',
      requests: completionRequests,
      technicalUSerid: userId,
      model: 'gpt-4o-mini',
      tag: 'production',
      day,
      month,
      year,
      requestTokens: Math.floor(completionTokensIn),
      responseTokens: Math.floor(completionTokensOut),
    })

    // EmbeddingModelUsage - Less frequent but larger batches
    if (Math.random() > 0.3) {
      // 70% chance per day
      const embeddingRequests = Math.floor((Math.random() * 50 + 20) * weekdayMultiplier)
      const embeddingTokens = embeddingRequests * (Math.random() * 300 + 200)

      mockData.push({
        type: 'EmbeddingModelUsage',
        requests: embeddingRequests,
        technicalUSerid: userId,
        model: 'text-embedding-3-small',
        tag: 'production',
        day,
        month,
        year,
        requestTokens: Math.floor(embeddingTokens),
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
        type: 'ImageModelUsage',
        requests: imageRequests,
        technicalUSerid: userId,
        model: 'dall-e-3',
        tag: 'production',
        day,
        month,
        year,
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
      type: 'CompletionModelUsage',
      requests: 156,
      technicalUSerid: 'user-123',
      model: 'gpt-4o-mini',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      requestTokens: 23456,
      responseTokens: 12345,
    },
    {
      type: 'EmbeddingModelUsage',
      requests: 45,
      technicalUSerid: 'user-123',
      model: 'text-embedding-3-small',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      requestTokens: 15678,
    },
    {
      type: 'ImageModelUsage',
      requests: 8,
      technicalUSerid: 'user-123',
      model: 'dall-e-3',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      sizeWidth: 1024,
      sizeHeight: 1024,
      quality: 'standard',
    },
  ],
  weekly: [
    // Week 1
    {
      type: 'CompletionModelUsage',
      requests: 1200,
      technicalUSerid: 'user-123',
      model: 'gpt-4o-mini',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      requestTokens: 180000,
      responseTokens: 90000,
    },
    {
      type: 'EmbeddingModelUsage',
      requests: 300,
      technicalUSerid: 'user-123',
      model: 'text-embedding-3-small',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      requestTokens: 100000,
    },
    // Week 2
    {
      type: 'CompletionModelUsage',
      requests: 1400,
      technicalUSerid: 'user-123',
      model: 'gpt-4o-mini',
      tag: 'production',
      day: 8,
      month: 7,
      year: 2025,
      requestTokens: 210000,
      responseTokens: 105000,
    },
  ],
  monthly: [
    {
      type: 'CompletionModelUsage',
      requests: 5000,
      technicalUSerid: 'user-123',
      model: 'gpt-4o-mini',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      requestTokens: 750000,
      responseTokens: 375000,
    },
    {
      type: 'EmbeddingModelUsage',
      requests: 1200,
      technicalUSerid: 'user-123',
      model: 'text-embedding-3-small',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      requestTokens: 400000,
    },
    {
      type: 'ImageModelUsage',
      requests: 250,
      technicalUSerid: 'user-123',
      model: 'dall-e-3',
      tag: 'production',
      day: 1,
      month: 7,
      year: 2025,
      sizeWidth: 1024,
      sizeHeight: 1024,
      quality: 'standard',
    },
  ],
}
