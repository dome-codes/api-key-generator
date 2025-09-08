// types/chat.ts
export interface ChatResponse {
  title: string
  question: string
  overall_summary_list: string[]
  answers: Answer[]
  timestamp: string
}

export interface Answer {
  tool: string
  confidence: number
  summary_list: string
  references: Reference[]
}

export interface Reference {
  source: string
  url: string
  page: number | null
  section_title: string
  highlighted_text: string
  explicit_answer: string
  doc_type: string
  confidence: number
}

export interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  references?: Reference[]
  chatResponse?: ChatResponse
}
