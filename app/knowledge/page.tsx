'use client'

import Header from '@/components/layout/Header'
import { Download, FileText, Loader2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface KnowledgeDocument {
  id: string
  title: string
  source: 'built-in' | 'uploaded'
  size: number
  updatedAt: string
  downloadUrl: string
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/knowledge')
      if (!res.ok) throw new Error('读取知识库失败')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch {
      setError('知识库读取失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialDocuments = async () => {
      try {
        const res = await fetch('/api/knowledge')
        if (!res.ok) throw new Error('读取知识库失败')
        const data = await res.json()
        if (cancelled) return
        setDocuments(data.documents || [])
      } catch {
        if (!cancelled) setError('知识库读取失败，请稍后重试。')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadInitialDocuments()

    return () => {
      cancelled = true
    }
  }, [])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    try {
      setUploading(true)
      setError('')
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('上传失败')
      event.target.value = ''
      await loadDocuments()
    } catch {
      setError('上传失败，请确认文件格式后重试。')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(243,246,249,0.9)_34%,rgba(231,236,242,0.82)_72%,rgba(224,230,236,0.76))]">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-20 pt-8 sm:px-6 lg:px-0">
        <section className="rounded-[36px] border border-white/60 bg-white/56 p-6 shadow-[0_40px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Knowledge Base</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                知识库
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                管理需求分析会调用的业务语境、蓝图和风险经验。上传的文档会默认参与后续分析。
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-black/6 bg-white/72 px-4 text-sm font-medium text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:bg-white hover:text-slate-950 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              上传知识
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt,.json,.csv,.tsv"
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {error ? (
            <div className="mt-6 rounded-[20px] border border-red-100 bg-red-50/70 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="mt-8 overflow-hidden rounded-[28px] border border-black/6 bg-white/72">
            <div className="grid grid-cols-[1fr_120px_120px_88px] gap-4 border-b border-black/6 px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              <span>文档</span>
              <span>来源</span>
              <span>更新</span>
              <span className="text-right">操作</span>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在读取知识库
              </div>
            ) : documents.length ? (
              <div className="divide-y divide-black/6">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="grid grid-cols-[1fr_120px_120px_88px] items-center gap-4 px-5 py-4 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{document.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatSize(document.size)}</p>
                      </div>
                    </div>
                    <span className="text-slate-500">
                      {document.source === 'built-in' ? '内置' : '上传'}
                    </span>
                    <span className="text-slate-500">{formatDate(document.updatedAt)}</span>
                    <a
                      href={document.downloadUrl}
                      className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-black/6 bg-white/72 text-slate-500 transition hover:bg-white hover:text-slate-950"
                      aria-label={`下载${document.title}`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-sm text-slate-500">暂无知识文档。</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
