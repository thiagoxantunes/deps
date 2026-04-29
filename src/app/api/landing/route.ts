import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: público — apenas leitura da configuração da landing page
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

// POST: protegido — apenas usuários autenticados podem alterar a landing
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('landing_config')
      .upsert({ id: 1, data: body, updated_at: new Date().toISOString() })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[landing/route] POST error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
