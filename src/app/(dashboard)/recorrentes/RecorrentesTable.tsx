'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Pencil, Trash2, RefreshCw, Play, Pause, CheckCircle2,
  Clock, AlertTriangle, Calendar, Car, User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ConfirmComSenhaDialog from '@/components/ui/ConfirmComSenhaDialog'
import toast from 'react-hot-toast'
import { format, differenceInDays, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency, PERIODICIDADE_LABELS, PERIODICIDADE_MESES } from '@/utils/cn'
import type { ServicoRecorrente } from '@/types'

interface RecorrentesTableProps {
  servicos: ServicoRecorrente[]
}

function getUrgencia(proximo: string, antecedencia: number) {
  const dias = differenceInDays(new Date(proximo + 'T00:00:00'), new Date())
  if (dias < 0) return { tipo: 'vencido', dias, cor: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' }
  if (dias <= antecedencia) return { tipo: 'proximo', dias, cor: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' }
  return { tipo: 'ok', dias, cor: 'text-green-600 dark:text-green-400', bg: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' }
}

function UrgenciaBadge({ proximo, antecedencia }: { proximo: string; antecedencia: number }) {
  const { tipo, dias } = getUrgencia(proximo, antecedencia)
  if (tipo === 'vencido') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" />
      Vencido há {Math.abs(dias)}d
    </span>
  )
  if (tipo === 'proximo') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      Vence em {dias}d
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" />
      Em {dias}d
    </span>
  )
}

export default function RecorrentesTable({ servicos: initial }: RecorrentesTableProps) {
  const router = useRouter()
  const [servicos, setServicos] = useState(initial)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [registrando, setRegistrando] = useState<string | null>(null)
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativos' | 'inativos'>('ativos')

  const filtrados = servicos.filter(s => {
    if (filtroAtivo === 'ativos') return s.ativo
    if (filtroAtivo === 'inativos') return !s.ativo
    return true
  })

  const handleToggleAtivo = async (s: ServicoRecorrente) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('servicos_recorrentes')
      .update({ ativo: !s.ativo })
      .eq('id', s.id)

    if (error) {
      toast.error('Erro ao atualizar status.')
    } else {
      setServicos(prev => prev.map(item => item.id === s.id ? { ...item, ativo: !item.ativo } : item))
      toast.success(s.ativo ? 'Serviço pausado.' : 'Serviço reativado.')
    }
  }

  const handleRegistrar = async (s: ServicoRecorrente) => {
    setRegistrando(s.id)
    const supabase = createClient()

    // 1. Cria o serviço real
    const { error: errServico } = await supabase.from('servicos').insert({
      cliente_id: s.cliente_id,
      veiculo_id: s.veiculo_id || null,
      tipo_servico: s.tipo_servico,
      descricao: s.descricao || null,
      valor: s.valor || null,
      data_inicio: new Date().toISOString().split('T')[0],
      status: 'pendente',
      pagamento_status: 'pendente',
    })

    if (errServico) {
      toast.error('Erro ao registrar serviço.')
      setRegistrando(null)
      return
    }

    // 2. Avança próximo vencimento
    const meses = PERIODICIDADE_MESES[s.periodicidade] || 12
    const novoVencimento = addMonths(new Date(s.proximo_vencimento + 'T00:00:00'), meses)
    const novoVencimentoStr = format(novoVencimento, 'yyyy-MM-dd')

    await supabase
      .from('servicos_recorrentes')
      .update({ proximo_vencimento: novoVencimentoStr })
      .eq('id', s.id)

    setServicos(prev => prev.map(item =>
      item.id === s.id ? { ...item, proximo_vencimento: novoVencimentoStr } : item
    ))

    toast.success(`Serviço "${s.tipo_servico}" registrado! Próximo vencimento: ${novoVencimento.toLocaleDateString('pt-BR')}`, { duration: 5000 })
    setRegistrando(null)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('servicos_recorrentes').delete().eq('id', deleteId)
    if (error) {
      toast.error('Erro ao excluir.')
    } else {
      setServicos(prev => prev.filter(s => s.id !== deleteId))
      toast.success('Serviço recorrente excluído.')
    }
    setDeleting(false)
    setDeleteId(null)
  }

  return (
    <>
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['ativos', 'todos', 'inativos'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltroAtivo(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtroAtivo === f
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            {f === 'ativos' ? 'Ativos' : f === 'inativos' ? 'Pausados' : 'Todos'}
          </button>
        ))}
        <span className="ml-auto self-center text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <RefreshCw className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {filtroAtivo === 'ativos' ? 'Nenhum serviço recorrente ativo' : 'Nenhum serviço encontrado'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Cadastre serviços recorrentes para receber alertas de vencimento
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados
            .sort((a, b) => {
              // Ordena: vencidos → próximos → ok
              const diasA = differenceInDays(new Date(a.proximo_vencimento + 'T00:00:00'), new Date())
              const diasB = differenceInDays(new Date(b.proximo_vencimento + 'T00:00:00'), new Date())
              return diasA - diasB
            })
            .map(s => {
              const { bg } = getUrgencia(s.proximo_vencimento, s.antecedencia_dias)
              const isRegistrando = registrando === s.id
              return (
                <div
                  key={s.id}
                  className={`rounded-xl border p-4 transition-all ${bg} ${!s.ativo ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone */}
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-white">{s.tipo_servico}</p>
                        {!s.ativo && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Pausado</span>
                        )}
                        <UrgenciaBadge proximo={s.proximo_vencimento} antecedencia={s.antecedencia_dias} />
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {s.cliente && (
                          <Link href={`/clientes/${s.cliente.id}`} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            <User className="w-3.5 h-3.5" />
                            {s.cliente.nome}
                          </Link>
                        )}
                        {s.veiculo && (
                          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Car className="w-3.5 h-3.5" />
                            {s.veiculo.placa} – {s.veiculo.modelo}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <RefreshCw className="w-3.5 h-3.5" />
                          {PERIODICIDADE_LABELS[s.periodicidade]}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          Vence: {format(new Date(s.proximo_vencimento + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {s.valor && (
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {formatCurrency(s.valor)}
                          </span>
                        )}
                      </div>

                      {s.descricao && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.descricao}</p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      {s.ativo && (
                        <button
                          onClick={() => handleRegistrar(s)}
                          disabled={isRegistrando}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                          title="Registrar serviço e avançar vencimento"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isRegistrando ? 'Registrando...' : 'Registrar'}
                        </button>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleAtivo(s)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          title={s.ativo ? 'Pausar' : 'Reativar'}
                        >
                          {s.ativo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <Link href={`/recorrentes/${s.id}/editar`}>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      <ConfirmComSenhaDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir serviço recorrente"
        message="Isso removerá o serviço recorrente permanentemente. Os serviços já registrados não serão afetados. Digite sua senha para confirmar."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </>
  )
}
