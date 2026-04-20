export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, TrendingDown, Pencil, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/cn'
import SaidaDeleteButton from './SaidaDeleteButton'

export default async function SaidasPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const now = new Date()
  const ano = params.ano || String(now.getFullYear())
  const mes = params.mes || String(now.getMonth() + 1)

  const start = `${ano}-${mes.padStart(2, '0')}-01`
  const lastDay = new Date(Number(ano), Number(mes), 0).getDate()
  const end = `${ano}-${mes.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data: saidas } = await supabase
    .from('saidas')
    .select('*, conta:contas_recebimento(id, nome)')
    .gte('data', start)
    .lte('data', end)
    .order('data', { ascending: false })

  const total = (saidas || []).reduce((s, r) => s + (r.valor || 0), 0)

  const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const ANOS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingDown className="w-7 h-7 text-red-500" />
            Saídas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {(saidas || []).length} despesa{(saidas || []).length !== 1 ? 's' : ''} — {MESES[Number(mes)]} {ano}
          </p>
        </div>
        <Link href="/saidas/nova">
          <Button className="bg-red-600 hover:bg-red-700 focus:ring-red-400">
            <Plus className="w-4 h-4" />
            Registrar Saída
          </Button>
        </Link>
      </div>

      {/* Filtro Mês/Ano */}
      <Card>
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ano</label>
            <select
              name="ano"
              defaultValue={ano}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mês</label>
            <select
              name="mes"
              defaultValue={mes}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              {MESES.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Filtrar
          </button>
        </form>
      </Card>

      {/* Total do período */}
      {total > 0 && (
        <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">Total de Saídas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{MESES[Number(mes)]} {ano}</p>
          </div>
        </div>
      )}

      {/* Lista */}
      {(saidas || []).length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <TrendingDown className="w-12 h-12 mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma saída em {MESES[Number(mes)]} {ano}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Clique em "Registrar Saída" para adicionar uma despesa.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {(saidas || []).map((s) => {
            const conta = s.conta as { id: string; nome: string } | null
            const dataFormatada = new Date(s.data + 'T12:00:00').toLocaleDateString('pt-BR')
            return (
              <div
                key={s.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-colors"
              >
                {/* Data + Horário */}
                <div className="w-14 flex-shrink-0 text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                    {String(new Date(s.data + 'T12:00:00').getDate()).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase">
                    {new Date(s.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                  </p>
                  {s.horario && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.horario}</p>
                  )}
                </div>

                <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

                {/* Descrição + conta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.descricao}</p>
                  {conta && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {conta.nome}
                    </p>
                  )}
                </div>

                {/* Valor */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-base font-bold text-red-600 dark:text-red-400">
                    − {formatCurrency(s.valor)}
                  </p>
                  <p className="text-[10px] text-gray-400">{dataFormatada}</p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/saidas/${s.id}/editar`}>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </Link>
                  <SaidaDeleteButton id={s.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
