'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { marcarServicoPago, desmarcarServicoPago } from './actions'

interface Props {
  servicoId: string
  pago?: boolean
}

export default function MarcarPagoButton({ servicoId, pago = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [contaId, setContaId] = useState('')
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('contas_recebimento').select('id, nome').eq('ativo', true).order('nome')
      .then(({ data }) => { if (data) setContas(data) })
  }, [])

  // Botão de desmarcar quando já está pago
  if (pago) {
    const handleDesmarcar = async () => {
      setLoading(true)
      try {
        await desmarcarServicoPago(servicoId)
        toast.success('Pagamento desmarcado.')
        router.refresh()
      } catch {
        toast.error('Erro ao desmarcar pagamento.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <button
        onClick={handleDesmarcar}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-sm font-medium transition-colors whitespace-nowrap"
      >
        <XCircle className="w-4 h-4" />
        {loading ? 'Salvando...' : 'Desmarcar Pago'}
      </button>
    )
  }

  const handleConfirmar = async () => {
    if (!contaId) {
      toast.error('Selecione a forma de recebimento.')
      return
    }
    setLoading(true)
    try {
      await marcarServicoPago(servicoId, contaId)
      toast.success('Pagamento registrado!')
      router.refresh()
      setAberto(false)
    } catch {
      toast.error('Erro ao registrar pagamento.')
    } finally {
      setLoading(false)
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
      >
        <CheckCircle className="w-4 h-4" />
        Marcar como Pago
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={contaId}
        onChange={e => setContaId(e.target.value)}
        autoFocus
        className="px-3 py-2 text-sm border-2 border-green-400 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        <option value="">Selecione a conta recebida *</option>
        {contas.map(c => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>
      <button
        onClick={handleConfirmar}
        disabled={loading || !contaId}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? 'Salvando...' : 'Confirmar'}
      </button>
      <button
        onClick={() => { setAberto(false); setContaId('') }}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
