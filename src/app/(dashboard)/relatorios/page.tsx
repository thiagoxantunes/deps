import { createClient } from '@/lib/supabase/server'
import { BarChart2 } from 'lucide-react'
import { formatCurrency } from '@/utils/cn'
import RelatorioClient from './RelatorioClient'
import RelatorioGraficoClient from './RelatorioGraficoClient'
import ExportarCSVButton from './ExportarCSVButton'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string; dia?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const ano = parseInt(params.ano || String(now.getFullYear()))
  const mes = parseInt(params.mes || String(now.getMonth() + 1))
  const dia = params.dia ? parseInt(params.dia) : null

  const dataRef = new Date(ano, mes - 1, 1)

  // Define intervalo conforme filtro
  let inicio: string
  let fim: string
  if (dia) {
    const d = String(dia).padStart(2, '0')
    const m = String(mes).padStart(2, '0')
    inicio = `${ano}-${m}-${d}`
    fim = inicio
  } else {
    inicio = format(startOfMonth(dataRef), 'yyyy-MM-dd')
    fim = format(endOfMonth(dataRef), 'yyyy-MM-dd')
  }

  const supabase = await createClient()

  // Serviços do período selecionado
  const { data: servicos } = await supabase
    .from('servicos')
    .select('*, cliente:clientes(id, nome)')
    .gte('data_inicio', inicio)
    .lte('data_inicio', fim)
    .order('data_inicio', { ascending: false })

  // Serviços do mês inteiro (para o gráfico de dias — sempre o mês completo)
  const inicioMes = format(startOfMonth(dataRef), 'yyyy-MM-dd')
  const fimMes = format(endOfMonth(dataRef), 'yyyy-MM-dd')
  const { data: servicosMes } = await supabase
    .from('servicos')
    .select('data_inicio, valor, pagamento_status')
    .gte('data_inicio', inicioMes)
    .lte('data_inicio', fimMes)

  // Últimos 12 meses para o gráfico de evolução mensal
  const evolucao = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, 11 - i)
      const ini = format(startOfMonth(d), 'yyyy-MM-dd')
      const fin = format(endOfMonth(d), 'yyyy-MM-dd')
      return supabase
        .from('servicos')
        .select('valor, pagamento_status, status')
        .gte('data_inicio', ini)
        .lte('data_inicio', fin)
        .then(({ data }) => ({
          mes: format(d, 'MMM/yy', { locale: ptBR }),
          total: (data || []).length,
          receita: (data || []).filter(s => s.pagamento_status === 'pago').reduce((a, s) => a + (s.valor || 0), 0),
          a_receber: (data || []).filter(s => s.pagamento_status === 'a_receber').reduce((a, s) => a + (s.valor || 0), 0),
          concluidos: (data || []).filter(s => s.status === 'concluido').length,
        }))
    })
  )

  // Gráfico dias do mês — agrupa servicosMes por dia
  const lastDay = new Date(ano, mes, 0).getDate()
  const diasMes = Array.from({ length: lastDay }, (_, i) => {
    const dayNum = i + 1
    const dayStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    const dayData = (servicosMes || []).filter(s => s.data_inicio === dayStr)
    return {
      dia: String(dayNum).padStart(2, '0'),
      receita: dayData.filter(s => s.pagamento_status === 'pago').reduce((a, s) => a + (s.valor || 0), 0),
      a_receber: dayData.filter(s => s.pagamento_status === 'a_receber').reduce((a, s) => a + (s.valor || 0), 0),
      total: dayData.length,
    }
  })

  const lista = servicos || []

  // Agrupamentos
  const porTipo = lista.reduce((acc: Record<string, { qtd: number; total: number; recebido: number }>, s) => {
    const tipo = s.tipo_servico
    if (!acc[tipo]) acc[tipo] = { qtd: 0, total: 0, recebido: 0 }
    acc[tipo].qtd++
    acc[tipo].total += s.valor || 0
    if (s.pagamento_status === 'pago') acc[tipo].recebido += s.valor || 0
    return acc
  }, {})

  const totalServicos = lista.length
  const totalRecebido = lista.filter(s => s.pagamento_status === 'pago').reduce((a, s) => a + (s.valor || 0), 0)
  const totalAReceber = lista.filter(s => s.pagamento_status === 'a_receber').reduce((a, s) => a + (s.valor || 0), 0)
  const totalFaturado = lista.reduce((a, s) => a + (s.valor || 0), 0)
  const concluidos = lista.filter(s => s.status === 'concluido').length

  // Label do período
  const periodoLabel = dia
    ? format(new Date(ano, mes - 1, dia), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(dataRef, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-blue-600" />
            Relatórios
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {periodoLabel}
          </p>
        </div>
        <RelatorioClient mes={mes} ano={ano} dia={dia} />
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Serviços no período', value: String(totalServicos), sub: `${concluidos} concluídos`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Faturado', value: formatCurrency(totalFaturado), sub: 'Valor total dos serviços', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Recebido', value: formatCurrency(totalRecebido), sub: 'Pagamentos confirmados', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'A Receber', value: formatCurrency(totalAReceber), sub: 'Aguardando pagamento', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.bg} mb-3`}>
              <BarChart2 className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          {dia ? `Gráfico — dia ${String(dia).padStart(2, '0')}` : 'Gráfico de receita'}
        </h2>
        <RelatorioGraficoClient
          evolucao={evolucao}
          diasMes={diasMes}
          diaAtivo={!!dia}
        />
      </div>

      {/* Por tipo de serviço */}
      {Object.keys(porTipo).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Por Tipo de Serviço</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Tipo', 'Qtd', 'Faturado', 'Recebido', 'A Receber'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {Object.entries(porTipo)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([tipo, data]) => (
                    <tr key={tipo} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 font-medium text-gray-900 dark:text-white">{tipo}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{data.qtd}</td>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">{formatCurrency(data.total)}</td>
                      <td className="py-3 text-green-600 dark:text-green-400 font-medium">{formatCurrency(data.recebido)}</td>
                      <td className="py-3 text-orange-600 dark:text-orange-400 font-medium">
                        {formatCurrency(data.total - data.recebido)}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <td className="py-3 font-bold text-gray-900 dark:text-white">Total</td>
                  <td className="py-3 font-bold text-gray-900 dark:text-white">{totalServicos}</td>
                  <td className="py-3 font-bold text-purple-600">{formatCurrency(totalFaturado)}</td>
                  <td className="py-3 font-bold text-green-600">{formatCurrency(totalRecebido)}</td>
                  <td className="py-3 font-bold text-orange-600">{formatCurrency(totalAReceber)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Listagem detalhada */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Serviços do período ({lista.length})
          </h2>
          <ExportarCSVButton servicos={lista} mes={mes} ano={ano} />
        </div>

        {lista.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum serviço neste período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Data', 'Cliente', 'Serviço', 'Status', 'Pgto', 'Valor'].map(h => (
                    <th key={h} className="text-left pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {lista.map(s => {
                  const c = s.cliente as { nome: string } | null
                  const pagColor = {
                    pago: 'text-green-600 bg-green-50 dark:bg-green-900/20',
                    a_receber: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
                    pendente: 'text-gray-500 bg-gray-50 dark:bg-gray-700',
                  }[s.pagamento_status as string] || ''
                  const pagLabel = { pago: 'Pago', a_receber: 'A Receber', pendente: 'Sem cobrança' }[s.pagamento_status as string] || ''
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(s.data_inicio + 'T12:00:00'), 'dd/MM/yy', { locale: ptBR })}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white max-w-[150px] truncate">
                        {c?.nome || '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                        {s.tipo_servico}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === 'concluido' ? 'bg-green-50 text-green-700 dark:bg-green-900/20' :
                          s.status === 'em_andamento' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20' :
                          'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20'
                        }`}>
                          {s.status === 'concluido' ? 'Concluído' : s.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pagColor}`}>
                          {pagLabel}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {s.valor ? formatCurrency(s.valor) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
