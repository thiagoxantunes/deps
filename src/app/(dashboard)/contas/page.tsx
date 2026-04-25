export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import { Wallet, TrendingUp, Scale } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/cn'
import ContasManager from './ContasManager'
import DashboardFinanceiro from './DashboardFinanceiro'
import SaldoRealContas from './SaldoRealContas'
import MovimentacaoButton from './MovimentacaoButton'
import MovimentacoesHistorico from './MovimentacoesHistorico'

export default async function ContasPage() {
  const supabase = await createClient()

  const [
    { data: contas },
    { data: totalGeral },
    { data: totalMes },
    { data: entradasPorConta },
    { data: saidasPorConta },
    { data: movimentacoes },
  ] = await Promise.all([
    supabase.from('contas_recebimento').select('*').order('created_at'),
    supabase.from('servicos').select('valor').eq('pagamento_status', 'pago'),
    supabase.from('servicos').select('valor')
      .eq('pagamento_status', 'pago')
      .gte('data_conclusao', (() => {
        const d = new Date(); d.setDate(1)
        return d.toISOString().split('T')[0]
      })()),
    supabase.from('servicos').select('valor, conta_id').eq('pagamento_status', 'pago').not('conta_id', 'is', null),
    supabase.from('saidas').select('valor, conta_id').not('conta_id', 'is', null),
    supabase.from('movimentacoes').select('valor, conta_origem_id, conta_destino_id'),
  ])

  const faturamentoTotal = (totalGeral || []).reduce((s, r) => s + (r.valor || 0), 0)
  const faturamentoMes   = (totalMes   || []).reduce((s, r) => s + (r.valor || 0), 0)

  const contasList = (contas || []) as { id: string; nome: string; descricao: string | null; ativo: boolean }[]

  // Calcula saldo real por conta
  const entradasMap: Record<string, number> = {}
  for (const s of (entradasPorConta || [])) {
    if (s.conta_id) entradasMap[s.conta_id] = (entradasMap[s.conta_id] || 0) + (s.valor || 0)
  }
  const saidasMap: Record<string, number> = {}
  for (const s of (saidasPorConta || [])) {
    if (s.conta_id) saidasMap[s.conta_id] = (saidasMap[s.conta_id] || 0) + (s.valor || 0)
  }

  // Movimentações: transferências afetam saldo mas NÃO faturamento
  // Depósitos externos (conta_origem_id = null) → saldo apenas (faturamento é tratado no DashboardFinanceiro)
  const transferenciasSaidaMap: Record<string, number> = {}
  const transferenciasEntradaMap: Record<string, number> = {}
  for (const m of (movimentacoes || [])) {
    // Saiu de origem
    if (m.conta_origem_id) {
      transferenciasSaidaMap[m.conta_origem_id] = (transferenciasSaidaMap[m.conta_origem_id] || 0) + (m.valor || 0)
    }
    // Entrou no destino
    transferenciasEntradaMap[m.conta_destino_id] = (transferenciasEntradaMap[m.conta_destino_id] || 0) + (m.valor || 0)
  }

  const saldos = contasList.map(c => ({
    id: c.id,
    nome: c.nome,
    entradas: (entradasMap[c.id] || 0) + (transferenciasEntradaMap[c.id] || 0),
    saidas:   (saidasMap[c.id]   || 0) + (transferenciasSaidaMap[c.id]  || 0),
    saldo:    (entradasMap[c.id] || 0) + (transferenciasEntradaMap[c.id] || 0)
            - (saidasMap[c.id]   || 0) - (transferenciasSaidaMap[c.id]  || 0),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-orange-500" />
            Contas de Recebimento
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie suas contas e acompanhe o faturamento por forma de pagamento
          </p>
        </div>
        <MovimentacaoButton />
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(faturamentoMes)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recebido este mês</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(faturamentoTotal)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total histórico recebido</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Faturamento por período — linha inteira */}
      <Card>
        <DashboardFinanceiro contas={contasList.map(c => ({ id: c.id, nome: c.nome }))} />
      </Card>

      {/* Histórico de movimentações */}
      <Card>
        <MovimentacoesHistorico />
      </Card>

      {/* Contas cadastradas + Saldo Real */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contas Cadastradas</CardTitle>
            <span className="text-xs text-gray-500 dark:text-gray-400">{contasList.filter(c => c.ativo).length} ativas</span>
          </CardHeader>
          <ContasManager contas={contasList} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-500" />
              Saldo Real
            </CardTitle>
            <span className="text-xs text-gray-500 dark:text-gray-400">Entradas − Saídas (histórico)</span>
          </CardHeader>
          <SaldoRealContas saldos={saldos} />
        </Card>
      </div>
    </div>
  )
}
