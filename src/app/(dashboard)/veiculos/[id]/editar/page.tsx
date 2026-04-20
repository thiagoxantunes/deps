import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import VeiculoForm from '../../VeiculoForm'
import type { Veiculo } from '@/types'

export default async function EditarVeiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: veiculo }, { data: clientes }] = await Promise.all([
    supabase.from('veiculos').select('*').eq('id', id).single(),
    supabase.from('clientes').select('id, nome').order('nome'),
  ])

  if (!veiculo) notFound()

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/veiculos/${id}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Veículo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{veiculo.placa}</p>
        </div>
      </div>
      <VeiculoForm veiculo={veiculo as Veiculo} clientes={clientes || []} />
    </div>
  )
}
