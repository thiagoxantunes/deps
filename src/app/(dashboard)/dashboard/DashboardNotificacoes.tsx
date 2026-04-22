'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DollarSign, RefreshCw, AlertTriangle, Clock, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@/utils/cn'
import WhatsAppModal from '@/components/ui/WhatsAppModal'

export interface PagamentoPendente {
  id: string
  tipo_servico: string
  valor: number | null
  data_conclusao: string | null
  cliente: { id: string; nome: string; telefone: string } | null
  veiculo: { placa: string } | null
}

export interface RecorrenteAlerta {
  id: string
  tipo_servico: string
  valor: number | null
  proximo_vencimento: string
  antecedencia_dias: number
  dias: number // negativo = vencido
  cliente: { id: string; nome: string; telefone: string } | null
  veiculo: { placa: string } | null
}

interface Props {
  pagamentos: PagamentoPendente[]
  recorrentes: RecorrenteAlerta[]
}

interface WhatsAppAlvo {
  cliente: { id: string; nome: string; telefone: string }
  contexto?: {
    tipoServico?: string
    valor?: number
    placa?: string
  }
}

export default function DashboardNotificacoes({ pagamentos, recorrentes }: Props) {
  const [whatsapp, setWhatsapp] = useState<WhatsAppAlvo | null>(null)
  const [mostrarPagamentos, setMostrarPagamentos] = useState(true)
  const [mostrarRecorrentes, setMostrarRecorrentes] = useState(true)

  const temAlgo = pagamentos.length > 0 || recorrentes.length > 0
  if (!temAlgo) return null

  const vencidos = recorrentes.filter(r => r.dias < 0)
  const proximos = recorrentes.filter(r => r.dias >= 0)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Cobranças a Receber ── */}
        {pagamentos.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setMostrarPagamentos(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  Cobranças a Receber
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                  {pagamentos.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/servicos?pagamento_status=a_receber"
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ver todos
                </Link>
                {mostrarPagamentos
                  ? <ChevronUp className="w-4 h-4 text-orange-500" />
                  : <ChevronDown className="w-4 h-4 text-orange-500" />}
              </div>
            </button>

            {mostrarPagamentos && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
                {pagamentos.map(p => {
                  const temTelefone = !!p.cliente?.telefone
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors">
                      <Link href={`/servicos/${p.id}`} className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {p.tipo_servico}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {p.cliente?.nome || '—'}
                          {p.veiculo ? ` • ${p.veiculo.placa}` : ''}
                          {p.data_conclusao
                            ? ` • ${new Date(p.data_conclusao + 'T12:00:00').toLocaleDateString('pt-BR')}`
                            : ''}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.valor != null && (
                          <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            {formatCurrency(p.valor)}
                          </span>
                        )}
                        {temTelefone && (
                          <button
                            onClick={() => setWhatsapp({
                              cliente: p.cliente!,
                              contexto: {
                                tipoServico: p.tipo_servico,
                                valor: p.valor ?? undefined,
                                placa: p.veiculo?.placa,
                              },
                            })}
                            title="Enviar cobrança via WhatsApp"
                            className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Recorrentes com Alerta ── */}
        {recorrentes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setMostrarRecorrentes(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Recorrentes com Alerta
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                  {recorrentes.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/recorrentes"
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ver todos
                </Link>
                {mostrarRecorrentes
                  ? <ChevronUp className="w-4 h-4 text-red-500" />
                  : <ChevronDown className="w-4 h-4 text-red-500" />}
              </div>
            </button>

            {mostrarRecorrentes && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
                {/* Vencidos primeiro */}
                {vencidos.length > 0 && (
                  <div className="px-4 py-2 bg-red-50/60 dark:bg-red-900/10">
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Vencidos ({vencidos.length})
                    </p>
                  </div>
                )}
                {vencidos.map(r => (
                  <RecorrenteRow key={r.id} r={r} onWhatsApp={setWhatsapp} />
                ))}

                {/* Próximos */}
                {proximos.length > 0 && (
                  <div className="px-4 py-2 bg-orange-50/60 dark:bg-orange-900/10">
                    <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Vencendo em breve ({proximos.length})
                    </p>
                  </div>
                )}
                {proximos.map(r => (
                  <RecorrenteRow key={r.id} r={r} onWhatsApp={setWhatsapp} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp Modal */}
      {whatsapp && (
        <WhatsAppModal
          isOpen={!!whatsapp}
          onClose={() => setWhatsapp(null)}
          cliente={whatsapp.cliente}
          contexto={whatsapp.contexto}
        />
      )}
    </>
  )
}

function RecorrenteRow({
  r,
  onWhatsApp,
}: {
  r: RecorrenteAlerta
  onWhatsApp: (alvo: WhatsAppAlvo) => void
}) {
  const vencido = r.dias < 0
  const temTelefone = !!r.cliente?.telefone

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
      <Link href={`/recorrentes`} className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {r.tipo_servico}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {r.cliente?.nome || '—'}
          {r.veiculo ? ` • ${r.veiculo.placa}` : ''}
        </p>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          vencido
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
        }`}>
          {vencido ? `Venceu há ${Math.abs(r.dias)}d` : `Vence em ${r.dias}d`}
        </span>
        {r.valor != null && (
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {formatCurrency(r.valor)}
          </span>
        )}
        {temTelefone && (
          <button
            onClick={() => onWhatsApp({
              cliente: r.cliente!,
              contexto: {
                tipoServico: r.tipo_servico,
                valor: r.valor ?? undefined,
                placa: r.veiculo?.placa,
              },
            })}
            title="Notificar via WhatsApp"
            className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
