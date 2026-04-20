import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import RecorrentesTable from './RecorrentesTable'
import { differenceInDays } from 'date-fns'

export default async function RecorrentesPage() {
  const supabase = await createClient()

  const { data: servicos } = await supabase
    .from('servicos_recorrentes')
    .select('*, cliente:clientes(id, nome), veiculo:veiculos(id, placa, modelo)')
    .order('proximo_vencimento', { ascending: true })

  const hoje = new Date()
  const ativos = (servicos || []).filter(s => s.ativo)
  const vencidos = ativos.filter(s => differenceInDays(new Date(s.proximo_vencimento + 'T00:00:00'), hoje) < 0)
  const proximos = ativos.filter(s => {
    const dias = differenceInDays(new Date(s.proximo_vencimento + 'T00:00:00'), hoje)
    return dias >= 0 && dias <= s.antecedencia_dias
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-blue-600" />
            Serviços Recorrentes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie serviços periódicos como IPVA, licenciamento e renovações de CNH
          </p>
        </div>
        <Link href="/recorrentes/novo">
          <Button>
            <Plus className="w-4 h-4" />
            Novo Recorrente
          </Button>
        </Link>
      </div>

      {/* Alertas de vencimento */}
      {vencidos.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              {vencidos.length} serviço{vencidos.length !== 1 ? 's' : ''} vencido{vencidos.length !== 1 ? 's' : ''}!
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {vencidos.map(s => `${s.tipo_servico} (${s.cliente?.nome || ''})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {proximos.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
          <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
              {proximos.length} serviço{proximos.length !== 1 ? 's' : ''} vencendo em breve
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
              {proximos.map(s => {
                const dias = differenceInDays(new Date(s.proximo_vencimento + 'T00:00:00'), hoje)
                return `${s.tipo_servico} em ${dias}d (${s.cliente?.nome || ''})`
              }).join(', ')}
            </p>
          </div>
        </div>
      )}

      <RecorrentesTable servicos={(servicos || []) as import('@/types').ServicoRecorrente[]} />
    </div>
  )
}
