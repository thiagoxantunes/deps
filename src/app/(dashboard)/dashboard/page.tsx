export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users, FileText, CheckCircle, TrendingUp, TrendingDown, Clock, AlertCircle, DollarSign, Hourglass } from 'lucide-react'

import DashboardNotificacoes from './DashboardNotificacoes'
import { differenceInDays } from 'date-fns'
import { formatCurrency } from '@/utils/cn'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DashboardCharts from './DashboardCharts'
import DashboardMesNavegacao from './DashboardMesNavegacao'

async function getStats(mes: number, ano: number) {
  const supabase = await createClient()

  const firstOfMonth = `${ano}-${String(mes).padStart(2, '0')}-01`
  const lastDay = new Date(ano, mes, 0).getDate()
  const lastOfMonth = `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [
    { count: totalClientes },
    { count: emAndamento },
    { count: concluidosMes },
    { data: receitaData },
    { data: servicosRecentes },
    { data: clientesRecentes },
    { data: pendentesPagamento },
    { data: saidasMes },
    { data: depositosMes },
    { data: servicosPendentes },
    { data: recorrentesAtivos },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('servicos').select('*', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    supabase.from('servicos').select('*', { count: 'exact', head: true })
      .eq('status', 'concluido')
      .gte('data_conclusao', firstOfMonth)
      .lte('data_conclusao', lastOfMonth),
    // Receita = serviços pagos no mês
    supabase.from('servicos').select('valor')
      .eq('pagamento_status', 'pago')
      .gte('data_conclusao', firstOfMonth)
      .lte('data_conclusao', lastOfMonth),
    supabase.from('servicos').select('*, cliente:clientes(nome)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('clientes').select('id, nome, telefone, created_at')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('servicos')
      .select('id, tipo_servico, valor, data_conclusao, cliente:clientes(id, nome, telefone), veiculo:veiculos(placa)')
      .eq('pagamento_status', 'a_receber')
      .order('data_conclusao', { ascending: true })
      .limit(15),
    // Saídas do mês
    supabase.from('saidas').select('valor')
      .gte('data', firstOfMonth)
      .lte('data', lastOfMonth),
    // Depósitos externos do mês (movimentacoes sem conta de origem)
    supabase.from('movimentacoes').select('valor')
      .is('conta_origem_id', null)
      .gte('data', firstOfMonth)
      .lte('data', lastOfMonth),
    // Serviços pendentes (status = pendente)
    supabase.from('servicos')
      .select('id, tipo_servico, valor, data_inicio, cliente:clientes(id, nome), veiculo:veiculos(placa)')
      .eq('status', 'pendente')
      .order('data_inicio', { ascending: true })
      .limit(15),
    // Recorrentes ativos para checar alertas
    supabase.from('servicos_recorrentes')
      .select('id, tipo_servico, valor, proximo_vencimento, antecedencia_dias, cliente:clientes(id, nome, telefone), veiculo:veiculos(placa)')
      .eq('ativo', true)
      .order('proximo_vencimento', { ascending: true })
      .limit(30),
  ])

  const receitaServicos = (receitaData || []).reduce((sum, s) => sum + (s.valor || 0), 0)
  const receitaDepositos = (depositosMes || []).reduce((sum, s) => sum + (s.valor || 0), 0)
  const receitaMensal = receitaServicos + receitaDepositos
  const totalAReceber = (pendentesPagamento || []).reduce((sum, s) => sum + (s.valor || 0), 0)
  const saidasMensal = (saidasMes || []).reduce((sum, s) => sum + (s.valor || 0), 0)
  const saldoMensal = receitaMensal - saidasMensal

  // Filtra recorrentes vencidos ou dentro do prazo de antecedência
  const hoje = new Date()
  const recorrentesAlerta = (recorrentesAtivos || [])
    .map(s => ({
      ...s,
      dias: differenceInDays(new Date(s.proximo_vencimento + 'T00:00:00'), hoje),
    }))
    .filter(s => s.dias <= s.antecedencia_dias)

  return {
    totalClientes: totalClientes || 0,
    emAndamento: emAndamento || 0,
    concluidosMes: concluidosMes || 0,
    receitaMensal,
    saidasMensal,
    saldoMensal,
    totalAReceber,
    servicosRecentes: servicosRecentes || [],
    clientesRecentes: clientesRecentes || [],
    pendentesPagamento: pendentesPagamento || [],
    servicosPendentes: servicosPendentes || [],
    recorrentesAlerta,
  }
}

async function getChartData() {
  const supabase = await createClient()
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: format(d, 'MMM', { locale: ptBR }),
    }
  }).reverse()

  const chartData = await Promise.all(
    last6Months.map(async ({ year, month, label }) => {
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const end = new Date(year, month, 0)
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`

      const { data } = await supabase.from('servicos').select('valor, status')
        .gte('data_conclusao', start).lte('data_conclusao', endStr)

      const receita = (data || []).filter(s => s.status === 'concluido').reduce((s, v) => s + (v.valor || 0), 0)
      const servicos = (data || []).length

      return { mes: label, receita, servicos }
    })
  )

  return chartData
}

