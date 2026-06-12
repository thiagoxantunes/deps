export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import Button from '@/components/ui/Button'
import OrcamentosTable from './OrcamentosTable'

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('orcamentos')
    .select('*, cliente:clientes(id, nome, telefone), veiculo:veiculos(placa, modelo)')
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: orcamentos } = await query

  // Filtro por nome do cliente (client-side, simples)
  const filtrados = (orcamentos || []).filter(o => {
    if (!params.q) return true
    const nome = (o.cliente?.nome || '').toLowerCase()
    return nome.includes(params.q.toLowerCase()) || String(o.numero).includes(params.q)
  })

  const total = filtrados.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-orange-500" />
            Orçamentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} orçamento{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/orcamentos/novo">
          <Button>
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </Button>
        </Link>
      </div>
      <OrcamentosTable
        orcamentos={filtrados}
        searchQuery={params.q || ''}
        statusFilter={params.status || ''}
      />
    </div>
  )
}
