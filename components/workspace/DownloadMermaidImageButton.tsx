'use client'

import { Check, Download, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { removeMermaidErrorArtifacts, renderMermaid } from '@/lib/mermaid-render'

interface DownloadMermaidImageButtonProps {
  chart: string
  fileName: string
  label: string
}

function slugifyFileName(value: string) {
  const cleaned = value
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  return cleaned || '流程图'
}

async function svgToPng(svg: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })

    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = Math.max(image.naturalWidth || image.width, 1) * scale
    canvas.height = Math.max(image.naturalHeight || image.height, 1) * scale

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas context unavailable')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.scale(scale, scale)
    context.drawImage(image, 0, 0)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (nextBlob) resolve(nextBlob)
        else reject(new Error('Failed to export image'))
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function DownloadMermaidImageButton({
  chart,
  fileName,
  label,
}: DownloadMermaidImageButtonProps) {
  const rawId = useId()
  const renderId = `download-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleDownload = async () => {
    if (status === 'loading') return

    setStatus('loading')

    try {
      const { svg } = await renderMermaid(renderId, chart, '#ffffff')
      const pngBlob = await svgToPng(svg)
      const objectUrl = URL.createObjectURL(pngBlob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${slugifyFileName(fileName)}.png`
      link.click()
      URL.revokeObjectURL(objectUrl)

      setStatus('success')
      setTimeout(() => setStatus('idle'), 1600)
    } catch {
      removeMermaidErrorArtifacts()
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleDownload}
        disabled={status === 'loading'}
        className={`flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
          status === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
            : status === 'error'
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-black/6 bg-white/72 text-slate-400 hover:bg-white hover:text-slate-900'
        }`}
        aria-label={`下载${label}图片`}
        title={`下载${label}图片`}
      >
        {status === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'success' ? (
          <Check className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {status === 'loading' ? '下载中' : status === 'success' ? '已下载' : '下载'}
      </button>
      {status === 'success' || status === 'error' ? (
        <span
          role="status"
          className={`pointer-events-none absolute right-0 top-10 z-10 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium shadow-[0_12px_30px_rgba(15,23,42,0.12)] ${
            status === 'success' ? 'bg-slate-900 text-white' : 'bg-red-50 text-red-600 ring-1 ring-red-100'
          }`}
        >
          {status === 'success' ? '已下载' : '下载失败'}
        </span>
      ) : null}
    </div>
  )
}
