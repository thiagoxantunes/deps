'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/cn'
import { ArrowDownCircle, ArrowUpCircle, Scale, CalendarDays, X } from 'lucide-react'

interface SaldoConta {
  id: string
  nome: string
  entradas: number
  saidas: number
  saldo: number
}

const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const ANO_ATUAL = new Date().getFullYear()
const ANOS = Array.from({ length: 6 }, (_, i) => ANO_ATUAL - 2 + i)

function diasDoMes(ano: number, mes: number) {
  return new Date(ano, mes, 0).getDate()
}

function buildRange(ano: string, mes: string, dia: string) {
  if (ano && mes && dia) {
    const d = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    return { start: d, end: d }
  }
  if (ano && mes) {
    const last = diasDoMes(Number(ano), Number(mes))
    return {
      start: `${ano}-${mes.padStart(2, '0')}-01`,
      end:   `${ano}-${mes.padStart(2, '0')}-${String(last).padStart(2, '0')}`,
    }
  }
  if (ano) return { start: `${ano}-01-01`, end: `${ano}-12-31` }
  return null // sem filtro = histórico completo
}

export default function SaldoRealContas() {
  const now = new Date()
  const [ano, setAno] = useState('')
  const [mes, setMes] = useState('')
  const [dia, setDia] = useState('')
  const [saldos, setSaldos] = useState<SaldoConta[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSaldos = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const range = buildRange(ano, mes, dia)

    // Busca todas as contas (para mostrar mesmo as zeradas)
    const { data: contas } = await supabase
      .from('contas_recebimento')
      .select('id, nome')
      .order('nome')

    // Entradas: serviços pagos
    let qEntradas = supabase.from('servicos').select('valor, conta_id').eq('pagamento_status', 'pago').not('conta_id', 'is', null)
    if (range) qEntradas = qEntradas.gte('data_conclusao', range.start).lte('data_conclusao', range.end)

    // Saídas
    let qSaidas = supabase.from('saidas').select('valor, conta_id').not('conta_id', 'is', null)
    if (range) qSaidas = qSaidas.gte('data', range.start).lte('data', range.end)

    // Movimentações: transferências e depósitos externos
    let qMov = supabase.from('movimentacoes').select('valor, conta_origem_id, conta_destino_id')
    if (range) qMov = qMov.gte('data', range.start).lte('data', range.end)

    const [
      { data: entradas },
      { data: saidas },
      { data: movs },
    ] = await Promise.all([qEntradas, qSaidas, qMov])

    // Acumula por conta
    const entradasMap: Record<string, number> = {}
    const saidasMap: Record<string, number> = {}

    for (const e of (entradas || [])) {
      if (e.conta_id) entradasMap[e.conta_id] = (entradasMap[e.conta_id] || 0) + (e.valor || 0)
    }
    for (const s of (saidas || [])) {
      if (s.conta_id) saidasMap[s.conta_id] = (saidasMap[s.conta_id] || 0) + (s.valor || 0)
    }
    for (const m of (movs || [])) {
      // Depósito externo (sem origem) → entra como entrada no destino
      // Transferência (com origem) → sai da origem, entra no destino
      entradasMap[m.conta_destino_id] = (entradasMap[m.conta_destino_id] || 0) + (m.valor || 0)
      if (m.conta_origem_id) {
        saidasMap[m.conta_origem_id] = (saidasMap[m.conta_origem_id] || 0) + (m.valor || 0)
      }
    }

    // Monta saldos para TODAS as contas (incluindo as zeradas)
    const resultado: SaldoConta[] = (contas || []).map(c => ({
      id:       c.id,
      nome:     c.nome,
      entradas: entradasMap[c.id] || 0,
      saidas:   saidasMap[c.id]   || 0,
      saldo:    (entradasMap[c.id] || 0) - (saidasMap[c.id] || 0),
    }))

    setSaldos(resultado)
    setLoading(false)
  }, [ano, mes, dia])

  useEffect(() => { fetchSaldos() }, [fetchSaldos])

  const limpar = () => { setAno(''); setMes(''); setDia('') }
  const hoje   = () => {
    setAno(String(now.getFullYear()))
    setMes(String(now.getMonth() + 1))
    setDia(String(now.getDate()))
  }

  const numDias = ano && mes ? diasDoMes(Number(ano), Number(mes)) : 31
  const diasOptions = Array.from({ length: numDias }, (_, i) => i + 1)

  const totalEntradas = saldos.reduce((s, c) => s + c.entradas, 0)
  const totalSaidas   = saldos.reduce((s, c) => s + c.saidas, 0)
  const totalSaldo    = totalEntradas - totalSaidas

  const periodoLabel = !ano ? 'Histórico completo' :
    !mes ? String(ano) :
    !dia ? `${MESES_LABEL[Number(mes) - 1]} ${ano}` :
    `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Saldo Real</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{periodoLabel}</p>
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
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40"
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
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40"
            >
              <option value="">Todos</option>
              {diasOptions.map(d => <option key={d} value={d}>{String(d).padStart(2, '0')}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={hoje} className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors">
            Hoje
          </button>
          <button onClick={limpar} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium transition-colors">
            <X className="w-3 h-3" /> Histórico completo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total geral */}
          <div className={`p-4 rounded-xl border ${
            totalSaldo >= 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${totalSaldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Saldo Total
            </p>
            <p className={`text-3xl font-bold mt-1 ${totalSaldo >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {totalSaldo >= 0 ? '+' : ''}{formatCurrency(totalSaldo)}
            </p>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <ArrowUpCircle className="w-3.5 h-3.5 text-green-500" />
                {formatCurrency(totalEntradas)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
                {formatCurrency(totalSaidas)}
              </span>
            </div>
          </div>

          {/* Por conta — todas, incluindo zeradas */}
          <div className="space-y-2">
            {saldos.map(c => (
              <div key={c.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.nome}</p>
                  <span className={`text-sm font-bold ${c.saldo > 0 ? 'text-green-600 dark:text-green-400' : c.saldo < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {c.saldo > 0 ? '+' : ''}{formatCurrency(c.saldo)}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none">Entradas</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(c.entradas)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none">Saídas</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(c.saidas)}</p>
                    </div>
                  </div>
                </div>
                {(c.entradas > 0 || c.saidas > 0) && (
                  <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-400 rounded-l-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (c.entradas / (c.entradas + c.saidas)) * 100)}%` }}
                    />
                    {c.saidas > 0 && (
                      <div
                        className="h-full bg-red-400 rounded-r-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (c.saidas / (c.entradas + c.saidas)) * 100)}%` }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
