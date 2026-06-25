'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Files, Goal, ImageIcon, ListChecks, Target } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { runAnalysisPipeline } from '@/lib/pipeline'
import { clearPendingAnalysis, readPendingAnalysis } from '@/lib/pending-analysis'
import AttachmentPill from './AttachmentPill'
import AnalysisPipeline from './AnalysisPipeline'
import FinalReport from './FinalReport'
import FloatingFollowupInput from './FloatingFollowupInput'

function StructuredCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[28px] border border-black/6 bg-white/72 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        {value || '未提供，报告中将以待确认事项标注。'}
      </p>
    </div>
  )
}

export default function ReportWorkspace() {
  const { requirementInput, structuredInput, attachments, consumeQueuedAnalysis, isAnalyzing } =
    useWorkspaceStore()
  const [collapsed, setCollapsed] = useState(true)
  const startedAnalysisIdRef = useRef<string | null>(null)
  const structuredSections = [
    {
      title: '业务目标',
      value: structuredInput.businessGoal,
      icon: <Goal className="h-3.5 w-3.5" />,
    },
    {
      title: '目标用户',
      value: structuredInput.targetUser,
      icon: <Target className="h-3.5 w-3.5" />,
    },
    {
      title: '核心场景',
      value: structuredInput.scenario,
      icon: <ListChecks className="h-3.5 w-3.5" />,
    },
    {
      title: '成功标准',
      value: structuredInput.successCriteria,
      icon: <Goal className="h-3.5 w-3.5" />,
    },
    {
      title: '补充说明',
      value: structuredInput.notes,
      icon: <Files className="h-3.5 w-3.5" />,
    },
  ].filter((section) => section.value.trim())

  const shouldShowOriginalPrompt = requirementInput.trim().length > 0
  const shouldShowAttachments = attachments.length > 0

  useEffect(() => {
    if (isAnalyzing) return

    const queryRequirement =
      typeof window === 'undefined'
        ? ''
        : new URLSearchParams(window.location.search).get('requirement')?.trim()
    const queuedAnalysis =
      consumeQueuedAnalysis() ??
      readPendingAnalysis() ??
      (queryRequirement
        ? {
            id: `query-${queryRequirement}`,
            requirement: queryRequirement,
          }
        : null)

    if (!queuedAnalysis || startedAnalysisIdRef.current === queuedAnalysis.id) return

    startedAnalysisIdRef.current = queuedAnalysis.id
    clearPendingAnalysis()

    if (window.location.search) {
      window.history.replaceState(null, '', '/workspace')
    }

    void runAnalysisPipeline(queuedAnalysis.requirement)
  }, [consumeQueuedAnalysis, isAnalyzing])

  return (
    <main
      className={`relative mx-auto flex w-full max-w-[1280px] px-0 pb-36 pt-5 transition-[gap] duration-500 ${
        collapsed ? 'gap-0' : 'gap-6'
      }`}
    >
      <aside
        className={`shrink-0 overflow-visible transition-all duration-500 ${
          collapsed
            ? 'absolute -left-16 top-5 z-20 h-auto w-11'
            : 'h-[calc(100dvh-6rem)] w-[380px] overflow-hidden rounded-[36px] border border-white/60 bg-white/58 shadow-[0_40px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl'
        } hidden lg:block`}
      >
        <div className="flex h-full flex-col">
          <div
            className={`flex ${
              collapsed
                ? 'group relative h-11 w-11 flex-col items-center justify-center rounded-full border border-white/70 bg-white/58 p-0 shadow-[0_14px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl'
                : 'items-center justify-between border-b border-black/6 px-5 py-5'
            }`}
            title={collapsed ? '一些信息和想法' : undefined}
          >
            {!collapsed ? (
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Input Context</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">一些信息和想法</h2>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className={`flex items-center justify-center text-slate-500 transition hover:text-slate-900 ${
                collapsed
                  ? 'h-11 w-11 rounded-none border-0 bg-transparent'
                  : 'h-10 w-10 rounded-full border border-black/6 bg-white/72 hover:bg-white'
              }`}
              aria-label={collapsed ? '展开输入结构' : '收起输入结构'}
              title={collapsed ? '一些信息和想法' : undefined}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {collapsed ? (
              <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-black/6 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 opacity-0 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                一些信息和想法
              </span>
            ) : null}
          </div>

          {collapsed ? (
            null
          ) : (
            <div className="apple-scroll flex-1 overflow-y-auto px-5 py-5">
              {shouldShowOriginalPrompt ? (
                <div className="rounded-[30px] border border-black/6 bg-white/72 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Original Prompt</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {requirementInput}
                  </p>
                </div>
              ) : null}

              {structuredSections.length ? (
                <div className={`${shouldShowOriginalPrompt ? 'mt-4' : ''} grid gap-4`}>
                  {structuredSections.map((section) => (
                    <StructuredCard
                      key={section.title}
                      title={section.title}
                      value={section.value}
                      icon={section.icon}
                    />
                  ))}
                </div>
              ) : null}

              {shouldShowAttachments ? (
                <div className={`${shouldShowOriginalPrompt || structuredSections.length ? 'mt-6' : ''}`}>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    <ImageIcon className="h-3.5 w-3.5" />
                    附件
                  </div>
                  <div className="mt-3 flex flex-col gap-3">
                    {attachments.map((attachment) => (
                      <AttachmentPill key={attachment.id} attachment={attachment} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="rounded-[36px] border border-white/60 bg-white/56 p-5 shadow-[0_40px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-7">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Requirement Report</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                需求分析报告
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                右侧报告根据分析阶段自动分区，左侧持续保留你的输入结构，便于一边验证上下文，一边迭代结论。
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-18">
            <div id="native-analysis-fallback" />
            <AnalysisPipeline />
            <FinalReport />
          </div>
        </div>
      </section>
      <FloatingFollowupInput sidebarCollapsed={collapsed} />
    </main>
  )
}
