import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  AttachmentItem,
  KnowledgeUsage,
  ReportHistoryItem,
  StageId,
  StageResult,
  StageStatus,
  StructuredInputState,
} from '@/lib/types'

interface QueuedAnalysis {
  id: string
  requirement: string
}

const makeInitialStages = (): Record<StageId, StageResult> => ({
  0: { stageId: 0, status: 'idle', content: '' },
  1: { stageId: 1, status: 'idle', content: '' },
  2: { stageId: 2, status: 'idle', content: '' },
  3: { stageId: 3, status: 'idle', content: '' },
  4: { stageId: 4, status: 'idle', content: '' },
  5: { stageId: 5, status: 'idle', content: '' },
  6: { stageId: 6, status: 'idle', content: '' },
})

const makeInitialStructuredInput = (): StructuredInputState => ({
  businessGoal: '',
  targetUser: '',
  scenario: '',
  successCriteria: '',
  notes: '',
})

interface WorkspaceState {
  requirementInput: string
  clarifyAnswers: string
  submittedRequirement: string
  structuredInput: StructuredInputState
  attachments: AttachmentItem[]
  isAnalyzing: boolean
  reportReady: boolean
  stages: Record<StageId, StageResult>
  knowledgeUsage: KnowledgeUsage | null
  reportHistory: ReportHistoryItem[]
  queuedAnalysis: QueuedAnalysis | null

  setRequirementInput: (v: string) => void
  setClarifyAnswers: (v: string) => void
  setSubmittedRequirement: (v: string) => void
  setStructuredField: (field: keyof StructuredInputState, value: string) => void
  mergeStructuredInput: (payload: Partial<StructuredInputState>) => void
  addAttachments: (attachments: AttachmentItem[]) => void
  removeAttachment: (id: string) => void
  clearAttachments: () => void
  setAnalyzing: (v: boolean) => void
  setReportReady: (v: boolean) => void
  setKnowledgeUsage: (usage: KnowledgeUsage | null) => void
  addReportHistory: (item: ReportHistoryItem) => void
  openReportHistory: (id: string) => void
  queueAnalysis: (requirement: string) => void
  consumeQueuedAnalysis: () => QueuedAnalysis | null
  setStageStatus: (id: StageId, status: StageStatus) => void
  appendStageContent: (id: StageId, text: string) => void
  resetStages: () => void
  reset: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
  requirementInput: '',
  clarifyAnswers: '',
  submittedRequirement: '',
  structuredInput: makeInitialStructuredInput(),
  attachments: [],
  isAnalyzing: false,
  reportReady: false,
  stages: makeInitialStages(),
  knowledgeUsage: null,
  reportHistory: [],
  queuedAnalysis: null,

  setRequirementInput: (v) => set({ requirementInput: v }),
  setClarifyAnswers: (v) => set({ clarifyAnswers: v }),
  setSubmittedRequirement: (v) => set({ submittedRequirement: v }),
  setStructuredField: (field, value) =>
    set((state) => ({
      structuredInput: {
        ...state.structuredInput,
        [field]: value,
      },
    })),
  mergeStructuredInput: (payload) =>
    set((state) => ({
      structuredInput: {
        ...state.structuredInput,
        ...Object.fromEntries(
          Object.entries(payload).filter(([, value]) => typeof value === 'string' && value.trim())
        ),
      },
    })),
  addAttachments: (attachments) =>
    set((state) => {
      const nextAttachments = [...state.attachments]

      for (const attachment of attachments) {
        const existingIndex = nextAttachments.findIndex((item) => item.id === attachment.id)
        if (existingIndex >= 0) {
          nextAttachments[existingIndex] = attachment
        } else {
          nextAttachments.push(attachment)
        }
      }

      return { attachments: nextAttachments }
    }),
  removeAttachment: (id) =>
    set((state) => ({
      attachments: state.attachments.filter((attachment) => attachment.id !== id),
    })),
  clearAttachments: () => set({ attachments: [] }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setReportReady: (v) => set({ reportReady: v }),
  setKnowledgeUsage: (usage) => set({ knowledgeUsage: usage }),
  addReportHistory: (item) =>
    set((state) => ({
      reportHistory: [item, ...state.reportHistory.filter((history) => history.id !== item.id)].slice(
        0,
        12
      ),
    })),
  openReportHistory: (id) =>
    set((state) => {
      const item = state.reportHistory.find((history) => history.id === id)
      if (!item) return {}

      return {
        submittedRequirement: item.requirement,
        requirementInput: item.requirement,
        stages: item.stages,
        knowledgeUsage: item.knowledgeUsage,
        reportReady: true,
        isAnalyzing: false,
      }
    }),
  queueAnalysis: (requirement) =>
    set({
      queuedAnalysis: {
        id: `${Date.now()}`,
        requirement,
      },
    }),
  consumeQueuedAnalysis: () => {
    let queuedAnalysis: QueuedAnalysis | null = null
    set((state) => {
      queuedAnalysis = state.queuedAnalysis
      return { queuedAnalysis: null }
    })
    return queuedAnalysis
  },

  setStageStatus: (id, status) =>
    set((state) => ({
      stages: {
        ...state.stages,
        [id]: { ...state.stages[id], status },
      },
    })),

  appendStageContent: (id, text) =>
    set((state) => ({
      stages: {
        ...state.stages,
        [id]: {
          ...state.stages[id],
          content: state.stages[id].content + text,
        },
      },
    })),

  resetStages: () =>
    set({
      stages: makeInitialStages(),
      knowledgeUsage: null,
      queuedAnalysis: null,
      reportReady: false,
    }),

  reset: () =>
    set({
      requirementInput: '',
      clarifyAnswers: '',
      submittedRequirement: '',
      structuredInput: makeInitialStructuredInput(),
      attachments: [],
      isAnalyzing: false,
      reportReady: false,
      stages: makeInitialStages(),
      knowledgeUsage: null,
      queuedAnalysis: null,
    }),
    }),
    {
      name: 'req-analyzer-workspace',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        requirementInput: state.requirementInput,
        clarifyAnswers: state.clarifyAnswers,
        submittedRequirement: state.submittedRequirement,
        structuredInput: state.structuredInput,
        reportReady: state.reportReady,
        stages: state.stages,
        knowledgeUsage: state.knowledgeUsage,
        reportHistory: state.reportHistory,
        queuedAnalysis: state.queuedAnalysis,
      }),
    }
  )
)
