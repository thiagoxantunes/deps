export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import ClientesTable from './ClientesTable'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clientes')
    .select('id, nome, telefone, whatsapp, email, cpf_cnpj, tags, created_at')
    .order('nome')

  if (params.q) {
    query = query.or(`nome.ilike.%${params.q}%,cpf_cnpj.ilike.%${params.q}%,email.ilike.%${params.q}%`)
  }

  if (params.tag) {
    query = query.contains('tags', [params.tag])
  }

  const { data: clientes } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Clientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {clientes?.length || 0} cliente{(clientes?.length || 0) !== 1 ? 's' : ''} cadastrado{(clientes?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button>
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <ClientesTable clientes={clientes || []} searchQuery={params.q || ''} tagFilter={params.tag || ''} />
    </div>
  )
}
