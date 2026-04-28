'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function marcarServicoPago(servicoId: string, contaId: string) {
  if (!contaId) throw new Error('Conta de recebimento obrigatória')

  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Busca o serviço atual
  const { data: servico, error: fetchError } = await supabase
    .from('servicos')
    .select('status, data_conclusao')
    .eq('id', servicoId)
    .single()

  if (fetchError || !servico) throw new Error('Serviço não encontrado')

  const updates: Record<string, unknown> = {
    pagamento_status: 'pago',
    conta_id: contaId,
  }

  // Se ainda não está concluído, conclui agora
  if (servico.status !== 'concluido') {
    updates.status = 'concluido'
  }

  // Se data_conclusao não foi preenchida, define como hoje
  if (!servico.data_conclusao) {
    updates.data_conclusao = today
  }

  const { error } = await supabase
    .from('servicos')
    .update(updates)
    .eq('id', servicoId)

  if (error) throw new Error('Erro ao atualizar pagamento')

  // Invalida o cache de todas as páginas afetadas
  revalidatePath('/dashboard')
  revalidatePath('/servicos')
  revalidatePath(`/servicos/${servicoId}`)
}

export async function desmarcarServicoConcluido(servicoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('servicos')
    .update({ status: 'em_andamento', data_conclusao: null })
    .eq('id', servicoId)

  if (error) throw new Error('Erro ao desmarcar conclusão')

  revalidatePath('/dashboard')
  revalidatePath('/servicos')
  revalidatePath(`/servicos/${servicoId}`)
}

export async function desmarcarServicoPago(servicoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('servicos')
    .update({ pagamento_status: 'a_receber', conta_id: null })
    .eq('id', servicoId)

  if (error) throw new Error('Erro ao desmarcar pagamento')

  revalidatePath('/dashboard')
  revalidatePath('/servicos')
  revalidatePath(`/servicos/${servicoId}`)
}

export async function marcarServicoConcluido(servicoId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: servico, error: fetchError } = await supabase
    .from('servicos')
    .select('data_conclusao')
    .eq('id', servicoId)
    .single()

  if (fetchError || !servico) throw new Error('Serviço não encontrado')

  const updates: Record<string, unknown> = { status: 'concluido' }
  if (!servico.data_conclusao) updates.data_conclusao = today

  const { error } = await supabase
    .from('servicos')
    .update(updates)
    .eq('id', servicoId)

  if (error) throw new Error('Erro ao atualizar status')

  revalidatePath('/dashboard')
  revalidatePath('/servicos')
  revalidatePath(`/servicos/${servicoId}`)
}
