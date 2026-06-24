import { NextRequest, NextResponse } from 'next/server'
import { readKnowledgeDocumentById } from '@/lib/knowledge-base'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const document = await readKnowledgeDocumentById(decodeURIComponent(id))

  if (!document) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new Response(document.content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
    },
  })
}
