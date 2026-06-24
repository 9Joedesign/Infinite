'use client'

import { Children, isValidElement, useEffect } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MermaidDiagram from './MermaidDiagram'
import DownloadMermaidImageButton from './DownloadMermaidImageButton'
import { extractMermaidBlocks } from '@/lib/mermaid-utils'
import { removeMermaidErrorArtifacts } from '@/lib/mermaid-render'

interface MarkdownRendererProps {
  content: string
}

function unwrapMarkdownFence(content: string) {
  const trimmed = content.trim()
  const match = trimmed.match(/^```(?:markdown|md)\s*\n([\s\S]*?)\n```$/i)
  return match ? match[1].trim() : content
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const normalizedContent = unwrapMarkdownFence(content)
  const mermaidBlocks = extractMermaidBlocks(normalizedContent)
  const downloadByTitle = new Map(mermaidBlocks.map((block) => [block.title, block]))
  const flowDownloads = mermaidBlocks.filter(
    (block) => block.title.includes('用户流程图') || block.title.includes('业务流程图') || block.title.includes('流程图')
  )

  useEffect(() => {
    removeMermaidErrorArtifacts()
  }, [normalizedContent])

  const components: Components = {
    hr() {
      return null
    },
    h2({ children, ...props }) {
      return renderFlowHeading(children, props)
    },
    h3({ children, ...props }) {
      return renderFlowHeading(children, props)
    },
    h4({ children, ...props }) {
      return renderFlowHeading(children, props)
    },
    pre({ children, ...props }) {
      const firstChild = Children.toArray(children)[0]

      if (
        isValidElement<{ className?: string }>(firstChild) &&
        /language-mermaid/.test(firstChild.props.className || '')
      ) {
        return <>{children}</>
      }

      return <pre {...props}>{children}</pre>
    },
    code({ className, children, ...props }) {
      const code = String(children).replace(/\n$/, '')
      const language = /language-(\w+)/.exec(className || '')?.[1]

      if (language === 'mermaid') {
        return <MermaidDiagram chart={code} />
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
  }

  function renderFlowHeading(children: React.ReactNode, props: React.HTMLAttributes<HTMLHeadingElement>) {
      const title = Children.toArray(children).join('').trim()
      const shouldShowDownload = title === '用户流程图' || title === '业务流程图'
      const isStageHeading = /^阶段\d{2}[:：]/.test(title)
      const fallbackIndex = title === '用户流程图' ? 0 : 1
      const block = shouldShowDownload
        ? downloadByTitle.get(title) || flowDownloads[fallbackIndex] || null
        : null

      return (
        <h3
          {...props}
          className={`not-prose flex w-full items-center justify-between gap-3 font-semibold tracking-[-0.02em] text-slate-950 ${
            isStageHeading ? 'mb-6 mt-12 text-2xl' : 'my-6 text-xl'
          }`}
        >
          <span>{children}</span>
          {block ? (
            <DownloadMermaidImageButton
              chart={block.chart}
              fileName={block.title}
              label={block.title}
            />
          ) : null}
        </h3>
      )
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {normalizedContent}
    </ReactMarkdown>
  )
}
