'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Eye, X, ClipboardList } from 'lucide-react'
import { formatCurrency, ORCAMENTO_STATUS_LABELS, ORCAMENTO_STATUS_COLORS } from '@/utils/cn'
import { format } from 'date-fns'

interface OrcamentoLista {
  id: string
  numero: number
  status: string
  valor_total: number
  validade?: string | null
  created_at: string
  cliente?: { id: string; nome: string; telefone?: string } | null
  veiculo?: { placa: string; modelo: string } | null
}

interface Props {
  orcamentos: OrcamentoLista[]
  searchQuery: string
  statusFilter: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'expirado', label: 'Expirado' },
]

export default function OrcamentosTable({ orcamentos, searchQuery, statusFilter }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(searchQuery)
  const [status, setStatus] = useState(statusFilter)
  const [, startTransition] = useTransition()

  const updateUrl = (next: { q?: string; status?: string }) => {
    const sp = new URLSearchParams()
    const finalQ = next.q !== undefined ? next.q : q
    const finalS = next.status !== undefined ? next.status : status
    if (finalQ) sp.set('q', finalQ)
    if (finalS) sp.set('status', finalS)
    startTransition(() => {
      router.push(`/orcamentos${sp.toString() ? '?' + sp.toString() : ''}`)
    })
  }

  const limpar = () => {
    setQ(''); setStatus('')
    startTransition(() => router.push('/orcamentos'))
  }

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') updateUrl({ q }) }}
            placeholder="Buscar por cliente ou número..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); updateUrl({ status: e.target.value }) }}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(q || status) && (
          <button
            onClick={limpar}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" /> Limpar
          </button>
        )}
      </div>

      {/* Tabela */}
      {orcamentos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum orçamento encontrado</p>
          <Link href="/orcamentos/novo" className="text-orange-600 dark:text-orange-400 hover:underline text-sm font-medium mt-2 inline-block">
            Criar primeiro orçamento →
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Nº</th>
                  <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold">Veículo</th>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-left px-4 py-3 font-semibold">Validade</th>
                  <th className="text-right px-4 py-3 font-semibold">Valor</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                  <th className="text-center px-4 py-3 font-semibold w-12">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orcamentos.map(o => {
                  const expirado = o.validade && o.validade < hoje && o.status === 'enviado'
                  const statusEfetivo = expirado ? 'expirado' : o.status
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                        #{String(o.numero).padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/orcamentos/${o.id}`} className="font-medium text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400">
                          {o.cliente?.nome || '—'}
                        </Link>
                        {o.cliente?.telefone && (
                          <div className="text-xs text-gray-500">{o.cliente.telefone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {o.veiculo ? `${o.veiculo.placa} • ${o.veiculo.modelo}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(o.created_at), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {o.validade
                          ? format(new Date(o.validade + 'T12:00:00'), 'dd/MM/yyyy')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                        {formatCurrency(o.valor_total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${ORCAMENTO_STATUS_COLORS[statusEfetivo] || ''}`}>
                          {ORCAMENTO_STATUS_LABELS[statusEfetivo] || statusEfetivo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/orcamentos/${o.id}`} className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
