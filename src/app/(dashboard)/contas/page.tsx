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
  ] = await Promise.all([
    supabase.from('contas_recebimento').select('*').order('created_at'),
    supabase.from('servicos').select('valor').eq('pagamento_status', 'pago'),
    supabase.from('servicos').select('valor')
      .eq('pagamento_status', 'pago')
      .gte('data_conclusao', (() => {
        const d = new Date(); d.setDate(1)
        return d.toISOString().split('T')[0]
      })()),
  ])

  const faturamentoTotal = (totalGeral || []).reduce((s, r) => s + (r.valor || 0), 0)
  const faturamentoMes   = (totalMes   || []).reduce((s, r) => s + (r.valor || 0), 0)

  const contasList = (contas || []) as { id: string; nome: string; descricao: string | null; ativo: boolean }[]

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
          <SaldoRealContas />
        </Card>
      </div>
    </div>
  )
}
