'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  mes: number  // 1-12
  ano: number
}

export default function DashboardMesNavegacao({ mes, ano }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navegar = (deltaMes: number) => {
    let novoMes = mes + deltaMes
    let novoAno = ano

    if (novoMes > 12) { novoMes = 1; novoAno++ }
    if (novoMes < 1)  { novoMes = 12; novoAno-- }

    const params = new URLSearchParams(searchParams.toString())
    params.set('mes', String(novoMes))
    params.set('ano', String(novoAno))
    router.push(`/dashboard?${params.toString()}`)
  }

  const agora = new Date()
  const isMesAtual = mes === agora.getMonth() + 1 && ano === agora.getFullYear()
  const data = new Date(ano, mes - 1, 1)
  const label = format(data, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navegar(-1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        title="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[140px] text-center">
        {label}
      </span>

      <button
        onClick={() => navegar(1)}
        disabled={isMesAtual}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isMesAtual && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('mes')
            params.delete('ano')
            router.push(`/dashboard?${params.toString()}`)
          }}
          className="ml-1 text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium"
        >
          Hoje
        </button>
      )}
    </div>
  )
}
