import { useWorkspaceStore } from '@/store/workspaceStore'
import type { KnowledgeUsage, StageId } from '@/lib/types'

async function fetchStream(
  url: string,
  body: object,
  onChunk: (text: string) => void,
  onKnowledgeUsage?: (usage: KnowledgeUsage) => void
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const encodedKnowledgeUsage = response.headers.get('X-Knowledge-Usage')
  if (encodedKnowledgeUsage && onKnowledgeUsage) {
    try {
      onKnowledgeUsage(JSON.parse(decodeURIComponent(encodedKnowledgeUsage)) as KnowledgeUsage)
    } catch (error) {
      console.warn('Failed to parse knowledge usage:', error)
    }
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    fullText += chunk
    onChunk(chunk)
  }

  return fullText
}

export async function runAnalysisPipeline(
  requirement: string,
  clarifyAnswers?: string
) {
  const store = useWorkspaceStore.getState()
  const previousResults: Partial<Record<StageId, string>> = {}

  store.setSubmittedRequirement(requirement)
  store.setAnalyzing(true)
  store.resetStages()

  try {
    // Stage 0: Requirement Understanding
    store.setStageStatus(0, 'running')
    const stage0Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 0 },
      (chunk) => store.appendStageContent(0, chunk),
      (usage) => store.setKnowledgeUsage(usage)
    )
    previousResults[0] = stage0Result
    store.setStageStatus(0, 'done')

    // Stage 1: Decomposition
    store.setStageStatus(1, 'running')
    const stage1Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 1, previousResults },
      (chunk) => store.appendStageContent(1, chunk)
    )
    previousResults[1] = stage1Result
    store.setStageStatus(1, 'done')

    // Stage 2: Requirement Completeness
    store.setStageStatus(2, 'running')
    const stage2Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 2, previousResults },
      (chunk) => store.appendStageContent(2, chunk)
    )
    previousResults[2] = stage2Result
    store.setStageStatus(2, 'done')

    // Stage 3: Risk Assumptions
    store.setStageStatus(3, 'running')
    const stage3Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 3, previousResults },
      (chunk) => store.appendStageContent(3, chunk)
    )
    previousResults[3] = stage3Result
    store.setStageStatus(3, 'done')

    // Stage 4: Flow and Information Architecture
    store.setStageStatus(4, 'running')
    const stage4Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 4, previousResults },
      (chunk) => store.appendStageContent(4, chunk)
    )
    previousResults[4] = stage4Result
    store.setStageStatus(4, 'done')

    // Stage 5: Design Opportunities
    store.setStageStatus(5, 'running')
    const stage5Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 5, previousResults },
      (chunk) => store.appendStageContent(5, chunk)
    )
    previousResults[5] = stage5Result
    store.setStageStatus(5, 'done')

    // Stage 6: Priority
    store.setStageStatus(6, 'running')
    const stage6Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 6, previousResults },
      (chunk) => store.appendStageContent(6, chunk)
    )
    previousResults[6] = stage6Result
    store.setStageStatus(6, 'done')

    const finalState = useWorkspaceStore.getState()
    const titleSource = requirement
      .replace(/[#>*`\-[\]\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    finalState.addReportHistory({
      id: `${Date.now()}`,
      title: titleSource ? titleSource.slice(0, 24) : '未命名分析',
      createdAt: new Date().toISOString(),
      requirement,
      stages: finalState.stages,
      knowledgeUsage: finalState.knowledgeUsage,
    })

    store.setReportReady(true)
  } catch (error) {
    console.error('Pipeline error:', error)
    // Mark in-progress stages as error
    const stages = useWorkspaceStore.getState().stages
    for (const id of [0, 1, 2, 3, 4, 5, 6] as StageId[]) {
      if (stages[id].status === 'running') {
        store.setStageStatus(id, 'error')
      }
    }
  } finally {
    store.setAnalyzing(false)
  }
}
