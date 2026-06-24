export type StageId = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type StageStatus = 'idle' | 'running' | 'done' | 'error'

export type AttachmentKind = 'image' | 'text' | 'file'

export interface AttachmentItem {
  id: string
  name: string
  size: number
  mimeType: string
  kind: AttachmentKind
  textContent?: string
  previewUrl?: string
}

export interface StructuredInputState {
  businessGoal: string
  targetUser: string
  scenario: string
  successCriteria: string
  notes: string
}

export interface ClarifyQuestion {
  id: string
  question: string
  priority: 'P0' | 'P1' | 'P2'
  category: string
}

export interface StageResult {
  stageId: StageId
  status: StageStatus
  content: string
  error?: string
}

export interface ReportHistoryItem {
  id: string
  title: string
  createdAt: string
  requirement: string
  stages: Record<StageId, StageResult>
  knowledgeUsage: KnowledgeUsage | null
}

export interface KnowledgeUsage {
  used: boolean
  documents: Array<{
    title: string
    reason: string
  }>
}

export interface AnalysisState {
  requirementInput: string
  clarifyAnswers: string
  submittedRequirement: string
  structuredInput: StructuredInputState
  attachments: AttachmentItem[]
  needsClarify: boolean
  clarifyQuestions: ClarifyQuestion[]
  stages: Record<StageId, StageResult>
  knowledgeUsage?: KnowledgeUsage
  reportHistory?: ReportHistoryItem[]
  isAnalyzing: boolean
  currentStage: StageId | null
  reportReady: boolean
}

export interface AnalyzeRequest {
  requirement: string
  clarifyAnswers?: string
  stage: StageId
  previousResults?: Partial<Record<StageId, string>>
}
