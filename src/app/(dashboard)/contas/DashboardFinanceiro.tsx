'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/cn'
import { TrendingUp, TrendingDown, CalendarDays, X, ArrowUpCircle, ArrowDownCircle, Scale } from 'lucide-react'

interface ContaInfo { id: string; nome: string }

interface ResumoConta {
  contaId: string
  contaNome: string
  entradas: number
  saidas: number
  liquido: number
  qtdEntradas: number
  qtdSaidas: number
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
  if (ano && mes && dia) return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
  if (ano && mes) return `${MESES_LABEL[Number(mes) - 1]} ${ano}`
  if (ano) return ano
  return 'Todo o período'
}

function buildDateRange(ano: string, mes: string, dia: string) {
  if (ano && mes && dia) {
    const d = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    return { start: d, end: d }
  }
  if (ano && mes) {
    const last = diasDoMes(Number(ano), Number(mes))
    return {
      start: `${ano}-${mes.padStart(2, '0')}-01`,
      end: `${ano}-${mes.padStart(2, '0')}-${String(last).padStart(2, '0')}`,
    }
  }
  if (ano) return { start: `${ano}-01-01`, end: `${ano}-12-31` }
  return null
}

export default function DashboardFinanceiro({ contas }: { contas: ContaInfo[] }) {
  const now = new Date()
  const [ano, setAno]   = useState(String(now.getFullYear()))
  const [mes, setMes]   = useState(String(now.getMonth() + 1))
  const [dia, setDia]   = useState('')
  const [resumo, setResumo] = useState<ResumoConta[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDados = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const range = buildDateRange(ano, mes, dia)

    // Busca entradas (servicos pagos)
    let qEntradas = supabase
      .from('servicos')
      .select('valor, conta_id')
      .eq('pagamento_status', 'pago')
      .not('conta_id', 'is', null)

    if (range) {
      qEntradas = qEntradas.gte('data_conclusao', range.start).lte('data_conclusao', range.end)
    }

    // Busca saídas do período
    let qSaidas = supabase
      .from('saidas')
      .select('valor, conta_id')
      .not('conta_id', 'is', null)

    if (range) {
      qSaidas = qSaidas.gte('data', range.start).lte('data', range.end)
    }

    const [{ data: entradas }, { data: saidas }] = await Promise.all([qEntradas, qSaidas])

    // Agrupa por conta
    const map: Record<string, { entradas: number; saidas: number; qtdEntradas: number; qtdSaidas: number }> = {}

    for (const e of (entradas || [])) {
      if (!e.conta_id) continue
      if (!map[e.conta_id]) map[e.conta_id] = { entradas: 0, saidas: 0, qtdEntradas: 0, qtdSaidas: 0 }
      map[e.conta_id].entradas += e.valor || 0
      map[e.conta_id].qtdEntradas++
    }

    for (const s of (saidas || [])) {
      if (!s.conta_id) continue
      if (!map[s.conta_id]) map[s.conta_id] = { entradas: 0, saidas: 0, qtdEntradas: 0, qtdSaidas: 0 }
      map[s.conta_id].saidas += s.valor || 0
      map[s.conta_id].qtdSaidas++
    }

    const resultado: ResumoConta[] = Object.entries(map).map(([contaId, v]) => ({
      contaId,
      contaNome: contas.find(c => c.id === contaId)?.nome || 'Conta desconhecida',
      entradas: v.entradas,
      saidas: v.saidas,
      liquido: v.entradas - v.saidas,
      qtdEntradas: v.qtdEntradas,
      qtdSaidas: v.qtdSaidas,
    })).sort((a, b) => b.liquido - a.liquido)

    setResumo(resultado)
    setLoading(false)
  }, [ano, mes, dia, contas])

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

  const totalEntradas = resumo.reduce((s, c) => s + c.entradas, 0)
  const totalSaidas   = resumo.reduce((s, c) => s + c.saidas, 0)
  const totalLiquido  = totalEntradas - totalSaidas

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20">
          <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Faturamento</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Entradas, saídas e lucro líquido por conta</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Período</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Ano</label>
            <select
              value={ano}
              onChange={e => { setAno(e.target.value); setMes(''); setDia('') }}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Todos</option>
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Mês</label>
            <select
              value={mes}
              onChange={e => { setMes(e.target.value); setDia('') }}
              disabled={!ano}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-40"
            >
              <option value="">Todos</option>
              {MESES_LABEL.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Dia</label>
            <select
              value={dia}
              onChange={e => setDia(e.target.value)}
              disabled={!mes}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-40"
            >
              <option value="">Todos</option>
              {diasOptions.map(d => <option key={d} value={d}>{String(d).padStart(2, '0')}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={hoje} className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-colors">
            Hoje
          </button>
          <button onClick={limpar} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium transition-colors">
            <X className="w-3 h-3" />Limpar
          </button>
        </div>
      </div>

      {/* Resultado */}
      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : resumo.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-600">
          <p className="text-sm">Nenhum movimento em {labelPeriodo(ano, mes, dia) || 'nenhum período'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Totais do período */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-1 mb-1">
                <ArrowUpCircle className="w-3.5 h-3.5 text-green-500" />
                <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Entradas</p>
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(totalEntradas)}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1 mb-1">
                <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
                <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Saídas</p>
              </div>
              <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(totalSaidas)}</p>
            </div>
            <div className={`p-3 rounded-xl border ${totalLiquido >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-1 mb-1">
                <Scale className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Líquido</p>
              </div>
              <p className={`text-base font-bold ${totalLiquido >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                {totalLiquido >= 0 ? '+' : ''}{formatCurrency(totalLiquido)}
              </p>
            </div>
          </div>

          {/* Por conta */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Por Conta</p>
            <div className="space-y-3">
              {resumo.map((c, i) => (
                <div key={c.contaId} className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                  {/* Nome + lucro */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${CONTA_COLORS[i % CONTA_COLORS.length]}`} />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.contaNome}</span>
                    </div>
                    <span className={`text-sm font-bold ${c.liquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {c.liquido >= 0 ? '+' : ''}{formatCurrency(c.liquido)}
                    </span>
                  </div>

                  {/* Entradas / Saídas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <ArrowUpCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 leading-none">Entradas</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(c.entradas)}</p>
                        <p className="text-[10px] text-gray-400">{c.qtdEntradas} pgto{c.qtdEntradas !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <ArrowDownCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 leading-none">Saídas</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(c.saidas)}</p>
                        <p className="text-[10px] text-gray-400">{c.qtdSaidas} saída{c.qtdSaidas !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Barra lucro */}
                  {(c.entradas > 0 || c.saidas > 0) && (
                    <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-400 rounded-l-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (c.entradas / Math.max(c.entradas, c.entradas + c.saidas)) * 100)}%` }}
                      />
                      {c.saidas > 0 && (
                        <div
                          className="h-full bg-red-400 rounded-r-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (c.saidas / Math.max(c.entradas, c.entradas + c.saidas)) * 100)}%` }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
