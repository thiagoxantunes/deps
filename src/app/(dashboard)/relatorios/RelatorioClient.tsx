'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

interface Props {
  mes: number
  ano: number
  dia: number | null
}

export default function RelatorioClient({ mes, ano, dia }: Props) {
  const router = useRouter()

  const navegar = (novoMes: number, novoAno: number, novoDia: number | null = null) => {
    const params = new URLSearchParams()
    params.set('mes', String(novoMes))
    params.set('ano', String(novoAno))
    if (novoDia) params.set('dia', String(novoDia))
    router.push(`/relatorios?${params.toString()}`)
  }

  const anterior = () => {
    if (mes === 1) navegar(12, ano - 1)
    else navegar(mes - 1, ano)
  }

  const proximo = () => {
    if (mes === 12) navegar(1, ano + 1)
    else navegar(mes + 1, ano)
  }

  const lastDay = new Date(ano, mes, 0).getDate()
  const DIAS = Array.from({ length: lastDay }, (_, i) => i + 1)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={anterior}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Mês */}
      <select
        value={mes}
        onChange={e => navegar(parseInt(e.target.value), ano)}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {MESES.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>

      {/* Ano */}
      <select
        value={ano}
        onChange={e => navegar(mes, parseInt(e.target.value))}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {ANOS.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {/* Dia */}
      <select
        value={dia ?? ''}
        onChange={e => {
          const val = e.target.value
          navegar(mes, ano, val ? parseInt(val) : null)
        }}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todo o mês</option>
        {DIAS.map(d => (
          <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
        ))}
      </select>

      {dia && (
        <button
          onClick={() => navegar(mes, ano)}
          className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Limpar dia
        </button>
      )}

      <button
        onClick={proximo}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
