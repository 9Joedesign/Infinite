import { NextRequest, NextResponse } from 'next/server'
import { deleteKnowledgeDocumentById, readKnowledgeDocumentById } from '@/lib/knowledge-base'

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await deleteKnowledgeDocumentById(decodeURIComponent(id))

  if (result.deleted) {
    return NextResponse.json({ ok: true })
  }

  if (result.reason === 'built-in') {
    return NextResponse.json({ error: 'Built-in documents cannot be deleted' }, { status: 403 })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
