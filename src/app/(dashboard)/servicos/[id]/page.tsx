import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, User, Car, Calendar, DollarSign, FileText, Paperclip, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { STATUS_LABELS, STATUS_COLORS, PAGAMENTO_STATUS_LABELS, PAGAMENTO_STATUS_COLORS, formatCurrency } from '@/utils/cn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AnexosSection from './AnexosSection'
import PDFButton from './PDFButton'
import MarcarPagoButton from './MarcarPagoButton'
import MarcarConcluidoButton from './MarcarConcluidoButton'
import ExcluirServicoButton from './ExcluirServicoButton'
import WhatsAppServicoButton from '@/components/ui/WhatsAppServicoButton'

const PAGAMENTO_ICONS = {
  pago: CheckCircle,
  a_receber: Clock,
  pendente: AlertCircle,
}

export default async function ServicoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: servico }, { data: anexos }] = await Promise.all([
    supabase.from('servicos')
      .select('*, cliente:clientes(id, nome, telefone, cpf_cnpj), veiculo:veiculos(id, placa, marca, modelo, ano), conta:contas_recebimento(id, nome)')
      .eq('id', id).single(),
    supabase.from('anexos').select('*').eq('servico_id', id).order('created_at'),
  ])

  if (!servico) notFound()

  const cliente = servico.cliente as { id: string; nome: string; telefone: string; cpf_cnpj: string } | null
  const veiculo = servico.veiculo as { id: string; placa: string; marca: string; modelo: string; ano: number } | null
  const conta = servico.conta as { id: string; nome: string } | null
  const PagIcon = PAGAMENTO_ICONS[servico.pagamento_status as keyof typeof PAGAMENTO_ICONS] || AlertCircle

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/servicos" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{servico.tipo_servico}</h1>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[servico.status]}`}>
                {STATUS_LABELS[servico.status]}
              </span>
            </div>
            {cliente && (
              <Link href={`/clientes/${cliente.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1 block">
                {cliente.nome}
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {cliente && (
            <WhatsAppServicoButton
              cliente={{ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }}
              contexto={{
                servicoId: id,
                tipoServico: servico.tipo_servico,
                valor: servico.valor,
                placa: veiculo?.placa,
                comprovanteUrl: servico.comprovante_url,
              }}
            />
          )}
          {cliente && (
            <PDFButton
              servicoId={id}
              servico={{
                tipo_servico: servico.tipo_servico,
                descricao: servico.descricao,
                data_inicio: servico.data_inicio,
                data_conclusao: servico.data_conclusao,
                status: servico.status,
                valor: servico.valor,
                conta_nome: conta?.nome ?? null,
              }}
              cliente={{
                nome: cliente.nome,
                cpf_cnpj: cliente.cpf_cnpj,
                telefone: cliente.telefone,
              }}
              comprovanteUrl={servico.comprovante_url}
            />
          )}
          <Link href={`/servicos/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
          </Link>
          <ExcluirServicoButton servicoId={id} />
        </div>
      </div>

      {/* Banner: serviço não concluído */}
      {servico.status !== 'concluido' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm">Serviço em andamento</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Marque como concluído quando finalizar o atendimento.
              </p>
            </div>
          </div>
          <MarcarConcluidoButton servicoId={id} />
        </div>
      )}

      {/* Alerta de pagamento pendente */}
      {servico.pagamento_status === 'a_receber' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-800 dark:text-orange-200 text-sm">Pagamento pendente</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Cliente ainda não efetuou o pagamento
                {servico.valor ? ` de ${formatCurrency(servico.valor)}` : ''}.
              </p>
            </div>
          </div>
          <MarcarPagoButton servicoId={id} />
        </div>
      )}

      {servico.pagamento_status === 'pago' && servico.status === 'concluido' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Serviço concluído e pagamento recebido
            {servico.valor ? ` — ${formatCurrency(servico.valor)}` : ''}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-4">Informações</CardTitle>
            <div className="space-y-4">
              {cliente && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
                    <Link href={`/clientes/${cliente.id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {cliente.nome}
                    </Link>
                  </div>
                </div>
              )}
              {veiculo && (
                <div className="flex items-start gap-3">
                  <Car className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Veículo</p>
                    <Link href={`/veiculos/${veiculo.id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {veiculo.placa} — {veiculo.marca} {veiculo.modelo} {veiculo.ano}
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Período</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(new Date(servico.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                    {servico.data_conclusao
                      ? ` → ${format(new Date(servico.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}`
                      : ' → Em aberto'}
                  </p>
                </div>
              </div>

              {/* Pagamento */}
              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Financeiro</p>
                  {servico.valor ? (
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(servico.valor)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sem valor</p>
                  )}
                  {conta && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {conta.nome}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${PAGAMENTO_STATUS_COLORS[servico.pagamento_status]}`}>
                      <PagIcon className="w-3.5 h-3.5" />
                      {PAGAMENTO_STATUS_LABELS[servico.pagamento_status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Descrição e Anexos */}
        <div className="lg:col-span-2 space-y-6">
          {servico.descricao && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <CardTitle>Descrição</CardTitle>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {servico.descricao}
              </p>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <CardTitle>Anexos do Serviço</CardTitle>
            </div>
            <AnexosSection servicoId={id} anexos={anexos || []} />
          </Card>
        </div>
      </div>
    </div>
  )
}
