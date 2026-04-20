import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Phone, Mail, MapPin, FileText, Car, Plus, FolderOpen, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { TAG_COLORS, TAG_LABELS, STATUS_LABELS, STATUS_COLORS, formatCurrency } from '@/utils/cn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DocumentosSection from '@/components/ui/DocumentosSection'
import WhatsAppClienteButton from '@/components/ui/WhatsAppClienteButton'

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: cliente }, { data: veiculos }, { data: servicos }, { data: documentos }] = await Promise.all([
    supabase.from('clientes').select('*').eq('id', id).single(),
    supabase.from('veiculos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
    supabase.from('servicos').select('*, veiculo:veiculos(placa, modelo)')
      .eq('cliente_id', id).order('created_at', { ascending: false }),
    supabase.from('documentos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
  ])

  if (!cliente) notFound()

  const pendencias = [
    ...(!cliente.telefone ? ['Telefone'] : []),
    ...(!cliente.cpf_cnpj ? ['CPF / CNPJ'] : []),
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/clientes" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cliente.nome}</h1>
              {(cliente.tags || []).map((tag: string) => (
                <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-medium ${TAG_COLORS[tag]}`}>
                  {TAG_LABELS[tag]}
                </span>
              ))}
            </div>
            {cliente.cpf_cnpj ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cliente.cpf_cnpj}</p>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full font-medium mt-1">
                <AlertTriangle className="w-3 h-3" />
                CPF / CNPJ pendente
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {cliente.whatsapp && (
            <WhatsAppClienteButton
              cliente={{ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }}
            />
          )}
          <Link href={`/clientes/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerta de dados pendentes */}
      {pendencias.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Cadastro incompleto
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
              Falta preencher: <strong>{pendencias.join(' e ')}</strong>.{' '}
              <Link href={`/clientes/${id}/editar`} className="underline hover:no-underline">
                Completar cadastro
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardTitle className="mb-4">Informações</CardTitle>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Telefone</p>
                  {cliente.telefone ? (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{cliente.telefone}</p>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Pendente
                    </span>
                  )}
                </div>
              </div>
              {cliente.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">E-mail</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{cliente.email}</p>
                  </div>
                </div>
              )}
              {cliente.endereco && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Endereço</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{cliente.endereco}</p>
                  </div>
                </div>
              )}
              {cliente.observacoes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Observações</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{cliente.observacoes}</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              Cadastrado em {format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </Card>

          {/* Stats */}
          <Card>
            <CardTitle className="mb-4">Resumo</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{veiculos?.length || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Veículos</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{servicos?.length || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Serviços</p>
              </div>
              <div className="col-span-2 text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency((servicos || []).reduce((s: number, v: { valor: number }) => s + (v.valor || 0), 0))}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total pago</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Veículos */}
          <Card>
            <CardHeader>
              <CardTitle>Veículos</CardTitle>
              <Link href={`/veiculos/novo?cliente_id=${id}`}>
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </Link>
            </CardHeader>
            {!veiculos?.length ? (
              <div className="text-center py-8 text-gray-400">
                <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum veículo cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {veiculos.map((v: Record<string, unknown>) => (
                  <Link key={v.id as string} href={`/veiculos/${v.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 dark:text-white">{v.marca as string} {v.modelo as string}</p>
                          {(v.status_veiculo as string) && (v.status_veiculo as string) !== 'ativo' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              v.status_veiculo === 'transferido'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {v.status_veiculo === 'transferido' ? 'Transferido' : 'Antigo'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{v.placa as string} • {v.ano as number} • {v.tipo as string}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Histórico de serviços */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Serviços</CardTitle>
              <Link href={`/servicos/novo?cliente_id=${id}`}>
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                  Novo Serviço
                </Button>
              </Link>
            </CardHeader>
            {!servicos?.length ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum serviço cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {servicos.map((s: Record<string, unknown>) => {
                  const veiculo = s.veiculo as { placa: string; modelo: string } | null
                  return (
                    <Link key={s.id as string} href={`/servicos/${s.id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900 dark:text-white">{s.tipo_servico as string}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status as string]}`}>
                              {STATUS_LABELS[s.status as string]}
                            </span>
                          </div>
                          {veiculo && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{veiculo.placa} • {veiculo.modelo}</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {format(new Date(s.data_inicio as string), "dd/MM/yyyy", { locale: ptBR })}
                            {s.data_conclusao ? ` → ${format(new Date(s.data_conclusao as string), "dd/MM/yyyy", { locale: ptBR })}` : ''}
                          </p>
                        </div>
                        {s.valor ? (
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {formatCurrency(s.valor as number)}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Documentos do cliente */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              <CardTitle>Documentos do Cliente</CardTitle>
            </div>
            <DocumentosSection
              clienteId={id}
              documentos={(documentos || []) as import('@/types').Documento[]}
              titulo="Documentos pessoais (RG, CPF, CNH, etc.)"
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
