'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { attachmentFromFile, revokeAttachmentPreview } from '@/lib/attachments'
import { buildAnalysisRequirement } from '@/lib/analysis-input'
import { savePendingAnalysis } from '@/lib/pending-analysis'
import { extractStructuredInput } from '@/lib/structured-input'
import type { StructuredInputState } from '@/lib/types'
import AttachmentPill from './AttachmentPill'
import {
  ArrowUpRight,
  Loader2,
  Paperclip,
  Sparkles,
} from 'lucide-react'

const emptyStructuredInput: StructuredInputState = {
  businessGoal: '',
  targetUser: '',
  scenario: '',
  successCriteria: '',
  notes: '',
}

export default function InputPanel() {
  const router = useRouter()
  const {
    setRequirementInput,
    setStructuredField,
    mergeStructuredInput,
    attachments,
    addAttachments,
    removeAttachment,
    isAnalyzing,
    queueAnalysis,
  } = useWorkspaceStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requirementTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draftRequirement, setDraftRequirement] = useState('')
  const [draftStructuredInput, setDraftStructuredInput] =
    useState<StructuredInputState>(emptyStructuredInput)
  const hasInput =
    draftRequirement.trim().length > 0 ||
    Object.values(draftStructuredInput).some((value) => value.trim().length > 0) ||
    attachments.length > 0

  const handleRequirementChange = (value: string) => {
    setDraftRequirement(value)
    setRequirementInput(value)
  }

  const handleStructuredFieldChange = (
    field: keyof StructuredInputState,
    value: string
  ) => {
    setDraftStructuredInput((current) => ({
      ...current,
      [field]: value,
    }))
    setStructuredField(field, value)
  }

  const handleAnalyze = async () => {
    const latestRequirement = requirementTextareaRef.current?.value ?? draftRequirement

    if (latestRequirement !== draftRequirement) {
      setDraftRequirement(latestRequirement)
    }

    setRequirementInput(latestRequirement)
    const extractedStructuredInput = extractStructuredInput(latestRequirement)
    const nextStructuredInput = {
      ...draftStructuredInput,
      ...Object.fromEntries(
        Object.entries(extractedStructuredInput).filter(([, value]) => typeof value === 'string' && value.trim())
      ),
    }

    mergeStructuredInput(extractedStructuredInput)
    const mergedRequirement = buildAnalysisRequirement(latestRequirement, nextStructuredInput, attachments)
    if (!mergedRequirement.trim() || isAnalyzing) return
    const analysisRequirement = mergedRequirement.trim()

    queueAnalysis(analysisRequirement)
    savePendingAnalysis(analysisRequirement)
    router.push('/workspace?run=1')

    window.setTimeout(() => {
      if (window.location.pathname !== '/workspace') {
        window.location.assign('/workspace?run=1')
      }
    }, 300)
  }

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
      const mergedText = textSnippets.join('\n\n')
      handleRequirementChange(draftRequirement ? `${draftRequirement.trim()}\n\n${mergedText}` : mergedText)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    await handleFiles(files)
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAnalyze()
    }
  }

  return (
    <form
      action="/workspace"
      method="get"
      onSubmit={(e) => {
        e.preventDefault()
        void handleAnalyze()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`analysis-input-form mx-auto w-full max-w-5xl rounded-[38px] border bg-white/64 p-5 shadow-[0_35px_120px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 sm:p-7 ${
        isDragging ? 'border-slate-900/15 ring-1 ring-slate-900/10' : 'border-white/60'
      }`}
    >
      <div className="rounded-[32px] bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(248,250,252,0.7))] p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Conversation Input</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-slate-950 sm:text-xl">
              需求、草图、截图、会议纪要和零散想法都放进来
            </h2>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="flex min-h-[320px] flex-col rounded-[30px] border border-black/6 bg-white/82 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <textarea
              ref={requirementTextareaRef}
              value={draftRequirement}
              onChange={(e) => handleRequirementChange(e.target.value)}
              onInput={(e) => handleRequirementChange(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              name="requirement"
              placeholder="放啥都行！"
              className="analysis-requirement-input min-h-[240px] w-full flex-1 resize-none border-0 bg-transparent text-base leading-8 tracking-[-0.01em] text-slate-800 placeholder:text-slate-400 focus:outline-none sm:min-h-[280px] sm:text-[17px]"
              disabled={isAnalyzing}
            />

            <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-black/6 pt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                <Paperclip className="h-4 w-4" />
                添加素材
              </button>
              <div className="ml-auto inline-flex items-center gap-2 px-1 py-2 text-xs text-[lab(16.132_-0.318035_-14.6672)]">
                <Sparkles className="h-3.5 w-3.5" />
                Cmd/Ctrl + Enter 快速开始
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <label className="rounded-[28px] border border-black/6 bg-white/74 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">业务目标</span>
              <input
                value={draftStructuredInput.businessGoal}
                onChange={(e) => handleStructuredFieldChange('businessGoal', e.target.value)}
                name="businessGoal"
                placeholder="例如：冷启动激活、提升 IM 绑定率"
                className="mt-3 w-full border-0 bg-transparent text-sm leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </label>

            <label className="rounded-[28px] border border-black/6 bg-white/74 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">目标用户</span>
              <input
                value={draftStructuredInput.targetUser}
                onChange={(e) => handleStructuredFieldChange('targetUser', e.target.value)}
                name="targetUser"
                placeholder="例如：泛电商用户"
                className="mt-3 w-full border-0 bg-transparent text-sm leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </label>

            <label className="rounded-[28px] border border-black/6 bg-white/74 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">核心场景</span>
              <textarea
                value={draftStructuredInput.scenario}
                onChange={(e) => handleStructuredFieldChange('scenario', e.target.value)}
                name="scenario"
                placeholder="例如：用户第一次接触 ChanClaw，完成冷启动和提醒接入"
                rows={2}
                className="mt-3 min-h-14 w-full resize-none border-0 bg-transparent text-sm leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </label>

            <label className="rounded-[28px] border border-black/6 bg-white/74 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">成功标准</span>
              <input
                value={draftStructuredInput.successCriteria}
                onChange={(e) => handleStructuredFieldChange('successCriteria', e.target.value)}
                name="successCriteria"
                placeholder="例如：IM 绑定率"
                className="mt-3 w-full border-0 bg-transparent text-sm leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </label>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.md,.markdown,.json,.csv,.tsv,.pdf,.doc,.docx,.ppt,.pptx"
          className="hidden"
          multiple
          onChange={handleFileUpload}
        />

        {attachments.length ? (
          <div className="mt-5 flex flex-col gap-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">附件</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {attachments.map((attachment) => (
                <AttachmentPill
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={handleRemoveAttachment}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-center border-t border-black/6 pt-5">
          <button
            type="submit"
            disabled={isAnalyzing}
            className={`analysis-submit-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${
              hasInput && !isAnalyzing
                ? 'bg-slate-900 text-white hover:bg-slate-700'
                : 'cursor-not-allowed bg-slate-200 text-slate-400'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                分析中…
              </>
            ) : (
              <>
                开始思考
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
