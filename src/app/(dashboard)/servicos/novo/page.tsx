import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ServicoForm from '../ServicoForm'

export default async function NovoServicoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente_id?: string; veiculo_id?: string }>
}) {
  const params = await searchParams

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/servicos" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Serviço</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Registre um novo serviço</p>
        </div>
      </div>
      <ServicoForm clienteId={params.cliente_id} veiculoId={params.veiculo_id} />
    </div>
  )
}
