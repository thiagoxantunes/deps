import { createClient } from '@/lib/supabase/server'
import { Search, Users, Car, FileText } from 'lucide-react'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/cn'

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const q = params.q?.trim() || ''
  const supabase = await createClient()

  let clientes: Record<string, unknown>[] = []
  let veiculos: Record<string, unknown>[] = []
  let servicos: Record<string, unknown>[] = []

  if (q.length >= 2) {
    const [c, v, s] = await Promise.all([
      supabase.from('clientes').select('id, nome, cpf_cnpj, telefone')
        .or(`nome.ilike.%${q}%,cpf_cnpj.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10),
      supabase.from('veiculos').select('id, placa, marca, modelo, ano, cliente:clientes(id, nome)')
        .or(`placa.ilike.%${q}%,modelo.ilike.%${q}%,renavam.ilike.%${q}%`)
        .limit(10),
      supabase.from('servicos').select('id, tipo_servico, status, data_inicio, cliente:clientes(id, nome)')
        .or(`tipo_servico.ilike.%${q}%,descricao.ilike.%${q}%`)
        .limit(10),
    ])
    clientes = c.data || []
    veiculos = v.data || []
    servicos = s.data || []
  }

  const total = clientes.length + veiculos.length + servicos.length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Search className="w-7 h-7 text-blue-600" />
          Busca Global
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Encontre clientes, veículos e serviços
        </p>
      </div>

      <form className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          name="q"
          type="text"
          defaultValue={q}
          placeholder="Buscar por nome, CPF, placa, RENAVAM, tipo de serviço..."
          autoFocus
          className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </form>

      {q.length >= 2 ? (
        total === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Nenhum resultado para &quot;{q}&quot;</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Tente outro termo de busca</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} resultado{total !== 1 ? 's' : ''} para &quot;<strong>{q}</strong>&quot;
            </p>

            {/* Clientes */}
            {clientes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Clientes ({clientes.length})</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {clientes.map(c => (
                    <Link key={c.id as string} href={`/clientes/${c.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {(c.nome as string)[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{c.nome as string}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{c.cpf_cnpj as string} • {c.telefone as string}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Veículos */}
            {veiculos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Veículos ({veiculos.length})</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {veiculos.map(v => {
                    const cliente = v.cliente as { id: string; nome: string } | null
                    return (
                      <Link key={v.id as string} href={`/veiculos/${v.id}`}>
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white font-mono">{v.placa as string}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {v.marca as string} {v.modelo as string} {v.ano as number}
                              {cliente ? ` • ${cliente.nome}` : ''}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Serviços */}
            {servicos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Serviços ({servicos.length})</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {servicos.map(s => {
                    const cliente = s.cliente as { id: string; nome: string } | null
                    return (
                      <Link key={s.id as string} href={`/servicos/${s.id}`}>
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{s.tipo_servico as string}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {cliente ? `${cliente.nome} • ` : ''}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[s.status as string]}`}>
                            {STATUS_LABELS[s.status as string]}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-gray-500 dark:text-gray-400">Digite pelo menos 2 caracteres para buscar</p>
        </div>
      )}
    </div>
  )
}
