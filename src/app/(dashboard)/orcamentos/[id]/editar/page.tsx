import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import OrcamentoForm from '../../OrcamentoForm'

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: orcamento } = await supabase
    .from('orcamentos')
    .select('*, itens:orcamento_itens(*)')
    .eq('id', id)
    .single()

  if (!orcamento) notFound()

  // Não permite editar orçamento já aprovado/recusado
  if (!['rascunho', 'enviado'].includes(orcamento.status)) {
    redirect(`/orcamentos/${id}`)
  }

  const itens = (orcamento.itens || []).sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/orcamentos/${id}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Orçamento #{String(orcamento.numero).padStart(4, '0')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Atualize os dados da proposta</p>
        </div>
      </div>
      <OrcamentoForm orcamento={{ ...orcamento, itens }} />
    </div>
  )
}
