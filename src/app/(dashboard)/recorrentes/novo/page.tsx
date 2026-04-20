import RecorrenteForm from '../RecorrenteForm'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function NovoRecorrentePage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/recorrentes" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            Novo Serviço Recorrente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Cadastre um serviço periódico para receber alertas de vencimento
          </p>
        </div>
      </div>
      <RecorrenteForm />
    </div>
  )
}
