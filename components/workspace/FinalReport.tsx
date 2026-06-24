'use client'

import { useWorkspaceStore } from '@/store/workspaceStore'
import { Copy, Download, Check } from 'lucide-react'
import { useState } from 'react'
import type { KnowledgeUsage } from '@/lib/types'
import MarkdownRenderer from './MarkdownRenderer'
import { copyText } from '@/lib/clipboard'

const STAGE_NAMES = [
  '需求理解',
  '需求拆解',
  '需求完整性',
  '风险假设',
  '流程与信息架构',
  '设计机会',
  '设计优先级',
]

function buildKnowledgeUsage(knowledgeUsage: KnowledgeUsage | null) {
  if (!knowledgeUsage) return '> 知识库调用：尚未记录\n'

  if (!knowledgeUsage.used || knowledgeUsage.documents.length === 0) {
    return '> 知识库调用：已检索，未命中特定业务知识文档\n'
  }

  return [
    '> 知识库调用：已命中',
    ...knowledgeUsage.documents.map((document) => `> - ${document.title}（${document.reason}）`),
    '',
  ].join('\n')
}

function buildRequirementSummaryTitle(requirement: string) {
  const normalized = requirement
    .replace(/^(原始需求|需求|背景|主题|目标)[:：]\s*/i, '')
    .replace(/["“”']/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return '需求分析报告'

  const firstThought = normalized.split(/[。！？!?；;\n]/)[0]?.trim() || normalized
  return firstThought.length > 32 ? `${firstThought.slice(0, 32)}…` : firstThought
}

function buildReport(
  requirement: string,
  stages: Record<number, { content: string }>,
  knowledgeUsage: KnowledgeUsage | null
) {
  const lines: string[] = []
  lines.push(`# ${buildRequirementSummaryTitle(requirement)}\n`)
  lines.push(`> 原始需求：${requirement}\n`)
  lines.push(`> 分析时间：${new Date().toLocaleString('zh-CN')}\n`)
  lines.push(buildKnowledgeUsage(knowledgeUsage))
  lines.push('---\n')

  for (let i = 0; i <= 6; i++) {
    const content = stages[i]?.content
    if (content) {
      lines.push(`## 阶段${String(i + 1).padStart(2, '0')}：${STAGE_NAMES[i]}\n`)
      lines.push(content)
      lines.push('\n---\n')
    }
  }

  return lines.join('\n')
}

export default function FinalReport() {
  const { reportReady, stages, submittedRequirement, requirementInput, knowledgeUsage } =
    useWorkspaceStore()
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')

  if (!reportReady) return null

  const markdown = buildReport(submittedRequirement || requirementInput, stages, knowledgeUsage)

  const handleCopy = async () => {
    const copied = await copyText(markdown)
    setCopyStatus(copied ? 'success' : 'error')
    setTimeout(() => setCopyStatus('idle'), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `需求分析报告_${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Final Output</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">完整分析报告</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors ${
                copyStatus === 'error'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {copyStatus === 'success' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copyStatus === 'success' ? '已复制' : copyStatus === 'error' ? '复制失败' : '复制 Markdown'}
            </button>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-700"
          >
            <Download className="w-4 h-4" />
            下载 .md
          </button>
        </div>
      </div>
      <div className="rounded-[28px] border border-black/6 bg-white/82 p-6 backdrop-blur-md sm:p-8">
        <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700 prose-table:text-xs prose-th:bg-slate-50 prose-td:text-slate-700">
        <MarkdownRenderer content={markdown} />
        </div>
      </div>
    </div>
  )
}
