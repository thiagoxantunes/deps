'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { marcarServicoConcluido } from './actions'

export default function MarcarConcluidoButton({ servicoId }: { servicoId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleConcluir = async () => {
    setLoading(true)
    try {
      await marcarServicoConcluido(servicoId)
      toast.success('Serviço marcado como concluído!')
      router.refresh()
    } catch {
      toast.error('Erro ao atualizar status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleConcluir}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap"
    >
      <CheckCircle2 className="w-4 h-4" />
      {loading ? 'Salvando...' : 'Marcar como Concluído'}
    </button>
  )
}
