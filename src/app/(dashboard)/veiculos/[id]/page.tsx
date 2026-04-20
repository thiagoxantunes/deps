import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Car, FileText, Plus, FolderOpen, Archive, ArrowRightLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { STATUS_LABELS, STATUS_COLORS, formatCurrency } from '@/utils/cn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DocumentosSection from '@/components/ui/DocumentosSection'

export default async function VeiculoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: veiculo }, { data: servicos }, { data: documentos }] = await Promise.all([
    supabase.from('veiculos').select('*, cliente:clientes(id, nome)').eq('id', id).single(),
    supabase.from('servicos').select('*').eq('veiculo_id', id).order('created_at', { ascending: false }),
    supabase.from('documentos').select('*').eq('veiculo_id', id).order('created_at', { ascending: false }),
  ])

  if (!veiculo) notFound()

  const cliente = veiculo.cliente as { id: string; nome: string } | null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/veiculos" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{veiculo.placa}</h1>
            <p className="text-gray-500 dark:text-gray-400">{veiculo.marca} {veiculo.modelo} • {veiculo.ano}</p>
          </div>
        </div>
        <Link href={`/veiculos/${id}/editar`}>
          <Button variant="outline" size="sm">
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardTitle className="mb-4">Informações do Veículo</CardTitle>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Tipo', value: veiculo.tipo === 'carro' ? 'Carro' : 'Moto' },
              { label: 'Placa', value: veiculo.placa, mono: true },
              { label: 'RENAVAM', value: veiculo.renavam, mono: true },
              { label: 'Marca', value: veiculo.marca },
              { label: 'Modelo', value: veiculo.modelo },
              { label: 'Ano', value: String(veiculo.ano) },
              { label: 'Cor', value: veiculo.cor || '—' },
            ].map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className={`font-medium text-gray-900 dark:text-white ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
              </div>
            ))}
            {cliente && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Proprietário</span>
                <Link href={`/clientes/${cliente.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  {cliente.nome}
                </Link>
              </div>
            )}
          </div>
          {veiculo.status_veiculo && veiculo.status_veiculo !== 'ativo' && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className={`flex items-start gap-2 p-3 rounded-lg ${
                veiculo.status_veiculo === 'transferido'
                  ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                  : 'bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
              }`}>
                {veiculo.status_veiculo === 'transferido'
                  ? <ArrowRightLeft className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  : <Archive className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {veiculo.status_veiculo === 'transferido' ? 'Transferido / Vendido' : 'Veículo Antigo'}
                  </p>
                  {veiculo.data_alteracao_status && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      em {format(new Date(veiculo.data_alteracao_status), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                  {veiculo.obs_status && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{veiculo.obs_status}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {veiculo.observacoes && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observações</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{veiculo.observacoes}</p>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Serviços do Veículo</CardTitle>
              <Link href={`/servicos/novo?veiculo_id=${id}&cliente_id=${cliente?.id || ''}`}>
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                  Novo Serviço
                </Button>
              </Link>
            </CardHeader>
            {!servicos?.length ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum serviço para este veículo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {servicos.map((s: Record<string, unknown>) => (
                  <Link key={s.id as string} href={`/servicos/${s.id}`}>
                    <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 dark:text-white">{s.tipo_servico as string}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status as string]}`}>
                            {STATUS_LABELS[s.status as string]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {format(new Date(s.data_inicio as string), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {s.valor ? (
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {formatCurrency(s.valor as number)}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Documentos do veículo */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              <CardTitle>Documentos do Veículo</CardTitle>
            </div>
            <DocumentosSection
              veiculoId={id}
              documentos={(documentos || []) as import('@/types').Documento[]}
              titulo="CRV, CRLV, laudos, etc."
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
