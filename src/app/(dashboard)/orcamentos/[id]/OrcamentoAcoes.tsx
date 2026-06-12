'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import {
  aprovarOrcamento,
  recusarOrcamento,
  reabrirOrcamento,
  excluirOrcamento,
} from '../actions'

interface Props {
  id: string
  status: string
  jaAprovado: boolean
}

export default function OrcamentoAcoes({ id, status, jaAprovado }: Props) {
  const router = useRouter()
  const [loadingAcao, setLoadingAcao] = useState<string | null>(null)
  const [confirmAprovar, setConfirmAprovar] = useState(false)
  const [confirmRecusar, setConfirmRecusar] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState(false)

  const handleAprovar = async () => {
    setLoadingAcao('aprovar')
    try {
      const servicoId = await aprovarOrcamento(id)
      toast.success('Orçamento aprovado e serviço criado!')
      router.push(`/servicos/${servicoId}`)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao aprovar')
    } finally {
      setLoadingAcao(null)
      setConfirmAprovar(false)
    }
  }

  const handleRecusar = async () => {
    setLoadingAcao('recusar')
    try {
      await recusarOrcamento(id)
      toast.success('Orçamento marcado como recusado.')
      router.refresh()
    } catch {
      toast.error('Erro ao recusar.')
    } finally {
      setLoadingAcao(null)
      setConfirmRecusar(false)
    }
  }

  const handleReabrir = async () => {
    setLoadingAcao('reabrir')
    try {
      await reabrirOrcamento(id)
      toast.success('Orçamento reaberto.')
      router.refresh()
    } catch {
      toast.error('Erro ao reabrir.')
    } finally {
      setLoadingAcao(null)
    }
  }

  const handleExcluir = async () => {
    setLoadingAcao('excluir')
    try {
      await excluirOrcamento(id)
      toast.success('Orçamento excluído.')
      router.push('/orcamentos')
    } catch {
      toast.error('Erro ao excluir.')
      setLoadingAcao(null)
      setConfirmExcluir(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Ações
        </h3>
        <div className="flex flex-wrap gap-2">
          {!jaAprovado && status !== 'aprovado' && status !== 'recusado' && (
            <>
              <Button
                onClick={() => setConfirmAprovar(true)}
                loading={loadingAcao === 'aprovar'}
                className="bg-green-600 hover:bg-green-700 focus:ring-green-400"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar e criar serviço
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmRecusar(true)}
                loading={loadingAcao === 'recusar'}
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
              >
                <XCircle className="w-4 h-4" />
                Marcar como recusado
              </Button>
            </>
          )}

          {(status === 'recusado' || status === 'expirado') && (
            <Button
              variant="outline"
              onClick={handleReabrir}
              loading={loadingAcao === 'reabrir'}
            >
              <RotateCcw className="w-4 h-4" />
              Reabrir orçamento
            </Button>
          )}

          {!jaAprovado && (
            <Button
              variant="outline"
              onClick={() => setConfirmExcluir(true)}
              loading={loadingAcao === 'excluir'}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmAprovar}
        onClose={() => setConfirmAprovar(false)}
        onConfirm={handleAprovar}
        title="Aprovar orçamento?"
        message="Será criado automaticamente um serviço em andamento vinculado a este orçamento. Esta ação não pode ser desfeita."
        confirmLabel="Sim, aprovar"
        loading={loadingAcao === 'aprovar'}
      />

      <ConfirmDialog
        isOpen={confirmRecusar}
        onClose={() => setConfirmRecusar(false)}
        onConfirm={handleRecusar}
        title="Marcar como recusado?"
        message="O orçamento será arquivado como recusado. Você poderá reabri-lo depois se mudar de ideia."
        confirmLabel="Sim, recusar"
        loading={loadingAcao === 'recusar'}
      />

      <ConfirmDialog
        isOpen={confirmExcluir}
        onClose={() => setConfirmExcluir(false)}
        onConfirm={handleExcluir}
        title="Excluir orçamento?"
        message="Esta ação é permanente. Todos os itens deste orçamento serão excluídos."
        confirmLabel="Sim, excluir"
        loading={loadingAcao === 'excluir'}
      />
    </>
  )
}
