'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/cn'
import { ArrowRightLeft, ArrowDownCircle, Pencil, Trash2, History, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import MovimentacaoModal, { type MovimentacaoItem } from './MovimentacaoModal'

interface ContaInfo { id: string; nome: string; descricao: string | null }

interface MovimentacaoRow extends MovimentacaoItem {
  conta_origem?: ContaInfo | null
  conta_destino?: ContaInfo | null
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function MovimentacoesHistorico() {
  const router = useRouter()
  const [itens, setItens] = useState<MovimentacaoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<MovimentacaoItem | null>(null)
  const [deletando, setDeletando] = useState<string | null>(null)

  const fetchHistorico = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('movimentacoes')
      .select(`
        id, data, descricao, valor, conta_origem_id, conta_destino_id,
        conta_origem:conta_origem_id(id, nome, descricao),
        conta_destino:conta_destino_id(id, nome, descricao)
      `)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    setItens((data || []) as unknown as MovimentacaoRow[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchHistorico() }, [fetchHistorico])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta movimentação?')) return
    setDeletando(id)
    const supabase = createClient()
    const { error } = await supabase.from('movimentacoes').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir.')
      setDeletando(null)
      return
    }
    toast.success('Movimentação excluída.')
    setDeletando(null)
    fetchHistorico()
    router.refresh()
  }

  const contaLabel = (c: ContaInfo | null | undefined) => {
    if (!c) return '—'
    return c.descricao ? `${c.nome} — ${c.descricao}` : c.nome
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <History className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Histórico de Movimentações</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Últimas 50 transferências e depósitos</p>
            </div>
          </div>
          <button
            onClick={fetchHistorico}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : itens.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600">
            <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma movimentação registrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {itens.map(item => {
              const isTransferencia = !!item.conta_origem_id
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  {/* Ícone */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isTransferencia
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-green-50 dark:bg-green-900/20'
                  }`}>
                    {isTransferencia
                      ? <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      : <ArrowDownCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.descricao}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        isTransferencia
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {isTransferencia ? 'Transferência' : 'Depósito'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {isTransferencia
                        ? <>{contaLabel(item.conta_origem)} → {contaLabel(item.conta_destino)}</>
                        : <>Destino: {contaLabel(item.conta_destino)}</>
                      }
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(item.data)}</p>
                  </div>

                  {/* Valor */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${
                      isTransferencia ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(item.valor)}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditando(item)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletando === item.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-40"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de edição */}
      <MovimentacaoModal
        open={!!editando}
        onClose={() => setEditando(null)}
        movimentacao={editando}
        onSaved={fetchHistorico}
      />
    </>
  )
}
