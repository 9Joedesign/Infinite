'use client'

import Image from 'next/image'
import { FileText, ImageIcon, Paperclip, X } from 'lucide-react'
import { formatFileSize } from '@/lib/attachments'
import type { AttachmentItem } from '@/lib/types'

interface AttachmentPillProps {
  attachment: AttachmentItem
  onRemove?: (id: string) => void
  compact?: boolean
}

function AttachmentIcon({ attachment }: { attachment: AttachmentItem }) {
  if (attachment.kind === 'image' && attachment.previewUrl) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-black/6 bg-white/80">
        <Image
          src={attachment.previewUrl}
          alt={attachment.name}
          fill
          className="object-cover"
          sizes="40px"
          unoptimized
        />
      </div>
    )
  }

  if (attachment.kind === 'text') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/6 bg-white/80 text-slate-500">
        <FileText className="h-4 w-4" />
      </div>
    )
  }

  if (attachment.kind === 'image') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/6 bg-white/80 text-slate-500">
        <ImageIcon className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/6 bg-white/80 text-slate-500">
      <Paperclip className="h-4 w-4" />
    </div>
  )
}

export default function AttachmentPill({ attachment, onRemove, compact = false }: AttachmentPillProps) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-[22px] border border-black/6 bg-white/78 text-left shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-md ${
        compact ? 'px-3 py-2' : 'px-3.5 py-3'
      }`}
    >
      <AttachmentIcon attachment={attachment} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-900">{attachment.name}</div>
        <div className="mt-0.5 text-xs text-slate-500">
          {attachment.kind === 'image' ? '图片参考' : attachment.kind === 'text' ? '文本附件' : '文件附件'}
          {' · '}
          {formatFileSize(attachment.size)}
        </div>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(attachment.id)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-700"
          aria-label={`删除 ${attachment.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
