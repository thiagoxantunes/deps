'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CatalogoPayload {
  nome: string
  descricao?: string | null
  valor_padrao: number
  ativo?: boolean
}

export async function criarItemCatalogo(payload: CatalogoPayload) {
  const supabase = await createClient()

  // Pega maior ordem para colocar o novo no final
  const { data: maxOrdem } = await supabase
    .from('catalogo_servicos')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()

  const novaOrdem = (maxOrdem?.ordem || 0) + 1

  const { error } = await supabase.from('catalogo_servicos').insert({
    nome: payload.nome.trim(),
    descricao: payload.descricao?.trim() || null,
    valor_padrao: payload.valor_padrao,
    ativo: payload.ativo ?? true,
    ordem: novaOrdem,
  })

  if (error) {
    if (error.code === '23505') throw new Error('Já existe um item com esse nome')
    throw new Error('Erro ao criar item')
  }

  revalidatePath('/catalogo')
  revalidatePath('/orcamentos/novo')
}

export async function atualizarItemCatalogo(id: string, payload: CatalogoPayload) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('catalogo_servicos')
    .update({
      nome: payload.nome.trim(),
      descricao: payload.descricao?.trim() || null,
      valor_padrao: payload.valor_padrao,
      ativo: payload.ativo ?? true,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') throw new Error('Já existe um item com esse nome')
    throw new Error('Erro ao atualizar item')
  }

  revalidatePath('/catalogo')
  revalidatePath('/orcamentos/novo')
}

export async function alternarAtivoCatalogo(id: string, ativo: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('catalogo_servicos').update({ ativo }).eq('id', id)
  if (error) throw new Error('Erro ao alterar status')
  revalidatePath('/catalogo')
  revalidatePath('/orcamentos/novo')
}

export async function excluirItemCatalogo(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('catalogo_servicos').delete().eq('id', id)
  if (error) throw new Error('Erro ao excluir item')
  revalidatePath('/catalogo')
  revalidatePath('/orcamentos/novo')
}
