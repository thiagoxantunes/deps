'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Eye, Pencil, Trash2, Car } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ConfirmComSenhaDialog from '@/components/ui/ConfirmComSenhaDialog'
import toast from 'react-hot-toast'

interface Veiculo {
  id: string
  tipo: string
  placa: string
  renavam: string
  marca: string
  modelo: string
  ano: number
  cor?: string
  status_veiculo?: string
  cliente?: { id: string; nome: string } | null
}

const STATUS_VEICULO_BADGE: Record<string, string> = {
  ativo: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  antigo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  transferido: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}
const STATUS_VEICULO_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  antigo: 'Antigo',
  transferido: 'Transferido',
}

interface VeiculosTableProps {
  veiculos: Veiculo[]
  searchQuery: string
  tipoFilter: string
}

export default function VeiculosTable({ veiculos, searchQuery, tipoFilter }: VeiculosTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(searchQuery)
  const [, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const applyFilter = (q: string, tipo: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tipo) params.set('tipo', tipo)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('veiculos').delete().eq('id', deleteId)
    if (error) {
      toast.error('Erro ao excluir veículo.')
    } else {
      toast.success('Veículo excluído!')
      router.refresh()
    }
    setDeleting(false)
    setDeleteId(null)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, marca, modelo ou RENAVAM..."
            value={search}
            onChange={e => { setSearch(e.target.value); applyFilter(e.target.value, tipoFilter) }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={e => applyFilter(search, e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os tipos</option>
          <option value="carro">Carro</option>
          <option value="moto">Moto</option>
        </select>
      </div>

      {veiculos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Car className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum veículo encontrado</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Placa', 'Veículo', 'RENAVAM', 'Cliente', 'Tipo', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {veiculos.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">{v.placa}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{v.marca} {v.modelo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{v.ano}{v.cor ? ` • ${v.cor}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{v.renavam}</td>
                    <td className="px-4 py-3">
                      {v.cliente ? (
                        <Link href={`/clientes/${v.cliente.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {v.cliente.nome}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${v.tipo === 'carro' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                        {v.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {v.status_veiculo && v.status_veiculo !== 'ativo' && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_VEICULO_BADGE[v.status_veiculo]}`}>
                          {STATUS_VEICULO_LABEL[v.status_veiculo]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link href={`/veiculos/${v.id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Eye className="w-4 h-4" /></button>
                        </Link>
                        <Link href={`/veiculos/${v.id}/editar`}>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Pencil className="w-4 h-4" /></button>
                        </Link>
                        <button onClick={() => setDeleteId(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {veiculos.map(v => (
              <div key={v.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white font-mono">{v.placa}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{v.marca} {v.modelo} {v.ano}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/veiculos/${v.id}`}><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Eye className="w-4 h-4" /></button></Link>
                    <Link href={`/veiculos/${v.id}/editar`}><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Pencil className="w-4 h-4" /></button></Link>
                    <button onClick={() => setDeleteId(v.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {v.cliente && (
                  <Link href={`/clientes/${v.cliente.id}`} className="mt-2 block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    {v.cliente.nome}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmComSenhaDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir veículo"
        message="Esta ação é permanente e removerá todos os dados do veículo. Digite sua senha para confirmar."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </>
  )
}
