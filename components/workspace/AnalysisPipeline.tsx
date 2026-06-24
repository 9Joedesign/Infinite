'use client'

import { useWorkspaceStore } from '@/store/workspaceStore'
import StageCard from './StageCard'

const STAGE_META = [
  { title: '需求理解', subtitle: '提炼核心意图，识别信息缺口' },
  { title: '需求拆解', subtitle: 'MECE拆解功能点，含验收标准' },
  { title: '需求完整性', subtitle: '检查用户、场景、路径和成功标准是否完整' },
  { title: '风险假设', subtitle: '标注隐含假设、验证方法和待确认事项' },
  { title: '流程与信息架构', subtitle: '梳理用户路径、业务流转和信息实体' },
  { title: '设计机会', subtitle: '识别功能机会、体验机会和风险转机会' },
  { title: '设计优先级', subtitle: '按设计价值、实现成本和验证必要性排序' },
]

export default function AnalysisPipeline() {
  const { stages, isAnalyzing } = useWorkspaceStore()

  const hasStarted = Object.values(stages).some((s) => s.status !== 'idle')
  if (!hasStarted && !isAnalyzing) return null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Pipeline</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">分析过程</h2>
      </div>
      {STAGE_META.map((meta, i) => (
        <StageCard
          key={i}
          stageId={i}
          title={meta.title}
          subtitle={meta.subtitle}
          status={stages[i as 0 | 1 | 2 | 3 | 4 | 5 | 6].status}
          content={stages[i as 0 | 1 | 2 | 3 | 4 | 5 | 6].content}
        />
      ))}
    </div>
  )
}
