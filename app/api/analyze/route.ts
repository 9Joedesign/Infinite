import { NextRequest, NextResponse } from 'next/server'
import { streamStageAnalysis } from '@/lib/claude'
import type { AnalyzeRequest } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json()
    const { requirement, clarifyAnswers, stage, previousResults } = body

    if (!requirement || stage === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { stream, knowledgeContext } = await streamStageAnalysis(
      stage,
      requirement,
      clarifyAnswers,
      previousResults
    )
    const knowledgeUsage = {
      used: knowledgeContext.used,
      documents: knowledgeContext.documents.map((document) => ({
        title: document.title,
        reason: document.reason,
      })),
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'X-Knowledge-Usage': encodeURIComponent(JSON.stringify(knowledgeUsage)),
      },
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
