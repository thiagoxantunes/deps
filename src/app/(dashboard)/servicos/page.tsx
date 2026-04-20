import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, TrendingDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import ServicosTable from './ServicosTable'

export default async function ServicosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tipo?: string; ano?: string; mes?: string; dia?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('servicos')
    .select('*, cliente:clientes(id, nome), veiculo:veiculos(placa, modelo)')
    .order('data_inicio', { ascending: false })

  if (params.q) {
    query = query.or(`tipo_servico.ilike.%${params.q}%,descricao.ilike.%${params.q}%`)
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.tipo) {
    query = query.eq('tipo_servico', params.tipo)
  }

  // Cascading date filter: ano → mes → dia
  if (params.ano && params.mes && params.dia) {
    const d = `${params.ano}-${params.mes.padStart(2, '0')}-${params.dia.padStart(2, '0')}`
    query = query.eq('data_inicio', d)
  } else if (params.ano && params.mes) {
    const start = `${params.ano}-${params.mes.padStart(2, '0')}-01`
    const lastDay = new Date(Number(params.ano), Number(params.mes), 0).getDate()
    const end = `${params.ano}-${params.mes.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('data_inicio', start).lte('data_inicio', end)
  } else if (params.ano) {
    query = query.gte('data_inicio', `${params.ano}-01-01`).lte('data_inicio', `${params.ano}-12-31`)
  }

  const { data: servicos } = await query

  // Build human-readable date label for subtitle
  const MESES_LABEL = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  let dateLabel = ''
  if (params.ano && params.mes && params.dia) {
    dateLabel = ` em ${params.dia.padStart(2, '0')}/${params.mes.padStart(2, '0')}/${params.ano}`
  } else if (params.ano && params.mes) {
    dateLabel = ` em ${MESES_LABEL[Number(params.mes)]}/${params.ano}`
  } else if (params.ano) {
    dateLabel = ` em ${params.ano}`
  }

  const total = servicos?.length || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-orange-500" />
            Serviços
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} serviço{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}{dateLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/saidas/nova">
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
              <TrendingDown className="w-4 h-4" />
              Registrar Saída
            </Button>
          </Link>
          <Link href="/servicos/novo">
            <Button>
              <Plus className="w-4 h-4" />
              Novo Serviço
            </Button>
          </Link>
        </div>
      </div>
      <ServicosTable
        servicos={servicos || []}
        searchQuery={params.q || ''}
        statusFilter={params.status || ''}
        tipoFilter={params.tipo || ''}
        anoFilter={params.ano || ''}
        mesFilter={params.mes || ''}
        diaFilter={params.dia || ''}
      />
    </div>
  )
}
