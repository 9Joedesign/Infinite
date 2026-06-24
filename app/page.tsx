import Header from '@/components/layout/Header'
import InputPanel from '@/components/workspace/InputPanel'
import { Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(244,247,251,0.9)_32%,rgba(235,241,247,0.82)_65%,rgba(227,234,241,0.78))]">
      <Header />
      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-[-120px] h-[520px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_38%),radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_50%_55%,rgba(255,255,255,0.38),transparent_42%)]" />

        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 text-center sm:px-6 lg:px-8 lg:pt-12">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm text-slate-500 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            为想法、需求和不确定性准备的脑暴空间
          </div>

          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
            一起思考些有趣的事儿
          </h1>
        </section>

        <section className="relative mx-auto max-w-6xl px-4 pb-20 sm:-mt-2 sm:px-6 lg:px-8">
          <InputPanel />
        </section>
      </main>
    </div>
  )
}
