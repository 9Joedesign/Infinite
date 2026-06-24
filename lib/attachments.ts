import type { AttachmentItem } from './types'

const TEXT_EXTENSIONS = new Set(['txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'yaml', 'yml'])
const MAX_TEXT_LENGTH = 4000

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function isTextFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return file.type.startsWith('text/') || TEXT_EXTENSIONS.has(extension)
}

export async function attachmentFromFile(file: File): Promise<AttachmentItem> {
  const id = `${file.name}-${file.size}-${file.lastModified}`

  if (file.type.startsWith('image/')) {
    return {
      id,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      kind: 'image',
      previewUrl: URL.createObjectURL(file),
    }
  }

  if (isTextFile(file)) {
    const rawText = await readFileAsText(file)
    return {
      id,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'text/plain',
      kind: 'text',
      textContent: rawText.slice(0, MAX_TEXT_LENGTH),
    }
  }

  return {
    id,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    kind: 'file',
  }
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function revokeAttachmentPreview(attachment: AttachmentItem) {
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl)
  }
}
