'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function revalidarOrcamentos() {
  revalidatePath('/orcamentos')
  revalidatePath('/dashboard')
}

interface ItemPayload {
  descricao: string
  valor: number
}

interface OrcamentoPayload {
  cliente_id: string
  veiculo_id: string | null
  observacoes: string | null
  validade: string | null
  status: 'rascunho' | 'enviado'
  itens: ItemPayload[]
}

/** Cria um novo orçamento + itens em transação lógica */
export async function criarOrcamento(payload: OrcamentoPayload) {
  const supabase = await createClient()

  const valorTotal = payload.itens.reduce((s, i) => s + (i.valor || 0), 0)

  const { data: orcamento, error } = await supabase
    .from('orcamentos')
    .insert({
      cliente_id: payload.cliente_id,
      veiculo_id: payload.veiculo_id,
      observacoes: payload.observacoes,
      validade: payload.validade,
      status: payload.status,
      valor_total: valorTotal,
    })
    .select()
    .single()

  if (error || !orcamento) throw new Error('Erro ao criar orçamento')

  if (payload.itens.length > 0) {
    const itens = payload.itens.map((it, i) => ({
      orcamento_id: orcamento.id,
      descricao: it.descricao,
      valor: it.valor,
      ordem: i,
    }))
    const { error: itensError } = await supabase.from('orcamento_itens').insert(itens)
    if (itensError) {
      // rollback manual
      await supabase.from('orcamentos').delete().eq('id', orcamento.id)
      throw new Error('Erro ao adicionar itens')
    }
  }

  revalidatePath('/orcamentos')
  return orcamento.id
}

/** Atualiza um orçamento existente + substitui itens */
export async function atualizarOrcamento(id: string, payload: OrcamentoPayload) {
  const supabase = await createClient()

  const valorTotal = payload.itens.reduce((s, i) => s + (i.valor || 0), 0)

  const { error } = await supabase
    .from('orcamentos')
    .update({
      cliente_id: payload.cliente_id,
      veiculo_id: payload.veiculo_id,
      observacoes: payload.observacoes,
      validade: payload.validade,
      status: payload.status,
      valor_total: valorTotal,
    })
    .eq('id', id)

  if (error) throw new Error('Erro ao atualizar orçamento')

  // Substitui itens: apaga existentes e insere novos
  await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)

  if (payload.itens.length > 0) {
    const itens = payload.itens.map((it, i) => ({
      orcamento_id: id,
      descricao: it.descricao,
      valor: it.valor,
      ordem: i,
    }))
    const { error: itensError } = await supabase.from('orcamento_itens').insert(itens)
    if (itensError) throw new Error('Erro ao salvar itens')
  }

  revalidatePath('/orcamentos')
  revalidatePath(`/orcamentos/${id}`)
}

/** Aprova o orçamento e gera um serviço vinculado */
export async function aprovarOrcamento(id: string) {
  const supabase = await createClient()

  const { data: orcamento, error: fetchError } = await supabase
    .from('orcamentos')
    .select('*, itens:orcamento_itens(*)')
    .eq('id', id)
    .single()

  if (fetchError || !orcamento) throw new Error('Orçamento não encontrado')

  if (orcamento.servico_id) throw new Error('Orçamento já foi aprovado')

  // Monta a descrição do serviço a partir dos itens
  const itens = (orcamento.itens || []) as { descricao: string; valor: number }[]
  const descricaoItens = itens
    .map(i => `• ${i.descricao} — R$ ${i.valor.toFixed(2)}`)
    .join('\n')
  const descricao = orcamento.observacoes
    ? `${descricaoItens}\n\nObservações:\n${orcamento.observacoes}`
    : descricaoItens

  const tipoServico = itens.length === 1
    ? itens[0].descricao
    : `Orçamento #${orcamento.numero} (${itens.length} itens)`

  const hoje = new Date().toISOString().split('T')[0]

  const { data: servico, error: servicoError } = await supabase
    .from('servicos')
    .insert({
      cliente_id: orcamento.cliente_id,
      veiculo_id: orcamento.veiculo_id,
      tipo_servico: tipoServico,
      descricao,
      data_inicio: hoje,
      status: 'em_andamento',
      pagamento_status: 'a_receber',
      valor: orcamento.valor_total,
    })
    .select()
    .single()

  if (servicoError || !servico) throw new Error('Erro ao criar serviço')

  const { error: updateError } = await supabase
    .from('orcamentos')
    .update({
      status: 'aprovado',
      data_aprovacao: new Date().toISOString(),
      servico_id: servico.id,
    })
    .eq('id', id)

  if (updateError) throw new Error('Erro ao atualizar orçamento')

  revalidatePath('/orcamentos')
  revalidatePath(`/orcamentos/${id}`)
  revalidatePath('/servicos')
  return servico.id
}

/** Marca como recusado */
export async function recusarOrcamento(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orcamentos')
    .update({ status: 'recusado', data_recusa: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error('Erro ao recusar orçamento')
  revalidatePath('/orcamentos')
  revalidatePath(`/orcamentos/${id}`)
}

/** Reabre um orçamento recusado/expirado (volta para rascunho) */
export async function reabrirOrcamento(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orcamentos')
    .update({ status: 'rascunho', data_recusa: null })
    .eq('id', id)
  if (error) throw new Error('Erro ao reabrir orçamento')
  revalidatePath('/orcamentos')
  revalidatePath(`/orcamentos/${id}`)
}

/** Exclui orçamento (itens via cascade) */
export async function excluirOrcamento(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('orcamentos').delete().eq('id', id)
  if (error) throw new Error('Erro ao excluir orçamento')
  revalidatePath('/orcamentos')
}
