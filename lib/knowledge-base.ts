import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

interface KnowledgeDocument {
  id: string
  title: string
  absolutePath: string
  keywords: string[]
  priority: number
}

export interface KnowledgeListItem {
  id: string
  title: string
  source: 'built-in' | 'uploaded'
  size: number
  updatedAt: string
  downloadUrl: string
}

export interface KnowledgeContext {
  used: boolean
  directory: string
  documents: Array<{
    id: string
    title: string
    path: string
    reason: string
  }>
  content: string
}

const KNOWLEDGE_ROOT = join(/* turbopackIgnore: true */ process.cwd(), 'data', 'knowledge')
const BUILT_IN_KNOWLEDGE_DIR = join(KNOWLEDGE_ROOT, 'built-in')
const USER_KNOWLEDGE_DIR = join(KNOWLEDGE_ROOT, 'uploads')
const USER_KNOWLEDGE_MAX_CHARS = 16000

const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'chanmama-ai-main-blueprint',
    title: '蝉妈妈AI-主蓝图',
    absolutePath: join(BUILT_IN_KNOWLEDGE_DIR, '蝉妈妈AI-主蓝图.md'),
    priority: 1,
    keywords: [
      '蝉妈妈',
      '蝉妈妈AI',
      'ChanClaw',
      'chanClaw',
      'chanclaw',
      '冷启动',
      'IM',
      '工作消息',
      '数据看板',
      'AI对话',
      '视频创作',
      '技能管理',
      '官网入口',
    ],
  },
  {
    id: 'chanmama-ai-blueprint-details',
    title: '蝉妈妈AI-蓝图详情',
    absolutePath: join(BUILT_IN_KNOWLEDGE_DIR, '蝉妈妈AI-蓝图详情.md'),
    priority: 2,
    keywords: [
      '蝉妈妈',
      '蝉妈妈AI',
      'ChanClaw',
      'chanClaw',
      'chanclaw',
      '入口',
      '页面',
      '字段',
      '表格',
      'Tab',
      '弹窗',
      '抽屉',
      '按钮',
      'IM接入',
      '技能管理',
    ],
  },
]

function getKnowledgeDir() {
  return KNOWLEDGE_ROOT
}

function normalize(text: string) {
  return text.toLowerCase()
}

function matchDocument(requirement: string, document: KnowledgeDocument) {
  const normalizedRequirement = normalize(requirement)
  const matchedKeywords = document.keywords.filter((keyword) =>
    normalizedRequirement.includes(normalize(keyword))
  )

  return matchedKeywords
}

function truncateContent(content: string, maxChars = 28000) {
  if (content.length <= maxChars) return content
  return `${content.slice(0, maxChars)}\n\n[知识库文档过长，后续内容已截断。]`
}

