import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import VeiculoForm from '../VeiculoForm'

export default async function NovoVeiculoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: clientes } = await supabase.from('clientes').select('id, nome').order('nome')

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/veiculos" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Veículo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cadastre um veículo para o cliente</p>
        </div>
      </div>
      <VeiculoForm clienteId={params.cliente_id} clientes={clientes || []} />
    </div>
  )
}
