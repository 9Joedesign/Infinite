'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, ChevronDown, FileText, History } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'

function formatHistoryTime(value: string) {
  try {
    return new Date(value).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '刚刚'
  }
}

function NavTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? 'bg-slate-100/80 text-slate-900'
          : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-950'
      }`}
    >
      {children}
    </Link>
  )
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const {
    reportHistory,
    openReportHistory,
    reportReady,
    submittedRequirement,
    requirementInput,
    stages,
    knowledgeUsage,
  } = useWorkspaceStore()
  const thinkingActive = pathname === '/' || pathname.startsWith('/workspace')
  const knowledgeActive = pathname.startsWith('/knowledge')
  const hasCurrentReport = reportReady && (submittedRequirement.trim() || requirementInput.trim())
  const currentRequirement = submittedRequirement || requirementInput
  const currentTitleSource = currentRequirement
    .replace(/[#>*`\-[\]\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const currentReportItem = hasCurrentReport
    ? {
        id: 'current',
        title: currentTitleSource ? currentTitleSource.slice(0, 24) : '当前分析报告',
        createdAt: new Date().toISOString(),
        requirement: currentRequirement,
        stages,
        knowledgeUsage,
      }
    : null
  const visibleReports = currentReportItem
    ? [
        currentReportItem,
        ...reportHistory.filter((item) => item.requirement !== currentRequirement),
      ]
    : reportHistory

  const handleOpenHistory = (id: string) => {
    if (id === 'current') {
      router.push('/workspace')
      return
    }
    openReportHistory(id)
    router.push('/workspace')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/48 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-0">
        <Link href="/" className="flex items-center gap-0 text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center text-[22px]">
            💡
          </span>
          <span className="text-sm font-semibold tracking-[-0.02em] sm:text-base">
            一切变得有趣起来了
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-1 rounded-full border border-black/6 bg-white/36 p-1 sm:flex">
            <NavTab href="/" active={thinkingActive}>
              思考
            </NavTab>
            <NavTab href="/knowledge" active={knowledgeActive}>
              知识
            </NavTab>
          </nav>

          <div className="group relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-700"
            >
              查看报告
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute right-0 top-full z-50 w-80 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="rounded-[24px] border border-white/70 bg-white/92 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                <div className="flex items-center gap-2 px-2 py-2 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                  <History className="h-3.5 w-3.5" />
                  历史分析报告
                </div>
                {visibleReports.length ? (
                  <div className="mt-1 flex max-h-80 flex-col gap-1 overflow-y-auto">
                    {visibleReports.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleOpenHistory(item.id)}
                        className="flex items-start gap-3 rounded-[18px] px-3 py-3 text-left transition hover:bg-slate-50"
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900">{item.title}</span>
                          <span className="mt-1 block text-xs text-slate-400">
                            {item.id === 'current' ? '当前分析报告' : formatHistoryTime(item.createdAt)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[18px] bg-slate-50 px-3 py-4 text-sm leading-6 text-slate-500">
                    暂无历史报告。完成一次分析后会自动出现在这里。
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/knowledge"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/64 text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:bg-white hover:text-slate-950 sm:hidden"
            aria-label="知识库"
          >
            <BookOpen className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
