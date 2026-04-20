import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('landing_config')
      .select('data')
      .maybeSingle()
    return NextResponse.json({ data: data?.data ?? null })
  } catch {
    return NextResponse.json({ data: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    const { error } = await supabase
      .from('landing_config')
      .upsert({ id: 1, data: body, updated_at: new Date().toISOString() })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[landing/route] POST error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
