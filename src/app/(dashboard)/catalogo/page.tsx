export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import { List } from 'lucide-react'
import CatalogoTable from './CatalogoTable'

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data: itens } = await supabase
    .from('catalogo_servicos')
    .select('*')
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <List className="w-7 h-7 text-orange-500" />
            Catálogo de Serviços
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Lista de serviços com valores sugeridos — usada para preencher orçamentos rapidamente
          </p>
        </div>
      </div>

      <CatalogoTable itens={itens || []} />
    </div>
  )
}
