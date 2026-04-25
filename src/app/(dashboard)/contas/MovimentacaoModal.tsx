'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRightLeft, X, Check, PlusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Conta { id: string; nome: string; descricao: string | null }

interface Props {
  open: boolean
  onClose: () => void
}

export default function MovimentacaoModal({ open, onClose }: Props) {
  const router = useRouter()
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: '',
    conta_origem_id: '',
    conta_destino_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.from('contas_recebimento').select('id, nome, descricao').eq('ativo', true).order('nome')
      .then(({ data }) => { if (data) setContas(data) })
  }, [open])

  const set = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  const contaLabel = (c: Conta) => c.descricao ? `${c.nome} — ${c.descricao}` : c.nome

  const isTransferencia = !!form.conta_origem_id

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.data) errs.data = 'Data obrigatória'
    if (!form.descricao.trim()) errs.descricao = 'Descrição obrigatória'
    if (!form.valor || isNaN(parseFloat(form.valor.replace(',', '.')))) errs.valor = 'Valor inválido'
    if (!form.conta_destino_id) errs.conta_destino_id = 'Informe a conta de destino'
    if (form.conta_origem_id && form.conta_origem_id === form.conta_destino_id) {
      errs.conta_destino_id = 'Origem e destino não podem ser iguais'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    const supabase = createClient()
    const valor = parseFloat(form.valor.replace(',', '.'))

    const { error } = await supabase.from('movimentacoes').insert({
      data: form.data,
      descricao: form.descricao.trim(),
      valor,
      conta_origem_id: form.conta_origem_id || null,
      conta_destino_id: form.conta_destino_id,
    })

    if (error) {
      toast.error('Erro ao registrar movimentação.')
      setLoading(false)
      return
    }

    toast.success(isTransferencia ? 'Transferência registrada!' : 'Depósito registrado!')
    setForm({ data: new Date().toISOString().split('T')[0], descricao: '', valor: '', conta_origem_id: '', conta_destino_id: '' })
    setErrors({})
    onClose()
    router.refresh()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {isTransferencia ? 'Transferência entre contas' : 'Depósito externo'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isTransferencia
                  ? 'Move saldo entre contas sem afetar o faturamento'
                  : 'Depósito sem origem conta como receita no faturamento'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Data + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data *</label>
              <input
                type="date"
                value={form.data}
                onChange={e => set('data', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.data && <p className="text-xs text-red-500 mt-1">{errors.data}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$) *</label>
              <input
                type="text"
                placeholder="0,00"
                value={form.valor}
                onChange={e => set('valor', e.target.value.replace(/[^0-9,.]/g, ''))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.valor && <p className="text-xs text-red-500 mt-1">{errors.valor}</p>}
            </div>
          </div>

          {/* Conta Origem */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conta de origem <span className="text-gray-400">(opcional — se vazio = depósito externo)</span>
            </label>
            <select
              value={form.conta_origem_id}
              onChange={e => set('conta_origem_id', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhuma (depósito externo)</option>
              {contas.map(c => (
                <option key={c.id} value={c.id}>{contaLabel(c)}</option>
              ))}
            </select>
          </div>

          {/* Seta visual */}
          {isTransferencia && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-xs text-blue-500 font-medium">
                <ArrowRightLeft className="w-4 h-4" />
                transferindo para →
              </div>
            </div>
          )}

          {/* Conta Destino */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conta de destino *
            </label>
            <select
              value={form.conta_destino_id}
              onChange={e => set('conta_destino_id', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.conta_destino_id ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            >
              <option value="">Selecione a conta de destino</option>
              {contas
                .filter(c => c.id !== form.conta_origem_id)
                .map(c => (
                  <option key={c.id} value={c.id}>{contaLabel(c)}</option>
                ))}
            </select>
            {errors.conta_destino_id && <p className="text-xs text-red-500 mt-1">{errors.conta_destino_id}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
            <input
              type="text"
              placeholder={isTransferencia ? 'Ex: Depósito caixa na Stone' : 'Ex: Aporte inicial, Investimento...'}
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.descricao ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>}
          </div>

          {/* Info banner */}
          <div className={`p-3 rounded-xl text-xs ${isTransferencia ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'}`}>
            {isTransferencia
              ? '💡 Transferência: o saldo da conta de origem diminui e o da conta de destino aumenta. Não afeta o faturamento.'
              : '💡 Depósito externo: o valor entrará como receita no faturamento da conta de destino.'}
          </div>

          {/* Ações */}
          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Salvando...' : isTransferencia ? 'Transferir' : 'Registrar depósito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
