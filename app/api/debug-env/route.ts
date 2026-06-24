import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ANTHROPIC_AUTH_TOKEN: Boolean(process.env.ANTHROPIC_AUTH_TOKEN),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    ANTHROPIC_BASE_URL: Boolean(process.env.ANTHROPIC_BASE_URL),
    ANTHROPIC_MODEL: Boolean(process.env.ANTHROPIC_MODEL),
    NODE_ENV: process.env.NODE_ENV,
  })
}
