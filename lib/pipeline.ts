import { useWorkspaceStore } from '@/store/workspaceStore'
import type { KnowledgeUsage, StageId } from '@/lib/types'
import { unwrapMarkdownFence } from '@/lib/markdown'

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
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `HTTP ${response.status}`)
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
    const stage0Content = unwrapMarkdownFence(stage0Result)
    store.replaceStageContent(0, stage0Content)
    previousResults[0] = stage0Content
    store.setStageStatus(0, 'done')

    // Stage 1: Decomposition
    store.setStageStatus(1, 'running')
    const stage1Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 1, previousResults },
      (chunk) => store.appendStageContent(1, chunk)
    )
    const stage1Content = unwrapMarkdownFence(stage1Result)
    store.replaceStageContent(1, stage1Content)
    previousResults[1] = stage1Content
    store.setStageStatus(1, 'done')

    // Stage 2: Requirement Completeness
    store.setStageStatus(2, 'running')
    const stage2Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 2, previousResults },
      (chunk) => store.appendStageContent(2, chunk)
    )
    const stage2Content = unwrapMarkdownFence(stage2Result)
    store.replaceStageContent(2, stage2Content)
    previousResults[2] = stage2Content
    store.setStageStatus(2, 'done')

    // Stage 3: Risk Assumptions
    store.setStageStatus(3, 'running')
    const stage3Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 3, previousResults },
      (chunk) => store.appendStageContent(3, chunk)
    )
    const stage3Content = unwrapMarkdownFence(stage3Result)
    store.replaceStageContent(3, stage3Content)
    previousResults[3] = stage3Content
    store.setStageStatus(3, 'done')

    // Stage 4: Flow and Information Architecture
    store.setStageStatus(4, 'running')
    const stage4Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 4, previousResults },
      (chunk) => store.appendStageContent(4, chunk)
    )
    const stage4Content = unwrapMarkdownFence(stage4Result)
    store.replaceStageContent(4, stage4Content)
    previousResults[4] = stage4Content
    store.setStageStatus(4, 'done')

    // Stage 5: Design Opportunities
    store.setStageStatus(5, 'running')
    const stage5Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 5, previousResults },
      (chunk) => store.appendStageContent(5, chunk)
    )
    const stage5Content = unwrapMarkdownFence(stage5Result)
    store.replaceStageContent(5, stage5Content)
    previousResults[5] = stage5Content
    store.setStageStatus(5, 'done')

    // Stage 6: Priority
    store.setStageStatus(6, 'running')
    const stage6Result = await fetchStream(
      '/api/analyze',
      { requirement, clarifyAnswers, stage: 6, previousResults },
      (chunk) => store.appendStageContent(6, chunk)
    )
    const stage6Content = unwrapMarkdownFence(stage6Result)
    store.replaceStageContent(6, stage6Content)
    previousResults[6] = stage6Content
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
        store.appendStageContent(
          id,
          [
            '分析服务暂时不可用，请检查模型服务环境变量或稍后重试。',
            '',
            error instanceof Error ? `错误信息：${error.message}` : '',
          ]
            .filter(Boolean)
            .join('\n')
        )
        store.setStageStatus(id, 'error')
      }
    }
  } finally {
    store.setAnalyzing(false)
  }
}
