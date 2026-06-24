export interface MermaidBlock {
  title: string
  chart: string
}

const MERMAID_BLOCK_RE = /(?:^|\n)```mermaid\s*\n([\s\S]*?)\n```/g

export function extractMermaidBlocks(content: string): MermaidBlock[] {
  const blocks: MermaidBlock[] = []
  let match: RegExpExecArray | null

  while ((match = MERMAID_BLOCK_RE.exec(content)) !== null) {
    const chart = match[1].trim()
    const before = content.slice(0, match.index)
    const headings = [...before.matchAll(/^#{2,4}\s+(.+)$/gm)]
    const heading = headings.at(-1)?.[1]?.trim()
    const fallbackTitle = `流程图 ${blocks.length + 1}`

    blocks.push({
      title: heading || fallbackTitle,
      chart,
    })
  }

  return blocks
}

