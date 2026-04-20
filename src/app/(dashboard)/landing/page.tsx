import { createClient } from '@/lib/supabase/server'
import { Globe } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import LandingEditor from './LandingEditor'

export default async function LandingPageAdmin() {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('landing_config')
    .select('updated_at')
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-7 h-7 text-blue-500" />
            Landing Page
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {config?.updated_at
              ? `Última edição: ${format(new Date(config.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
              : 'Usando conteúdo padrão — salve para personalizar'}
          </p>
        </div>
      </div>

      <LandingEditor />
    </div>
  )
}
