'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Eye, Pencil, Trash2, MessageCircle, Filter, AlertTriangle } from 'lucide-react'
import { TAG_COLORS, TAG_LABELS } from '@/utils/cn'
import { createClient } from '@/lib/supabase/client'
import ConfirmComSenhaDialog from '@/components/ui/ConfirmComSenhaDialog'
import toast from 'react-hot-toast'
import type { Cliente } from '@/types'

interface ClientesTableProps {
  clientes: Partial<Cliente>[]
  searchQuery: string
  tagFilter: string
}

const TAG_OPTIONS = ['vip', 'inadimplente', 'recorrente', 'novo']

export default function ClientesTable({ clientes, searchQuery, tagFilter }: ClientesTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(searchQuery)
  const [, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [bloqueio, setBloqueio] = useState<string | null>(null)

  const applyFilter = (q: string, tag: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tag) params.set('tag', tag)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }

  const verificarBloqueio = async (id: string, nome: string) => {
    const supabase = createClient()
    const { data: servicos } = await supabase
      .from('servicos')
      .select('id, status, pagamento_status')
      .eq('cliente_id', id)
      .or('status.eq.em_andamento,status.eq.pendente,pagamento_status.eq.a_receber')

    if (servicos && servicos.length > 0) {
      const temAndamento = servicos.some(s => s.status === 'em_andamento' || s.status === 'pendente')
      const temPagPendente = servicos.some(s => s.pagamento_status === 'a_receber')
      const motivos: string[] = []
      if (temAndamento) motivos.push('serviços em aberto')
      if (temPagPendente) motivos.push('pagamentos pendentes')
      setBloqueio(`Não é possível excluir "${nome}": cliente possui ${motivos.join(' e ')}.`)
      return
    }

    setDeleteId(id)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('clientes').delete().eq('id', deleteId)
    if (error) {
      toast.error('Erro ao excluir cliente.')
    } else {
      toast.success('Cliente excluído!')
      router.refresh()
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const openWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${digits}`, '_blank')
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ ou email..."
            value={search}
            onChange={e => { setSearch(e.target.value); applyFilter(e.target.value, tagFilter) }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={tagFilter}
            onChange={e => applyFilter(search, e.target.value)}
            className="flex-1 sm:flex-none text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as tags</option>
            {TAG_OPTIONS.map(t => (
              <option key={t} value={t}>{TAG_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bloqueio de exclusão */}
      {bloqueio && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300">{bloqueio}</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              Conclua ou cancele todos os serviços e pagamentos antes de excluir.
            </p>
          </div>
          <button onClick={() => setBloqueio(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
        </div>
      )}

      {clientes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente ajustar os filtros ou cadastre um novo cliente</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Nome', 'CPF/CNPJ', 'Telefone', 'Tags', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {clientes.map(cliente => {
                  const faltaCPF = !cliente.cpf_cnpj
                  const faltaTel = !cliente.telefone
                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {cliente.nome?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{cliente.nome}</p>
                            {cliente.email && <p className="text-xs text-gray-500">{cliente.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {faltaCPF
                          ? <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs"><AlertTriangle className="w-3.5 h-3.5" />Pendente</span>
                          : <span className="text-gray-600 dark:text-gray-400">{cliente.cpf_cnpj}</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {faltaTel
                          ? <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs"><AlertTriangle className="w-3.5 h-3.5" />Pendente</span>
                          : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">{cliente.telefone}</span>
                              {cliente.whatsapp && (
                                <button onClick={() => openWhatsApp(cliente.telefone!)} className="text-green-600 hover:text-green-700">
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(cliente.tags || []).map(tag => (
                            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag]}`}>{TAG_LABELS[tag]}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/clientes/${cliente.id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Visualizar"><Eye className="w-4 h-4" /></button>
                          </Link>
                          <Link href={`/clientes/${cliente.id}/editar`}>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Editar"><Pencil className="w-4 h-4" /></button>
                          </Link>
                          <button
                            onClick={() => verificarBloqueio(cliente.id!, cliente.nome!)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {clientes.map(cliente => {
              const faltaCPF = !cliente.cpf_cnpj
              const faltaTel = !cliente.telefone
              const temPendencia = faltaCPF || faltaTel
              return (
                <div key={cliente.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{cliente.nome?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{cliente.nome}</p>
                          {temPendencia && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                        </div>
                        {!faltaCPF && <p className="text-xs text-gray-500 dark:text-gray-400">{cliente.cpf_cnpj}</p>}
                        {faltaCPF && <p className="text-xs text-yellow-600 dark:text-yellow-400">CPF pendente</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Link href={`/clientes/${cliente.id}`}><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Eye className="w-4 h-4" /></button></Link>
                      <Link href={`/clientes/${cliente.id}/editar`}><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Pencil className="w-4 h-4" /></button></Link>
                      <button onClick={() => verificarBloqueio(cliente.id!, cliente.nome!)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {!faltaTel && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      {cliente.whatsapp
                        ? <button onClick={() => openWhatsApp(cliente.telefone!)} className="flex items-center gap-1 text-green-600"><MessageCircle className="w-3.5 h-3.5" />{cliente.telefone}</button>
                        : <span>{cliente.telefone}</span>
                      }
                    </div>
                  )}
                  {faltaTel && <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Telefone pendente</p>}
                  {(cliente.tags || []).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(cliente.tags || []).map(tag => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag]}`}>{TAG_LABELS[tag]}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <ConfirmComSenhaDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir cliente"
        message="Esta ação é permanente e excluirá todos os dados do cliente. Digite sua senha para confirmar."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </>
  )
}
