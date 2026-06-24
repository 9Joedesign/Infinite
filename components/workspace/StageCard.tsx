'use client'

import type { StageStatus } from '@/lib/types'
import { Check, CheckCircle, Circle, Clipboard, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import { copyText } from '@/lib/clipboard'

interface StageCardProps {
  stageId: number
  title: string
  subtitle: string
  status: StageStatus
  content: string
}

const STATUS_ICON: Record<StageStatus, React.ReactNode> = {
  idle: <Circle className="w-5 h-5 text-gray-300" />,
  running: <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />,
  done: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
}

export default function StageCard({ stageId, title, subtitle, status, content }: StageCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const isActive = status === 'running' || status === 'done'
  const stageNumber = String(stageId + 1).padStart(2, '0')

  const handleCopy = async () => {
    if (!content) return
    const copied = await copyText(content)
    setCopyStatus(copied ? 'success' : 'error')
    setTimeout(() => setCopyStatus('idle'), 1800)
  }

  return (
    <div
      className={`rounded-[30px] border bg-white/78 backdrop-blur-md transition-all duration-300 ${
        status === 'running'
          ? 'border-slate-900/14'
          : status === 'done'
          ? 'border-black/6'
          : 'border-black/4 opacity-70'
      }`}
    >
      <div className="flex items-center gap-2 p-5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => isActive && setCollapsed((c) => !c)}
        >
          <span className="flex-shrink-0">{STATUS_ICON[status]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">{stageNumber}</span>
              <span className="text-sm font-semibold text-slate-950">{title}</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          </div>
        </button>

        {content ? (
          <>
            <div className="relative">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  copyStatus === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : copyStatus === 'error'
                      ? 'border-red-200 bg-red-50 text-red-500'
                      : 'border-black/6 bg-white/72 text-slate-400 hover:bg-white hover:text-slate-900'
                }`}
                aria-label={`复制${title}内容`}
                title={`复制${title}内容`}
              >
                {copyStatus === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
              </button>
              {copyStatus !== 'idle' ? (
                <span
                  role="status"
                  className={`pointer-events-none absolute right-0 top-10 z-10 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium shadow-[0_12px_30px_rgba(15,23,42,0.12)] ${
                    copyStatus === 'success'
                      ? 'bg-slate-900 text-white'
                      : 'bg-red-50 text-red-600 ring-1 ring-red-100'
                  }`}
                >
                  {copyStatus === 'success' ? '已复制' : '复制失败'}
                </span>
              ) : null}
            </div>
          </>
        ) : null}

        {isActive ? (
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/6 bg-white/72 text-slate-400 transition hover:bg-white hover:text-slate-900"
            aria-label={collapsed ? `展开${title}` : `收起${title}`}
            title={collapsed ? `展开${title}` : `收起${title}`}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      {isActive && !collapsed && content && (
        <div className="border-t border-black/6 px-5 pb-6 pt-6">
          <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-table:text-xs prose-th:bg-slate-50 prose-th:font-medium prose-td:text-slate-700">
            <MarkdownRenderer content={content} />
          </div>
          {status === 'running' && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-slate-800" />
          )}
        </div>
      )}
    </div>
  )
}
