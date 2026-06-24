import type { AttachmentItem, StructuredInputState } from './types'

function trimOrEmpty(value: string) {
  return value.trim()
}

export function buildAnalysisRequirement(
  requirementInput: string,
  structuredInput: StructuredInputState,
  attachments: AttachmentItem[]
) {
  const parts: string[] = []
  const rawRequirement = trimOrEmpty(requirementInput)

  if (rawRequirement) {
    parts.push(rawRequirement)
  }

  const structuredEntries = [
    ['业务目标', trimOrEmpty(structuredInput.businessGoal)],
    ['目标用户', trimOrEmpty(structuredInput.targetUser)],
    ['核心场景', trimOrEmpty(structuredInput.scenario)],
    ['成功标准', trimOrEmpty(structuredInput.successCriteria)],
    ['补充说明', trimOrEmpty(structuredInput.notes)],
  ].filter(([, value]) => value)

  if (structuredEntries.length) {
    parts.push(
      [
        '## 补充上下文',
        ...structuredEntries.map(([label, value]) => `- ${label}：${value}`),
      ].join('\n')
    )
  }

  if (attachments.length) {
    const attachmentLines = attachments.map((attachment) => {
      if (attachment.kind === 'text' && attachment.textContent) {
        return `- ${attachment.name}（文本附件）\n\n\`\`\`\n${attachment.textContent}\n\`\`\``
      }

      if (attachment.kind === 'image') {
        return `- ${attachment.name}（图片附件，作为视觉参考）`
      }

      return `- ${attachment.name}（文件附件）`
    })

    parts.push(['## 附件信息', ...attachmentLines].join('\n\n'))
  }

  return parts.join('\n\n').trim()
}
