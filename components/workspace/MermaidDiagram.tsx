'use client'

import { useEffect, useId, useState } from 'react'
import { removeMermaidErrorArtifacts, renderMermaid } from '@/lib/mermaid-render'

interface MermaidDiagramProps {
  chart: string
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const rawId = useId()
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function renderDiagram() {
      try {
        const { svg: nextSvg } = await renderMermaid(id, chart)
        if (!cancelled) {
          setSvg(nextSvg)
          setError(false)
        }
      } catch {
        removeMermaidErrorArtifacts()
        if (!cancelled) {
          setSvg('')
          setError(true)
        }
      }
    }

    renderDiagram()

    return () => {
      cancelled = true
    }
  }, [chart, id])

  if (error) return null

  return (
    <div className="not-prose my-5 overflow-x-auto">
      {svg ? (
        <div
          className="min-w-fit [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-none"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100/70" />
      )}
    </div>
  )
}
