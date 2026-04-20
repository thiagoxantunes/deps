import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ClienteForm from '../ClienteForm'

export default function NovoClientePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/clientes" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Cliente</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados do cliente</p>
        </div>
      </div>
      <ClienteForm />
    </div>
  )
}
