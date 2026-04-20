'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/cn'
import { TrendingUp, CalendarDays, X } from 'lucide-react'

interface ContaInfo { id: string; nome: string }

interface Lancamento {
  valor: number | null
  conta_id: string | null
}

interface ResumoConta {
  contaId: string
  contaNome: string
  total: number
  qtd: number
}

const CONTA_COLORS = [
  'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500',
]

const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ANO_ATUAL = new Date().getFullYear()
const ANOS = Array.from({ length: 6 }, (_, i) => ANO_ATUAL - 2 + i)

function diasDoMes(ano: number, mes: number) {
  return new Date(ano, mes, 0).getDate()
}

function labelPeriodo(ano: string, mes: string, dia: string) {
  if (ano && mes && dia) {
    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
  }
  if (ano && mes) return `${MESES_LABEL[Number(mes) - 1]} ${ano}`
  if (ano) return ano
  return 'Todo o período'
}

export default function DashboardFinanceiro({ contas }: { contas: ContaInfo[] }) {
  const now = new Date()
  const [ano, setAno]   = useState(String(now.getFullYear()))
  const [mes, setMes]   = useState(String(now.getMonth() + 1))
  const [dia, setDia]   = useState('')
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDados = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('servicos')
      .select('valor, conta_id')
      .eq('pagamento_status', 'pago')

    if (ano && mes && dia) {
      const d = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
      q = q.eq('data_conclusao', d)
    } else if (ano && mes) {
      const start = `${ano}-${mes.padStart(2, '0')}-01`
      const last  = diasDoMes(Number(ano), Number(mes))
      const end   = `${ano}-${mes.padStart(2, '0')}-${String(last).padStart(2, '0')}`
      q = q.gte('data_conclusao', start).lte('data_conclusao', end)
    } else if (ano) {
      q = q.gte('data_conclusao', `${ano}-01-01`).lte('data_conclusao', `${ano}-12-31`)
    }

    const { data } = await q
    setLancamentos(data || [])
    setLoading(false)
  }, [ano, mes, dia])

  useEffect(() => { fetchDados() }, [fetchDados])

  const limpar = () => {
    setAno(String(ANO_ATUAL))
    setMes(String(now.getMonth() + 1))
    setDia('')
  }

  const hoje = () => {
    setAno(String(now.getFullYear()))
    setMes(String(now.getMonth() + 1))
    setDia(String(now.getDate()))
  }

  const numDias = ano && mes ? diasDoMes(Number(ano), Number(mes)) : 31
  const diasOptions = Array.from({ length: numDias }, (_, i) => i + 1)

  const total = lancamentos.reduce((s, l) => s + (l.valor || 0), 0)

  const porConta: ResumoConta[] = Object.entries(
    lancamentos.reduce<Record<string, { total: number; qtd: number }>>((acc, l) => {
      if (!l.conta_id) return acc
      if (!acc[l.conta_id]) acc[l.conta_id] = { total: 0, qtd: 0 }
      acc[l.conta_id].total += l.valor || 0
      acc[l.conta_id].qtd++
      return acc
    }, {})
  ).map(([contaId, { total, qtd }]) => ({
    contaId,
    contaNome: contas.find(c => c.id === contaId)?.nome || 'Conta desconhecida',
    total,
    qtd,
  })).sort((a, b) => b.total - a.total)

  const maxConta = porConta[0]?.total || 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20">
          <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Faturamento</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Serviços pagos no período</p>
        </div>
      </div>

      {/* Filtros Ano / Mês / Dia */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Período</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Ano */}
          <div>
            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Ano</label>
            <select
              value={ano}
              onChange={e => { setAno(e.target.value); setMes(''); setDia('') }}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Todos</option>
              {ANOS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Mês */}
          <div>
            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Mês</label>
            <select
              value={mes}
              onChange={e => { setMes(e.target.value); setDia('') }}
              disabled={!ano}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Todos</option>
              {MESES_LABEL.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Dia */}
          <div>
            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Dia</label>
            <select
              value={dia}
              onChange={e => setDia(e.target.value)}
              disabled={!mes}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Todos</option>
              {diasOptions.map(d => (
                <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botões rápidos */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={hoje}
            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={limpar}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        </div>
      </div>

      {/* Resultado */}
      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-600">
          <p className="text-sm">Nenhum pagamento em {labelPeriodo(ano, mes, dia) || 'nenhum período'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wider">Total Recebido</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {lancamentos.length} serviço{lancamentos.length !== 1 ? 's' : ''} — {labelPeriodo(ano, mes, dia)}
            </p>
          </div>

          {/* Por conta */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Por Conta de Recebimento</p>
            {porConta.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-dashed border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Nenhum serviço vinculado a uma conta neste período.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {porConta.map((c, i) => (
                  <div key={c.contaId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${CONTA_COLORS[i % CONTA_COLORS.length]}`} />
                        <span className="font-medium text-gray-800 dark:text-gray-200">{c.contaNome}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(c.total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${CONTA_COLORS[i % CONTA_COLORS.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${(c.total / maxConta) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {c.qtd} pagamento{c.qtd !== 1 ? 's' : ''} · {((c.total / total) * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
