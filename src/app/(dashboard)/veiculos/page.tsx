import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Car, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import VeiculosTable from './VeiculosTable'

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('veiculos')
    .select('*, cliente:clientes(id, nome)')
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(`placa.ilike.%${params.q}%,marca.ilike.%${params.q}%,modelo.ilike.%${params.q}%,renavam.ilike.%${params.q}%`)
  }

  if (params.tipo) {
    query = query.eq('tipo', params.tipo)
  }

  const { data: veiculos } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Car className="w-7 h-7 text-blue-600" />
            Veículos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {veiculos?.length || 0} veículo{(veiculos?.length || 0) !== 1 ? 's' : ''} cadastrado{(veiculos?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/veiculos/novo">
          <Button>
            <Plus className="w-4 h-4" />
            Novo Veículo
          </Button>
        </Link>
      </div>
      <VeiculosTable veiculos={veiculos || []} searchQuery={params.q || ''} tipoFilter={params.tipo || ''} />
    </div>
  )
}
