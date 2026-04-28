'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { marcarServicoConcluido, desmarcarServicoConcluido } from './actions'

interface Props {
  servicoId: string
  concluido: boolean
}

export default function MarcarConcluidoButton({ servicoId, concluido }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    try {
      if (concluido) {
        await desmarcarServicoConcluido(servicoId)
        toast.success('Conclusão desmarcada.')
      } else {
        await marcarServicoConcluido(servicoId)
        toast.success('Serviço marcado como concluído!')
      }
      router.refresh()
    } catch {
      toast.error('Erro ao atualizar status.')
    } finally {
      setLoading(false)
    }
  }

  if (concluido) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-sm font-medium transition-colors whitespace-nowrap"
      >
        <XCircle className="w-4 h-4" />
        {loading ? 'Salvando...' : 'Desmarcar Concluído'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap"
    >
      <CheckCircle2 className="w-4 h-4" />
      {loading ? 'Salvando...' : 'Marcar como Concluído'}
    </button>
  )
}
