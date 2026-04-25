'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { TIPOS_SERVICO } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { Servico } from '@/types'
import { CheckCircle, Clock, DollarSign, AlertCircle, UserPlus } from 'lucide-react'
import NovoClienteRapidoModal from '@/components/ui/NovoClienteRapidoModal'
import { revalidarServicos } from './actions'

interface ServicoFormProps {
  servico?: Servico
  clienteId?: string
  veiculoId?: string
}

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
]


export default function ServicoForm({ servico, clienteId, veiculoId }: ServicoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [veiculos, setVeiculos] = useState<{ id: string; placa: string; modelo: string }[]>([])
  const [modalClienteOpen, setModalClienteOpen] = useState(false)
  const [contas, setContas] = useState<{ id: string; nome: string; descricao: string | null }[]>([])
  const [form, setForm] = useState({
    cliente_id: servico?.cliente_id || clienteId || '',
    veiculo_id: servico?.veiculo_id || veiculoId || '',
    tipo_servico: servico?.tipo_servico || '',
    descricao: servico?.descricao || '',
    data_inicio: servico?.data_inicio || new Date().toISOString().split('T')[0],
    data_conclusao: servico?.data_conclusao || '',
    status: servico?.status || 'pendente',
    pagamento_status: servico?.pagamento_status || 'pendente',
    valor: servico?.valor ? String(servico.valor) : '',
    conta_id: (servico as unknown as { conta_id?: string })?.conta_id || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tipoCustom, setTipoCustom] = useState(
    servico?.tipo_servico && !TIPOS_SERVICO.includes(servico.tipo_servico) ? servico.tipo_servico : ''
  )
  const [isCustomTipo, setIsCustomTipo] = useState(
    servico?.tipo_servico ? !TIPOS_SERVICO.includes(servico.tipo_servico) : false
  )

  const carregarClientes = () => {
    const supabase = createClient()
    supabase.from('clientes').select('id, nome').order('nome').then(({ data }) => {
      if (data) setClientes(data)
    })
  }

  useEffect(() => {
    carregarClientes()
    const supabase = createClient()
    supabase.from('contas_recebimento').select('id, nome, descricao').eq('ativo', true).order('nome')
      .then(({ data }) => { if (data) setContas(data) })
  }, [])

  const handleClienteCriado = (novo: { id: string; nome: string }) => {
    setClientes(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
    setForm(prev => ({ ...prev, cliente_id: novo.id, veiculo_id: '' }))
  }

  useEffect(() => {
    if (!form.cliente_id) { setVeiculos([]); return }
    const supabase = createClient()
    supabase.from('veiculos').select('id, placa, modelo').eq('cliente_id', form.cliente_id).then(({ data }) => {
      if (data) setVeiculos(data)
    })
  }, [form.cliente_id])

  const set = (field: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'status' && value === 'concluido') {
        // Auto-preenche data_conclusao com hoje se ainda não preenchida
        if (!prev.data_conclusao) {
          next.data_conclusao = new Date().toISOString().split('T')[0]
        }
        // Sugere "a_receber" se tinha valor e ainda não tinha status de pagamento definido
        if (prev.pagamento_status === 'pendente' && prev.valor) {
          next.pagamento_status = 'a_receber'
        }
      }
      return next
    })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.cliente_id) errs.cliente_id = 'Selecione um cliente'
    if (!form.tipo_servico && !tipoCustom) errs.tipo_servico = 'Tipo de serviço é obrigatório'
    if (!form.data_inicio) errs.data_inicio = 'Data de início é obrigatória'
    if ((form.status === 'concluido' || form.pagamento_status === 'pago') && !form.conta_id) {
      errs.conta_id = 'Informe a forma de recebimento para concluir o serviço'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    const supabase = createClient()

    const tipoFinal = isCustomTipo ? tipoCustom : form.tipo_servico
    const valorNum = form.valor ? parseFloat(form.valor.replace(',', '.')) : null

    const data = {
      cliente_id: form.cliente_id,
      veiculo_id: form.veiculo_id || null,
      tipo_servico: tipoFinal,
      descricao: form.descricao.trim() || null,
      data_inicio: form.data_inicio,
      data_conclusao: form.data_conclusao || null,
      status: form.status,
      pagamento_status: form.pagamento_status,
      valor: valorNum,
      forma_pagamento: null,
      conta_id: form.conta_id || null,
    }

    if (servico) {
      const { error } = await supabase.from('servicos').update(data).eq('id', servico.id)
      if (error) {
        console.error('Erro ao atualizar serviço:', error)
        toast.error(`Erro ao atualizar serviço: ${error.message}`)
        setLoading(false)
        return
      }
      toast.success('Serviço atualizado!')
      await revalidarServicos()
      router.push(`/servicos/${servico.id}`)
    } else {
      const { data: novo, error } = await supabase.from('servicos').insert(data).select().single()
      if (error) {
        console.error('Erro ao cadastrar serviço:', error)
        toast.error(`Erro ao cadastrar serviço: ${error.message}`)
        setLoading(false)
        return
      }
      toast.success('Serviço cadastrado!')
      await revalidarServicos()
      router.push(`/servicos/${novo.id}`)
    }
    router.refresh()
  }

  const temValor = !!form.valor && parseFloat(form.valor.replace(',', '.')) > 0

  return (
    <>
    <NovoClienteRapidoModal
      isOpen={modalClienteOpen}
      onClose={() => setModalClienteOpen(false)}
      onClienteCriado={handleClienteCriado}
    />

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vínculo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Vínculo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            <select
              id="cliente_id"
              value={form.cliente_id}
              onChange={e => { set('cliente_id', e.target.value); set('veiculo_id', '') }}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.cliente_id ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            >
              <option value="">Selecione o cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {errors.cliente_id && <p className="text-xs text-red-500">{errors.cliente_id}</p>}
          </div>

          <Select
            id="veiculo_id"
            label="Veículo (opcional)"
            value={form.veiculo_id}
            onChange={e => set('veiculo_id', e.target.value)}
            options={veiculos.map(v => ({ value: v.id, label: `${v.placa} - ${v.modelo}` }))}
            placeholder={form.cliente_id ? 'Selecione o veículo' : 'Selecione um cliente primeiro'}
            disabled={!form.cliente_id}
          />
        </div>
      </div>

      {/* Tipo e descrição */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Serviço</h2>

        {!isCustomTipo ? (
          <Select
            id="tipo_servico"
            label="Tipo de serviço *"
            value={form.tipo_servico}
            onChange={e => {
              if (e.target.value === '__custom__') {
                setIsCustomTipo(true)
                set('tipo_servico', '')
              } else {
                set('tipo_servico', e.target.value)
              }
            }}
            options={[
              ...TIPOS_SERVICO.map(t => ({ value: t, label: t })),
              { value: '__custom__', label: '+ Outro (personalizado)' },
            ]}
            placeholder="Selecione o tipo"
            error={errors.tipo_servico}
          />
        ) : (
          <div className="space-y-2">
            <Input
              id="tipo_custom"
              label="Tipo personalizado *"
              placeholder="Descreva o tipo de serviço"
              value={tipoCustom}
              onChange={e => setTipoCustom(e.target.value)}
              error={errors.tipo_servico}
            />
            <button
              type="button"
              onClick={() => { setIsCustomTipo(false); setTipoCustom('') }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Voltar para lista
            </button>
          </div>
        )}

        <Textarea
          id="descricao"
          label="Descrição detalhada"
          placeholder="Descreva os detalhes do serviço..."
          value={form.descricao}
          onChange={e => set('descricao', e.target.value)}
          rows={4}
        />
      </div>

      {/* Datas e status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Datas e Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="data_inicio"
            type="date"
            label="Data de início *"
            value={form.data_inicio}
            onChange={e => set('data_inicio', e.target.value)}
            error={errors.data_inicio}
          />
          <Input
            id="data_conclusao"
            type="date"
            label="Data de conclusão"
            value={form.data_conclusao}
            onChange={e => set('data_conclusao', e.target.value)}
            min={form.data_inicio}
          />
          <Select
            id="status"
            label="Status do Serviço *"
            value={form.status}
            onChange={e => set('status', e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Financeiro */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Financeiro</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="valor"
            type="text"
            label="Valor (R$)"
            placeholder="0,00"
            value={form.valor}
            onChange={e => set('valor', e.target.value.replace(/[^0-9,.]/g, ''))}
          />
          {contas.length > 0 ? (
            <Select
              id="conta_id"
              label="Forma de recebimento *"
              value={form.conta_id}
              onChange={e => set('conta_id', e.target.value)}
              options={contas.map(c => ({ value: c.id, label: c.descricao ? `${c.nome} — ${c.descricao}` : c.nome }))}
              placeholder="Selecione como vai receber"
              error={errors.conta_id}
            />
          ) : (
            <div className="flex flex-col justify-end pb-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Nenhuma conta cadastrada.{' '}
                <a href="/contas" target="_blank" className="text-orange-600 hover:underline">
                  Cadastrar contas →
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Status de pagamento — cartões visuais */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Status do Pagamento
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: 'pago',
                label: 'Pago',
                desc: 'Pagamento recebido',
                icon: CheckCircle,
                color: 'border-green-400 bg-green-50 dark:bg-green-900/20',
                active: 'ring-2 ring-green-400',
                iconColor: 'text-green-600 dark:text-green-400',
              },
              {
                value: 'a_receber',
                label: 'A Receber',
                desc: 'Serviço concluído, aguardando pagamento',
                icon: Clock,
                color: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
                active: 'ring-2 ring-orange-400',
                iconColor: 'text-orange-600 dark:text-orange-400',
              },
              {
                value: 'pendente',
                label: 'Sem Cobrança',
                desc: 'Não há valor a cobrar',
                icon: AlertCircle,
                color: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30',
                active: 'ring-2 ring-gray-400',
                iconColor: 'text-gray-500',
              },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('pagamento_status', opt.value)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
                  ${opt.color}
                  ${form.pagamento_status === opt.value ? opt.active : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'}
                `}
              >
                <opt.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${opt.iconColor}`} />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Alerta contextual */}
          {form.status === 'concluido' && form.pagamento_status === 'a_receber' && (
            <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <p className="text-sm text-orange-700 dark:text-orange-300">
                <strong>Serviço concluído com pagamento pendente.</strong> O cliente ainda não efetuou o pagamento.
                {temValor && (
                  <span className="ml-1">
                    Valor a receber: <strong>{parseFloat(form.valor.replace(',', '.')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {servico ? 'Salvar alterações' : 'Cadastrar serviço'}
        </Button>
      </div>
    </form>
    </>
  )
}
