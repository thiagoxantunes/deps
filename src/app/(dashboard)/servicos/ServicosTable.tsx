'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Eye, FileText, X } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, TIPOS_SERVICO, formatCurrency, PAGAMENTO_STATUS_LABELS, PAGAMENTO_STATUS_COLORS } from '@/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { format, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Servico {
  id: string
  tipo_servico: string
  status: string
  pagamento_status: string
  data_inicio: string
  data_conclusao?: string
  valor?: number
  cliente?: { id: string; nome: string } | null
  veiculo?: { placa: string; modelo: string } | null
}

interface ServicosTableProps {
  servicos: Servico[]
  searchQuery: string
  statusFilter: string
  tipoFilter: string
  anoFilter: string
  mesFilter: string
  diaFilter: string
}

const MESES = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },   { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },    { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },   { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
]

const ANOS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i
  return { value: String(y), label: String(y) }
})

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatarDiaHeader(dateStr: string) {
  const date = parseISO(dateStr)
  if (isToday(date)) return `Hoje — ${format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}`
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export default function ServicosTable({
  servicos, searchQuery, statusFilter, tipoFilter,
  anoFilter, mesFilter, diaFilter,
}: ServicosTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(searchQuery)
  const [, startTransition] = useTransition()
  const applyFilter = (q: string, status: string, tipo: string, ano: string, mes: string, dia: string) => {
    const params = new URLSearchParams()
    if (q)      params.set('q', q)
    if (status) params.set('status', status)
    if (tipo)   params.set('tipo', tipo)
    if (ano)    params.set('ano', ano)
    if (mes)    params.set('mes', mes)
    if (dia)    params.set('dia', dia)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }

  const setAno  = (v: string) => applyFilter(search, statusFilter, tipoFilter, v, v ? mesFilter : '', '')
  const setMes  = (v: string) => applyFilter(search, statusFilter, tipoFilter, anoFilter, v, v ? diaFilter : '')
  const setDia  = (v: string) => applyFilter(search, statusFilter, tipoFilter, anoFilter, mesFilter, v)
  const limpar  = () => applyFilter(search, statusFilter, tipoFilter, '', '', '')
  const setHoje = () => {
    const n = new Date()
    applyFilter(search, statusFilter, tipoFilter, String(n.getFullYear()), String(n.getMonth() + 1), String(n.getDate()))
  }

  const temFiltroData = !!(anoFilter || mesFilter || diaFilter)

  // Agrupa por data_inicio — mais recente primeiro
  const grupos = servicos.reduce<Record<string, Servico[]>>((acc, s) => {
    const dia = s.data_inicio.split('T')[0]
    if (!acc[dia]) acc[dia] = []
    acc[dia].push(s)
    return acc
  }, {})
  const dias = Object.keys(grupos).sort((a, b) => b.localeCompare(a))

  return (
    <>
      {/* Filtros */}
      <div className="space-y-3">
        {/* Linha 1: busca + status + tipo */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por tipo ou descrição..."
              value={search}
              onChange={e => { setSearch(e.target.value); applyFilter(e.target.value, statusFilter, tipoFilter, anoFilter, mesFilter, diaFilter) }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => applyFilter(search, e.target.value, tipoFilter, anoFilter, mesFilter, diaFilter)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Todos os status</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="pendente">Pendente</option>
            <option value="concluido">Concluído</option>
          </select>
          <select
            value={tipoFilter}
            onChange={e => applyFilter(search, statusFilter, e.target.value, anoFilter, mesFilter, diaFilter)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Todos os tipos</option>
            {TIPOS_SERVICO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Linha 2: filtro por data */}
        <div className="flex items-center gap-2 flex-wrap bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Período:</span>

          <select
            value={anoFilter}
            onChange={e => setAno(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Ano</option>
            {ANOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>

          <select
            value={mesFilter}
            onChange={e => setMes(e.target.value)}
            disabled={!anoFilter}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
          >
            <option value="">Mês</option>
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          <select
            value={diaFilter}
            onChange={e => setDia(e.target.value)}
            disabled={!mesFilter}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
          >
            <option value="">Dia</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={String(d)}>{String(d).padStart(2, '0')}</option>
            ))}
          </select>

          <button
            onClick={setHoje}
            className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
              diaFilter && mesFilter && anoFilter &&
              Number(anoFilter) === new Date().getFullYear() &&
              Number(mesFilter) === new Date().getMonth() + 1 &&
              Number(diaFilter) === new Date().getDate()
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Hoje
          </button>

          {temFiltroData && (
            <button
              onClick={limpar}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />Limpar
            </button>
          )}
        </div>
      </div>

      {servicos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum serviço encontrado</p>
          {temFiltroData && (
            <button onClick={limpar} className="mt-2 text-sm text-orange-500 hover:underline">
              Limpar filtros de data
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {dias.map(dia => (
            <div key={dia}>
              {/* Cabeçalho do dia */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isToday(parseISO(dia))
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {capitalize(formatarDiaHeader(dia))}
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {grupos[dia].length} serviço{grupos[dia].length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Desktop: tabela */}
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {['Serviço', 'Cliente', 'Veículo', 'Status', 'Pagamento', 'Valor', 'Ações'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {grupos[dia].map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.tipo_servico}</td>
                        <td className="px-4 py-3">
                          {s.cliente ? (
                            <Link href={`/clientes/${s.cliente.id}`} className="text-orange-600 dark:text-orange-400 hover:underline">{s.cliente.nome}</Link>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{s.veiculo?.placa || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${PAGAMENTO_STATUS_COLORS[s.pagamento_status]}`}>{PAGAMENTO_STATUS_LABELS[s.pagamento_status]}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{s.valor ? formatCurrency(s.valor) : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Link href={`/servicos/${s.id}`}><button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Eye className="w-4 h-4" /></button></Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="md:hidden space-y-2">
                {grupos[dia].map(s => (
                  <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{s.tipo_servico}</p>
                        {s.cliente && <Link href={`/clientes/${s.cliente.id}`} className="text-sm text-orange-600 dark:text-orange-400 hover:underline">{s.cliente.nome}</Link>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link href={`/servicos/${s.id}`}><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Eye className="w-4 h-4" /></button></Link>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAGAMENTO_STATUS_COLORS[s.pagamento_status]}`}>{PAGAMENTO_STATUS_LABELS[s.pagamento_status]}</span>
                      {s.veiculo && <span className="text-xs font-mono text-gray-500">{s.veiculo.placa}</span>}
                      {s.valor && <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-auto">{formatCurrency(s.valor)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </>
  )
}