const STATUS_MAP = {
  em_andamento: { label: 'Em Andamento', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
  concluido: { label: 'Concluído', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
  pendente: { label: 'Pendente', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string }>
}) {
  const params = await searchParams
  const agora = new Date()
  const mes = params.mes ? parseInt(params.mes) : agora.getMonth() + 1
  const ano = params.ano ? parseInt(params.ano) : agora.getFullYear()

  const mesSanitizado = Math.min(12, Math.max(1, isNaN(mes) ? agora.getMonth() + 1 : mes))
  const anoSanitizado = isNaN(ano) ? agora.getFullYear() : ano

  const [stats, chartData] = await Promise.all([
    getStats(mesSanitizado, anoSanitizado),
    getChartData(),
  ])

  const statCards = [
    {
      title: 'Clientes',
      value: stats.totalClientes.toString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      href: '/clientes',
    },
    {
      title: 'Em Andamento',
      value: stats.emAndamento.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      href: '/servicos?status=em_andamento',
    },
    {
      title: 'Concluídos no Mês',
      value: stats.concluidosMes.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      href: '/servicos?status=concluido',
    },
    {
      title: 'A Receber',
      value: formatCurrency(stats.totalAReceber),
      icon: DollarSign,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      href: '/servicos',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Visão geral do seu negócio</p>
        </div>
        <DashboardMesNavegacao mes={mesSanitizado} ano={anoSanitizado} />
      </div>

      {/* Financeiro do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/contas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Faturamento do Mês</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.receitaMensal)}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <p className="text-xs text-green-600 dark:text-green-400">Serviços pagos</p>
            </div>
          </Card>
        </Link>
        <Link href="/saidas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saídas do Mês</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.saidasMensal)}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400">Despesas registradas</p>
            </div>
          </Card>
        </Link>
        <Card className={`border-l-4 ${stats.saldoMensal >= 0 ? 'border-l-orange-500' : 'border-l-red-600'}`}>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saldo Líquido</p>
          <p className={`text-2xl font-bold mt-1 ${stats.saldoMensal >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(stats.saldoMensal)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <DollarSign className={`w-3.5 h-3.5 ${stats.saldoMensal >= 0 ? 'text-orange-500' : 'text-red-500'}`} />
            <p className={`text-xs ${stats.saldoMensal >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.saldoMensal >= 0 ? 'Positivo este mês' : 'Negativo este mês'}
            </p>
          </div>
        </Card>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts data={chartData} />

      {/* Notificações: Cobranças + Recorrentes */}
      <DashboardNotificacoes
        pagamentos={stats.pendentesPagamento as unknown as import('./DashboardNotificacoes').PagamentoPendente[]}
        recorrentes={stats.recorrentesAlerta as unknown as import('./DashboardNotificacoes').RecorrenteAlerta[]}
      />

      {/* Serviços Pendentes */}
      {stats.servicosPendentes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Hourglass className="w-4 h-4 text-yellow-500" />
              <CardTitle>Serviços Pendentes</CardTitle>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                {stats.servicosPendentes.length}
              </span>
            </div>
            <Link href="/servicos?status=pendente" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {stats.servicosPendentes.map((s: Record<string, unknown>) => {
              const cliente = s.cliente as { id: string; nome: string } | null
              const veiculo = s.veiculo as { placa: string } | null
              const dataInicio = s.data_inicio
                ? new Date((s.data_inicio as string) + 'T12:00:00').toLocaleDateString('pt-BR')
                : null
              return (
                <Link key={s.id as string} href={`/servicos/${s.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                        <Hourglass className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.tipo_servico as string}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {cliente?.nome || '—'}
                          {veiculo ? ` • ${veiculo.placa}` : ''}
                          {dataInicio ? ` • desde ${dataInicio}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0 text-right">
                      {s.valor ? (
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {formatCurrency(s.valor as number)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sem valor</span>
                      )}
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium mt-0.5">Pendente</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      {/* Bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serviços recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Serviços</CardTitle>
            <Link href="/servicos" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {stats.servicosRecentes.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum serviço cadastrado</p>
              </div>
            ) : (
              stats.servicosRecentes.map((s: Record<string, unknown>) => {
                const statusInfo = STATUS_MAP[s.status as keyof typeof STATUS_MAP]
                const cliente = s.cliente as { nome: string } | null
                return (
                  <Link key={s.id as string} href={`/servicos/${s.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.tipo_servico as string}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cliente?.nome || '—'}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        {s.valor ? (
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {formatCurrency(s.valor as number)}
                          </span>
                        ) : null}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusInfo?.color}`}>
                          {statusInfo?.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </Card>

        {/* Clientes recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes Recentes</CardTitle>
            <Link href="/clientes" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {stats.clientesRecentes.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum cliente cadastrado</p>
              </div>
            ) : (
              stats.clientesRecentes.map((c: Record<string, unknown>) => (
                <Link key={c.id as string} href={`/clientes/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {(c.nome as string)[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.nome as string}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{c.telefone as string}</p>
                    </div>
                    <div className="ml-auto">
                      <AlertCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
