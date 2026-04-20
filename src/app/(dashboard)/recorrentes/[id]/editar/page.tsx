import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecorrenteForm from '../../RecorrenteForm'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default async function EditarRecorrentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: servico } = await supabase
    .from('servicos_recorrentes')
    .select('*, cliente:clientes(id, nome), veiculo:veiculos(id, placa, modelo)')
    .eq('id', id)
    .single()

  if (!servico) notFound()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/recorrentes" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            Editar Serviço Recorrente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{servico.tipo_servico}</p>
        </div>
      </div>
      <RecorrenteForm servico={servico as import('@/types').ServicoRecorrente} />
    </div>
  )
}
