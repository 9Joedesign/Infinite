import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './prompts/system'
import { STAGE0_PROMPT } from './prompts/stage0'
import { STAGE1_PROMPT } from './prompts/stage1'
import { STAGE2_PROMPT } from './prompts/stage2'
import { STAGE3_PROMPT } from './prompts/stage3'
import { STAGE4_PROMPT } from './prompts/stage4'
import { STAGE5_PROMPT } from './prompts/stage5'
import { STAGE6_PROMPT } from './prompts/stage6'
import { loadKnowledgeContext, type KnowledgeContext } from './knowledge-base'
import type { StageId } from './types'

function getAnthropicClient() {
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN
  const apiKey = process.env.ANTHROPIC_API_KEY
  const baseURL = process.env.ANTHROPIC_BASE_URL

  if (!authToken && !apiKey) {
    throw new Error('Missing ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY')
  }

  return new Anthropic({
    ...(baseURL ? { baseURL } : {}),
    ...(authToken ? { authToken, apiKey: null } : { apiKey }),
  })
}

function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
}

const STAGE_PROMPTS: Record<StageId, string> = {
  0: STAGE0_PROMPT,
  1: STAGE1_PROMPT,
  2: STAGE2_PROMPT,
  3: STAGE3_PROMPT,
  4: STAGE4_PROMPT,
  5: STAGE5_PROMPT,
  6: STAGE6_PROMPT,
}

const STAGE_NAMES: Record<StageId, string> = {
  0: '需求理解',
  1: '需求拆解',
  2: '需求完整性',
  3: '风险假设',
  4: '流程与信息架构',
  5: '设计机会',
  6: '设计优先级',
}

export function buildUserMessage(
  stage: StageId,
  requirement: string,
  clarifyAnswers?: string,
  previousResults?: Partial<Record<StageId, string>>,
  knowledgeContent?: string
): string {
  const parts: string[] = []

  parts.push(`## 原始需求\n\n${requirement}`)

  if (knowledgeContent) {
    parts.push(knowledgeContent)
  }

  if (clarifyAnswers) {
    parts.push(`## 追问回答\n\n${clarifyAnswers}`)
  }

  if (previousResults) {
    if (previousResults[0]) {
      parts.push(`## 阶段0：需求理解结果\n\n${previousResults[0]}`)
    }
    if (stage >= 2 && previousResults[1]) {
      parts.push(`## 阶段1：需求拆解结果\n\n${previousResults[1]}`)
    }
    if (stage >= 3 && previousResults[2]) {
      parts.push(`## 阶段2：需求完整性结果\n\n${previousResults[2]}`)
    }
    if (stage >= 4 && previousResults[3]) {
      parts.push(`## 阶段3：风险假设结果\n\n${previousResults[3]}`)
    }
    if (stage >= 5 && previousResults[4]) {
      parts.push(`## 阶段4：流程与信息架构结果\n\n${previousResults[4]}`)
    }
    if (stage >= 6) {
      if (previousResults[5]) parts.push(`## 阶段5：设计机会结果\n\n${previousResults[5]}`)
    }
  }

  parts.push(`---\n\n请执行：${STAGE_NAMES[stage]}`)

  return parts.join('\n\n')
}

export async function streamStageAnalysis(
  stage: StageId,
  requirement: string,
  clarifyAnswers?: string,
  previousResults?: Partial<Record<StageId, string>>
): Promise<{ stream: ReadableStream<Uint8Array>; knowledgeContext: KnowledgeContext }> {
  const stagePrompt = STAGE_PROMPTS[stage]
  const knowledgeContext = await loadKnowledgeContext(requirement)
  const userMessage = buildUserMessage(
    stage,
    requirement,
    clarifyAnswers,
    previousResults,
    knowledgeContext.content
  )

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const client = getAnthropicClient()
        const response = await client.messages.create({
          model: getAnthropicModel(),
          max_tokens: 4096,
          system: [
            {
              type: 'text',
              text: `${SYSTEM_PROMPT}\n\n## 知识库使用要求\n- 每次分析都必须先检索内置知识库。\n- 如果知识库命中，在阶段输出中必须简要标注“知识库依据”，说明使用了哪些文档。\n- 涉及蝉妈妈AI、ChanClaw、IM接入、技能管理、数据看板等内容时，优先参考知识库证据。\n- 对知识库未覆盖的内容，必须标注为“待确认”，不要伪装成已知事实。`,
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: stagePrompt,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
          stream: true,
        })

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }

        controller.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown analysis error'
        controller.enqueue(encoder.encode(`分析服务暂时不可用，请检查模型服务环境变量或稍后重试。\n\n错误信息：${message}`))
        controller.close()
      }
    },
  })

  return { stream, knowledgeContext }
}
