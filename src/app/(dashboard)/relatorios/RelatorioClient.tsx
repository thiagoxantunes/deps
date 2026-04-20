'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function RelatorioClient({ mes, ano }: { mes: number; ano: number }) {
  const router = useRouter()

  const navegar = (novoMes: number, novoAno: number) => {
    router.push(`/relatorios?mes=${novoMes}&ano=${novoAno}`)
  }

  const anterior = () => {
    if (mes === 1) navegar(12, ano - 1)
    else navegar(mes - 1, ano)
  }

  const proximo = () => {
    if (mes === 12) navegar(1, ano + 1)
    else navegar(mes + 1, ano)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={anterior}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex gap-2">
        <select
          value={mes}
          onChange={e => navegar(parseInt(e.target.value), ano)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MESES.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={ano}
          onChange={e => navegar(mes, parseInt(e.target.value))}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ANOS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <button
        onClick={proximo}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
