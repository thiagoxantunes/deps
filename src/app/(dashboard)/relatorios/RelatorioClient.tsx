'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar, CalendarRange } from 'lucide-react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

interface Props {
  mes: number
  ano: number
  dia: number | null
  de: string | null
  ate: string | null
}

export default function RelatorioClient({ mes, ano, dia, de, ate }: Props) {
  const router = useRouter()
  const modoInicial = de && ate ? 'periodo' : 'mes'
  const [modo, setModo] = useState<'mes' | 'periodo'>(modoInicial)

  // ── Navegação modo mês ──
  const navegar = (novoMes: number, novoAno: number, novoDia: number | null = null) => {
    const p = new URLSearchParams()
    p.set('mes', String(novoMes))
    p.set('ano', String(novoAno))
    if (novoDia) p.set('dia', String(novoDia))
    router.push(`/relatorios?${p.toString()}`)
  }

  const anterior = () => mes === 1 ? navegar(12, ano - 1) : navegar(mes - 1, ano)
  const proximo  = () => mes === 12 ? navegar(1, ano + 1) : navegar(mes + 1, ano)

  const lastDay = new Date(ano, mes, 0).getDate()
  const DIAS = Array.from({ length: lastDay }, (_, i) => i + 1)

  // ── Navegação modo período ──
  const hoje = new Date().toISOString().split('T')[0]
  const [deVal, setDeVal]   = useState(de || hoje)
  const [ateVal, setAteVal] = useState(ate || hoje)

  const aplicarPeriodo = () => {
    if (!deVal || !ateVal) return
    router.push(`/relatorios?de=${deVal}&ate=${ateVal}`)
  }

  const trocarModo = (novoModo: 'mes' | 'periodo') => {
    setModo(novoModo)
    if (novoModo === 'mes') {
      navegar(mes, ano)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle modo */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit self-end">
        <button
          onClick={() => trocarModo('mes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            modo === 'mes'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Mês / Dia
        </button>
        <button
          onClick={() => trocarModo('periodo')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            modo === 'periodo'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Período
        </button>
      </div>

      {/* Filtros modo Mês */}
      {modo === 'mes' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={anterior}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

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
      )}

      {/* Filtros modo Período */}
      {modo === 'periodo' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">De</label>
            <input
              type="date"
              value={deVal}
              onChange={e => setDeVal(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Até</label>
            <input
              type="date"
              value={ateVal}
              min={deVal}
              onChange={e => setAteVal(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={aplicarPeriodo}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