function safeKnowledgeFileName(name: string) {
  const fileName = name.split('/').pop()?.split('\\').pop() || 'knowledge.md'
  const dotIndex = fileName.lastIndexOf('.')
  const ext = dotIndex > -1 ? fileName.slice(dotIndex) : '.md'
  const rawBase = dotIndex > -1 ? fileName.slice(0, dotIndex) : fileName
  const base = rawBase
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${base || 'knowledge'}-${Date.now()}${ext}`
}

async function listUploadedKnowledgeFiles() {
  await mkdir(USER_KNOWLEDGE_DIR, { recursive: true })
  const names = await readdir(USER_KNOWLEDGE_DIR)

  return names
    .filter((name) => !name.startsWith('.'))
    .map((name) => ({ fileName: name, filePath: `${USER_KNOWLEDGE_DIR}/${name}` }))
}

export async function listKnowledgeDocuments(): Promise<KnowledgeListItem[]> {
  const builtIn = await Promise.all(
    KNOWLEDGE_DOCUMENTS.map(async (document) => {
      const info = await stat(document.absolutePath)
      return {
        id: document.id,
        title: document.title,
        source: 'built-in' as const,
        size: info.size,
        updatedAt: info.mtime.toISOString(),
        downloadUrl: `/api/knowledge/${document.id}`,
      }
    })
  )

  const uploadedFiles = await listUploadedKnowledgeFiles()
  const uploaded = await Promise.all(
    uploadedFiles.map(async ({ fileName, filePath }) => {
      const info = await stat(filePath)
      return {
        id: `uploaded:${fileName}`,
        title: fileName,
        source: 'uploaded' as const,
        size: info.size,
        updatedAt: info.mtime.toISOString(),
        downloadUrl: `/api/knowledge/${encodeURIComponent(`uploaded:${fileName}`)}`,
      }
    })
  )

  return [...builtIn, ...uploaded].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
}

export async function saveKnowledgeDocument(fileName: string, content: string) {
  await mkdir(USER_KNOWLEDGE_DIR, { recursive: true })
  const safeName = safeKnowledgeFileName(fileName)
  const filePath = `${USER_KNOWLEDGE_DIR}/${safeName}`
  await writeFile(filePath, content, 'utf8')

  return {
    id: `uploaded:${safeName}`,
    title: safeName,
  }
}

export async function readKnowledgeDocumentById(id: string) {
  if (id.startsWith('uploaded:')) {
    const fileName = id.slice('uploaded:'.length).split('/').pop()?.split('\\').pop() || ''
    const filePath = `${USER_KNOWLEDGE_DIR}/${fileName}`
    return {
      fileName,
      content: await readFile(filePath, 'utf8'),
    }
  }

  const builtIn = KNOWLEDGE_DOCUMENTS.find((document) => document.id === id)
  if (!builtIn) return null

  return {
    fileName: `${builtIn.title}.md`,
    content: await readFile(builtIn.absolutePath, 'utf8'),
  }
}

export async function loadKnowledgeContext(requirement: string): Promise<KnowledgeContext> {
  const directory = getKnowledgeDir()
  const matched = KNOWLEDGE_DOCUMENTS.map((document) => ({
    document,
    matchedKeywords: matchDocument(requirement, document),
  }))
    .filter((item) => item.matchedKeywords.length > 0)
    .sort((a, b) => a.document.priority - b.document.priority)
  const uploadedFiles = await listUploadedKnowledgeFiles()
  const uploadedDocuments = await Promise.all(
    uploadedFiles.map(async ({ fileName, filePath }) => ({
      id: `uploaded:${fileName}`,
      title: fileName,
      path: filePath,
      reason: '用户上传知识文档，默认参与分析',
      content: truncateContent(await readFile(filePath, 'utf8'), USER_KNOWLEDGE_MAX_CHARS),
    }))
  )

  if (!matched.length && !uploadedDocuments.length) {
    return {
      used: false,
      directory,
      documents: [],
      content: [
        '## 知识库调用情况',
        '本次已检索内置知识库，但未命中特定业务语境文档。',
        '请在分析中明确标注：知识库未命中，相关结论仅基于用户输入和通用产品设计判断。',
      ].join('\n'),
    }
  }

  const documents = await Promise.all(
    matched.map(async ({ document, matchedKeywords }) => {
      const absolutePath = document.absolutePath
      const raw = await readFile(absolutePath, 'utf8')

      return {
        id: document.id,
        title: document.title,
        path: absolutePath,
        reason: `命中关键词：${matchedKeywords.join('、')}`,
        content: truncateContent(raw),
      }
    })
  )
  const allDocuments = [...documents, ...uploadedDocuments]

  return {
    used: allDocuments.length > 0,
    directory,
    documents: allDocuments.map(({ id, title, path: filePath, reason }) => ({
      id,
      title,
      path: filePath,
      reason,
    })),
    content: [
      '## 知识库调用情况',
      '本次已调用内置知识库。分析中必须区分“已有知识库证据支持”和“知识库未覆盖/待确认”。',
      '',
      ...allDocuments.map(
        (document) => [
          `### ${document.title}`,
          `- 文档ID：${document.id}`,
          `- 文件路径：${document.path}`,
          `- 调用原因：${document.reason}`,
          '',
          document.content,
        ].join('\n')
      ),
    ].join('\n\n'),
  }
}
