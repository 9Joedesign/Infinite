'use client'

import Header from '@/components/layout/Header'
import ReportWorkspace from '@/components/workspace/ReportWorkspace'

export default function WorkspacePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(243,246,249,0.9)_34%,rgba(231,236,242,0.82)_72%,rgba(224,230,236,0.76))]">
      <Header />
      <ReportWorkspace />
    </div>
  )
}
