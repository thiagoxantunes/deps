import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, User, Car as CarIcon, Calendar, FileText } from 'lucide-react'
import { formatCurrency, ORCAMENTO_STATUS_LABELS, ORCAMENTO_STATUS_COLORS } from '@/utils/cn'
import Button from '@/components/ui/Button'
import OrcamentoAcoes from './OrcamentoAcoes'
import OrcamentoPDFButton from './OrcamentoPDFButton'

export default async function OrcamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: orcamento } = await supabase
    .from('orcamentos')
    .select(`
      *,
      cliente:clientes(id, nome, telefone, email, cpf_cnpj, endereco),
      veiculo:veiculos(id, placa, modelo, marca),
      itens:orcamento_itens(id, descricao, valor, ordem),
      servico:servicos(id, tipo_servico, status)
    `)
    .eq('id', id)
    .single()

  if (!orcamento) notFound()

  const itens = (orcamento.itens || []).sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem)
  const hoje = new Date().toISOString().split('T')[0]
  const expirado = orcamento.validade && orcamento.validade < hoje && orcamento.status === 'enviado'
  const statusEfetivo = expirado ? 'expirado' : orcamento.status
  const podeEditar = ['rascunho', 'enviado'].includes(orcamento.status)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/orcamentos" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Orçamento #{String(orcamento.numero).padStart(4, '0')}
              </h1>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${ORCAMENTO_STATUS_COLORS[statusEfetivo]}`}>
                {ORCAMENTO_STATUS_LABELS[statusEfetivo]}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Criado em {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {podeEditar && (
            <Link href={`/orcamentos/${id}/editar`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
            </Link>
          )}
          <OrcamentoPDFButton
            orcamento={{
              numero: orcamento.numero,
              status: orcamento.status,
              observacoes: orcamento.observacoes,
              validade: orcamento.validade,
              data_criacao: orcamento.created_at,
              valor_total: orcamento.valor_total,
              itens: itens.map((i: { descricao: string; valor: number }) => ({ descricao: i.descricao, valor: i.valor })),
            }}
            cliente={orcamento.cliente}
            veiculo={orcamento.veiculo}
          />
        </div>
      </div>

      {/* Alerta de aprovação → serviço */}
      {orcamento.servico_id && orcamento.servico && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              ✓ Orçamento aprovado e convertido em serviço
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
              {orcamento.servico.tipo_servico} — {orcamento.servico.status}
            </p>
          </div>
          <Link href={`/servicos/${orcamento.servico_id}`}>
            <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
              <FileText className="w-4 h-4" />
              Ver serviço
            </Button>
          </Link>
        </div>
      )}

      {/* Alerta de expirado */}
      {expirado && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            ⚠ Este orçamento expirou em {new Date(orcamento.validade + 'T12:00:00').toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cliente / Veículo */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              Cliente
            </h3>
            <Link href={`/clientes/${orcamento.cliente?.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400">
              {orcamento.cliente?.nome}
            </Link>
            {orcamento.cliente?.telefone && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{orcamento.cliente.telefone}</p>
            )}
            {orcamento.cliente?.email && (
              <p className="text-xs text-gray-500 mt-0.5">{orcamento.cliente.email}</p>
            )}
            {orcamento.cliente?.cpf_cnpj && (
              <p className="text-xs text-gray-500 mt-0.5">CPF/CNPJ: {orcamento.cliente.cpf_cnpj}</p>
            )}
          </div>

          {orcamento.veiculo && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CarIcon className="w-3.5 h-3.5" />
                Veículo
              </h3>
              <p className="font-semibold text-gray-900 dark:text-white">{orcamento.veiculo.placa}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {orcamento.veiculo.marca} {orcamento.veiculo.modelo}
              </p>
            </div>
          )}

          {orcamento.validade && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Validade
              </h3>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(orcamento.validade + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Itens + valor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Itens do Orçamento</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {itens.map((item: { id: string; descricao: string; valor: number }) => (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-800 dark:text-gray-100">{item.descricao}</span>
                  <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(item.valor)}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-orange-50 dark:bg-orange-900/20 border-t border-orange-200 dark:border-orange-800 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">VALOR TOTAL</span>
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(orcamento.valor_total)}
              </span>
            </div>
          </div>

          {orcamento.observacoes && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Observações / Condições
              </h3>
              <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                {orcamento.observacoes}
              </p>
            </div>
          )}

          {/* Ações */}
          <OrcamentoAcoes
            id={id}
            status={orcamento.status}
            jaAprovado={!!orcamento.servico_id}
          />
        </div>
      </div>
    </div>
  )
}
