import { NextRequest, NextResponse } from 'next/server'
import { listKnowledgeDocuments, saveKnowledgeDocument } from '@/lib/knowledge-base'

export const runtime = 'nodejs'

export async function GET() {
  const documents = await listKnowledgeDocuments()
  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const content = await file.text()
  const saved = await saveKnowledgeDocument(file.name, content)

  return NextResponse.json({ document: saved })
}
