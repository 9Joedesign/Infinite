'use client'

import { useRef, useState } from 'react'
import { ArrowUpRight, Loader2, Paperclip } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { attachmentFromFile, revokeAttachmentPreview } from '@/lib/attachments'
import { buildAnalysisRequirement } from '@/lib/analysis-input'
import { extractStructuredInput } from '@/lib/structured-input'
import { runAnalysisPipeline } from '@/lib/pipeline'
import AttachmentPill from './AttachmentPill'

interface FloatingFollowupInputProps {
  sidebarCollapsed?: boolean
}

export default function FloatingFollowupInput({ sidebarCollapsed = false }: FloatingFollowupInputProps) {
  const {
    attachments,
    addAttachments,
    removeAttachment,
    structuredInput,
    mergeStructuredInput,
    requirementInput,
    setRequirementInput,
    submittedRequirement,
    isAnalyzing,
    reportReady,
  } = useWorkspaceStore()
  const [followupText, setFollowupText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasFollowupInput = followupText.trim().length > 0 || attachments.length > 0

  if (!reportReady) return null

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (!files.length) return

    const nextAttachments = await Promise.all(files.map((file) => attachmentFromFile(file)))
    addAttachments(nextAttachments)

    const textSnippets = nextAttachments
      .filter((attachment) => attachment.kind === 'text' && attachment.textContent)
      .map((attachment) => attachment.textContent!.trim())
      .filter(Boolean)

    if (textSnippets.length) {
      setFollowupText((current) => [current.trim(), ...textSnippets].filter(Boolean).join('\n\n'))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    await handleFiles(files)
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  const handleRemoveAttachment = (id: string) => {
    const attachment = attachments.find((item) => item.id === id)
    if (attachment) {
      revokeAttachmentPreview(attachment)
    }
    removeAttachment(id)
  }

  const handleSubmit = async () => {
    const trimmedFollowup = followupText.trim()
    if (!hasFollowupInput || isAnalyzing) return

    const baseRequirement = submittedRequirement || requirementInput
    const nextRequirementInput = [
      baseRequirement.trim(),
      trimmedFollowup ? '## 补充信息' : '',
      trimmedFollowup,
    ]
      .filter(Boolean)
      .join('\n\n')

    const extractedStructuredInput = extractStructuredInput(trimmedFollowup)
    const nextStructuredInput = {
      ...structuredInput,
      ...Object.fromEntries(
        Object.entries(extractedStructuredInput).filter(
          ([, value]) => typeof value === 'string' && value.trim()
        )
      ),
    }

    setRequirementInput(nextRequirementInput)
    mergeStructuredInput(extractedStructuredInput)

    const mergedRequirement = buildAnalysisRequirement(nextRequirementInput, nextStructuredInput, attachments)
    setFollowupText('')
    await runAnalysisPipeline(mergedRequirement.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFollowupText(e.target.value)
    e.target.style.height = '36px'
    e.target.style.height = `${Math.min(Math.max(e.target.scrollHeight, 36), 96)}px`
  }

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-8 sm:px-6 lg:pr-8 ${
        sidebarCollapsed ? 'lg:pl-[calc(74px+3.5rem)]' : 'lg:pl-[calc(380px+3.5rem)]'
      }`}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`pointer-events-auto mx-auto w-4/5 max-w-[600px] rounded-[24px] border bg-white/88 p-2.5 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl transition ${
          isDragging ? 'border-slate-900/20 ring-1 ring-slate-900/10' : 'border-white/70'
        }`}
      >
        {attachments.length ? (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="min-w-[220px]">
                <AttachmentPill attachment={attachment} onRemove={handleRemoveAttachment} />
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/6 bg-slate-100 text-slate-600 transition hover:bg-white hover:text-slate-950"
            aria-label="添加补充附件"
            title="添加补充附件"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <div className="flex min-h-9 min-w-0 flex-1 items-center">
            <textarea
              value={followupText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="补充更多信息、想法和追问反馈，继续完善分析"
              rows={1}
              disabled={isAnalyzing}
              className="h-9 max-h-24 min-h-9 w-full resize-none overflow-y-auto border-0 bg-transparent py-2 text-sm leading-5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasFollowupInput || isAnalyzing}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                完善中
              </>
            ) : (
              <>
                继续完善
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.md,.markdown,.json,.csv,.tsv,.pdf,.doc,.docx,.ppt,.pptx"
          className="hidden"
          multiple
          onChange={handleFileUpload}
        />
      </div>
    </div>
  )
}
