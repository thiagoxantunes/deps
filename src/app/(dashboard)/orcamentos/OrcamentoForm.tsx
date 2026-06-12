'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import SearchableSelect from '@/components/ui/SearchableSelect'
import NovoClienteRapidoModal from '@/components/ui/NovoClienteRapidoModal'
import { Plus, Trash2, UserPlus, Calendar, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/utils/cn'
import { criarOrcamento, atualizarOrcamento } from './actions'
import type { Orcamento, OrcamentoItem } from '@/types'

interface OrcamentoFormProps {
  orcamento?: Orcamento & { itens: OrcamentoItem[] }
}

interface ItemForm {
  descricao: string
  valor: string // mantido como string no form, convertido na hora de salvar
}

export default function OrcamentoForm({ orcamento }: OrcamentoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [salvarComoLoading, setSalvarComoLoading] = useState<'rascunho' | 'enviado' | null>(null)
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [veiculos, setVeiculos] = useState<{ id: string; placa: string; modelo: string }[]>([])
  const [modalClienteOpen, setModalClienteOpen] = useState(false)

  const [form, setForm] = useState({
    cliente_id: orcamento?.cliente_id || '',
    veiculo_id: orcamento?.veiculo_id || '',
    observacoes: orcamento?.observacoes || '',
    validade: orcamento?.validade || '',
  })

  const [itens, setItens] = useState<ItemForm[]>(
    orcamento?.itens && orcamento.itens.length > 0
      ? orcamento.itens.map(i => ({ descricao: i.descricao, valor: String(i.valor) }))
      : [{ descricao: '', valor: '' }]
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.from('clientes').select('id, nome').order('nome').then(({ data }) => {
      if (data) setClientes(data)
    })
  }, [])

  useEffect(() => {
    if (!form.cliente_id) { setVeiculos([]); return }
    const supabase = createClient()
    supabase.from('veiculos').select('id, placa, modelo').eq('cliente_id', form.cliente_id).then(({ data }) => {
      if (data) setVeiculos(data)
    })
  }, [form.cliente_id])

  const handleClienteCriado = (novo: { id: string; nome: string }) => {
    setClientes(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
    setForm(prev => ({ ...prev, cliente_id: novo.id, veiculo_id: '' }))
  }

  const setField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const addItem = () => {
    setItens(prev => [...prev, { descricao: '', valor: '' }])
  }

  const removeItem = (idx: number) => {
    if (itens.length === 1) return
    setItens(prev => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: 'descricao' | 'valor', value: string) => {
    setItens(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
    if (errors[`item_${idx}_${field}`]) {
      setErrors(prev => ({ ...prev, [`item_${idx}_${field}`]: '' }))
    }
  }

  const parseValor = (s: string) => {
    const n = parseFloat(s.replace(/[^0-9,.]/g, '').replace(',', '.'))
    return isNaN(n) ? 0 : n
  }

  const total = itens.reduce((sum, it) => sum + parseValor(it.valor), 0)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.cliente_id) errs.cliente_id = 'Selecione um cliente'
    const itensValidos = itens.filter(it => it.descricao.trim() && parseValor(it.valor) > 0)
    if (itensValidos.length === 0) errs.itens = 'Adicione pelo menos um item com descrição e valor'
    itens.forEach((it, i) => {
      if (it.descricao.trim() && parseValor(it.valor) <= 0) {
        errs[`item_${i}_valor`] = 'Valor inválido'
      }
      if (!it.descricao.trim() && parseValor(it.valor) > 0) {
        errs[`item_${i}_descricao`] = 'Descreva o item'
      }
    })
    return errs
  }

  const handleSalvar = async (status: 'rascunho' | 'enviado') => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setSalvarComoLoading(status)
    try {
      const payload = {
        cliente_id: form.cliente_id,
        veiculo_id: form.veiculo_id || null,
        observacoes: form.observacoes.trim() || null,
        validade: form.validade || null,
        status,
        itens: itens
          .filter(it => it.descricao.trim() && parseValor(it.valor) > 0)
          .map(it => ({ descricao: it.descricao.trim(), valor: parseValor(it.valor) })),
      }

      if (orcamento) {
        await atualizarOrcamento(orcamento.id, payload)
        toast.success('Orçamento atualizado!')
        router.push(`/orcamentos/${orcamento.id}`)
      } else {
        const novoId = await criarOrcamento(payload)
        toast.success(status === 'rascunho' ? 'Rascunho salvo!' : 'Orçamento criado!')
        router.push(`/orcamentos/${novoId}`)
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar orçamento. Tente novamente.')
    } finally {
      setLoading(false)
      setSalvarComoLoading(null)
    }
  }

  return (
    <>
      <NovoClienteRapidoModal
        isOpen={modalClienteOpen}
        onClose={() => setModalClienteOpen(false)}
        onClienteCriado={handleClienteCriado}
      />

      <form onSubmit={e => { e.preventDefault(); handleSalvar('enviado') }} className="space-y-6">
        {/* Cliente / Veículo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cliente *
                </label>
                <button
                  type="button"
                  onClick={() => setModalClienteOpen(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Cadastrar novo
                </button>
              </div>
              <SearchableSelect
                options={clientes.map(c => ({ value: c.id, label: c.nome }))}
                value={form.cliente_id}
                onChange={val => { setField('cliente_id', val); setField('veiculo_id', '') }}
                placeholder="Selecione o cliente"
                error={errors.cliente_id}
              />
            </div>

            <Select
              id="veiculo_id"
              label="Veículo (opcional)"
              value={form.veiculo_id}
              onChange={e => setField('veiculo_id', e.target.value)}
              options={veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }))}
              placeholder={form.cliente_id ? 'Selecione o veículo' : 'Selecione um cliente primeiro'}
              disabled={!form.cliente_id}
            />
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Itens do Orçamento *</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar item
            </button>
          </div>

          {errors.itens && <p className="text-xs text-red-500">{errors.itens}</p>}

          <div className="space-y-3">
            {itens.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20">
                <div className="col-span-12 sm:col-span-7">
                  <Input
                    id={`desc_${idx}`}
                    placeholder="Ex: Recurso de multa, Transferência de veículo..."
                    value={item.descricao}
                    onChange={e => updateItem(idx, 'descricao', e.target.value)}
                    error={errors[`item_${idx}_descricao`]}
                  />
                </div>
                <div className="col-span-10 sm:col-span-4">
                  <Input
                    id={`valor_${idx}`}
                    type="text"
                    placeholder="R$ 0,00"
                    value={item.valor}
                    onChange={e => updateItem(idx, 'valor', e.target.value.replace(/[^0-9,.]/g, ''))}
                    error={errors[`item_${idx}_valor`]}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-start pt-1.5">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={itens.length === 1}
                    title="Remover item"
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">VALOR TOTAL</span>
            </div>
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Validade + Observações */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Detalhes</h2>

          <div>
            <Input
              id="validade"
              type="date"
              label={
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Validade do orçamento (opcional)
                </span>
              }
              value={form.validade}
              onChange={e => setField('validade', e.target.value)}
              hint="Data até quando esta proposta é válida"
            />
          </div>

          <Textarea
            id="observacoes"
            label="Observações / Condições"
            placeholder="Ex: Pagamento em até 3x sem juros, prazo de entrega 5 dias úteis..."
            value={form.observacoes}
            onChange={e => setField('observacoes', e.target.value)}
            rows={4}
          />
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSalvar('rascunho')}
            loading={salvarComoLoading === 'rascunho'}
            disabled={loading && salvarComoLoading !== 'rascunho'}
          >
            Salvar rascunho
          </Button>
          <Button
            type="submit"
            loading={salvarComoLoading === 'enviado'}
            disabled={loading && salvarComoLoading !== 'enviado'}
          >
            {orcamento ? 'Salvar alterações' : 'Criar orçamento'}
          </Button>
        </div>
      </form>
    </>
  )
}
