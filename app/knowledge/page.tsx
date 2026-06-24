import KnowledgePageClient from '@/components/knowledge/KnowledgePageClient'
import { listKnowledgeDocuments, type KnowledgeListItem } from '@/lib/knowledge-base'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function KnowledgePage() {
  let documents: KnowledgeListItem[] = []
  let error = ''

  try {
    documents = await listKnowledgeDocuments()
  } catch (loadError) {
    console.error('Knowledge page initial load failed:', loadError)
    error = '知识库读取失败，请稍后重试。'
  }

  return <KnowledgePageClient initialDocuments={documents} initialError={error} />
}
