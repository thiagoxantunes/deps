import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SaidaForm from '../../SaidaForm'

export default async function EditarSaidaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: saida } = await supabase.from('saidas').select('*').eq('id', id).single()
  if (!saida) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/saidas" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Saída</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{saida.descricao}</p>
        </div>
      </div>
      <SaidaForm saida={saida} />
    </div>
  )
}
