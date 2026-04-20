'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { TIPOS_SERVICO, PERIODICIDADE_LABELS, PERIODICIDADE_MESES } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { ServicoRecorrente } from '@/types'
import { RefreshCw, Calendar, Bell, UserPlus, X, Check, ChevronDown } from 'lucide-react'
import { addMonths, format } from 'date-fns'

interface RecorrenteFormProps {
  servico?: ServicoRecorrente
  clienteId?: string
}

const ANTECEDENCIA_OPTIONS = [
  { value: '3', label: '3 dias antes' },
  { value: '7', label: '7 dias antes' },
  { value: '15', label: '15 dias antes' },
  { value: '30', label: '30 dias antes' },
  { value: '60', label: '60 dias antes' },
]

const PERIODICIDADE_OPTIONS = Object.entries(PERIODICIDADE_LABELS).map(([value, label]) => ({ value, label }))

// ── Mini-formulário de novo cliente ───────────────────────────────
interface NovoClienteFormProps {
  onSalvo: (cliente: { id: string; nome: string }) => void
  onCancelar: () => void
}

function NovoClienteInline({ onSalvo, onCancelar }: NovoClienteFormProps) {
  const [salvando, setSalvando] = useState(false)
  const [dados, setDados] = useState({
    nome: '',
    telefone: '',
    cpf_cnpj: '',
    whatsapp: true,
  })
  const [erros, setErros] = useState<Record<string, string>>({})

  const set = (field: string, value: unknown) => {
    setDados(p => ({ ...p, [field]: value }))
    if (erros[field]) setErros(p => ({ ...p, [field]: '' }))
  }

  const formatarTelefone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const handleSalvar = async () => {
    const errs: Record<string, string> = {}
    if (!dados.nome.trim()) errs.nome = 'Nome obrigatório'
    if (Object.keys(errs).length) { setErros(errs); return }

    setSalvando(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('clientes').insert({
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim(),
      cpf_cnpj: dados.cpf_cnpj.trim(),
      whatsapp: dados.whatsapp,
      tags: [],
    }).select('id, nome').single()

    if (error || !data) {
      toast.error('Erro ao cadastrar cliente.')
      setSalvando(false)
      return
    }

    toast.success(`Cliente "${data.nome}" cadastrado!`)
    onSalvo(data)
  }

  return (
    <div className="mt-3 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Cadastrar novo cliente</span>
        </div>
        <button
          type="button"
          onClick={onCancelar}
          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome completo *
          </label>
          <input
            type="text"
            value={dados.nome}
            onChange={e => set('nome', e.target.value)}
            placeholder="João da Silva"
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.nome ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {erros.nome && <p className="mt-1 text-xs text-red-500">{erros.nome}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Telefone <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="tel"
            value={dados.telefone}
            onChange={e => set('telefone', formatarTelefone(e.target.value))}
            placeholder="(00) 00000-0000"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            CPF / CNPJ <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={dados.cpf_cnpj}
            onChange={e => set('cpf_cnpj', e.target.value)}
            placeholder="000.000.000-00"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={dados.whatsapp}
                onChange={e => set('whatsapp', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-green-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Tem WhatsApp</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancelar}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {salvando ? 'Salvando...' : 'Criar cliente'}
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────
export default function RecorrenteForm({ servico, clienteId }: RecorrenteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [veiculos, setVeiculos] = useState<{ id: string; placa: string; modelo: string }[]>([])
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false)
  const [isCustomTipo, setIsCustomTipo] = useState(
    servico?.tipo_servico ? !TIPOS_SERVICO.includes(servico.tipo_servico) : false
  )

  const [form, setForm] = useState({
    cliente_id: servico?.cliente_id || clienteId || '',
    veiculo_id: servico?.veiculo_id || '',
    tipo_servico: servico?.tipo_servico && TIPOS_SERVICO.includes(servico.tipo_servico)
      ? servico.tipo_servico
      : (servico?.tipo_servico ? 'custom' : ''),
    tipo_servico_custom: servico?.tipo_servico && !TIPOS_SERVICO.includes(servico.tipo_servico)
      ? servico.tipo_servico : '',
    descricao: servico?.descricao || '',
    valor: servico?.valor ? String(servico.valor) : '',
    periodicidade: servico?.periodicidade || 'anual',
    proximo_vencimento: servico?.proximo_vencimento || '',
    antecedencia_dias: String(servico?.antecedencia_dias || 15),
    ativo: servico?.ativo ?? true,
    observacoes: servico?.observacoes || '',
  })
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
    supabase.from('veiculos').select('id, placa, modelo')
      .eq('cliente_id', form.cliente_id)
      .eq('status_veiculo', 'ativo')
      .then(({ data }) => {
        if (data) setVeiculos(data)
      })
  }, [form.cliente_id])

  const set = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const sugerirProximoVencimento = () => {
    const meses = PERIODICIDADE_MESES[form.periodicidade] || 12
    const proximo = addMonths(new Date(), meses)
    set('proximo_vencimento', format(proximo, 'yyyy-MM-dd'))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.cliente_id) errs.cliente_id = 'Selecione ou cadastre um cliente'
    const tipoFinal = form.tipo_servico === 'custom' ? form.tipo_servico_custom : form.tipo_servico
    if (!tipoFinal.trim()) errs.tipo_servico = 'Selecione ou informe o tipo de serviço'
    if (!form.proximo_vencimento) errs.proximo_vencimento = 'Informe o próximo vencimento'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    const supabase = createClient()

    const tipoFinal = form.tipo_servico === 'custom' ? form.tipo_servico_custom : form.tipo_servico

    const data = {
      cliente_id: form.cliente_id,
      veiculo_id: form.veiculo_id || null,
      tipo_servico: tipoFinal.trim(),
      descricao: form.descricao.trim() || null,
      valor: form.valor ? parseFloat(form.valor.replace(',', '.')) : null,
      periodicidade: form.periodicidade,
      proximo_vencimento: form.proximo_vencimento,
      antecedencia_dias: parseInt(form.antecedencia_dias),
      ativo: form.ativo,
      observacoes: form.observacoes.trim() || null,
    }

    if (servico) {
      const { error } = await supabase.from('servicos_recorrentes').update(data).eq('id', servico.id)
      if (error) { toast.error('Erro ao atualizar serviço recorrente.'); setLoading(false); return }
      toast.success('Serviço recorrente atualizado!')
      router.push('/recorrentes')
    } else {
      const { error } = await supabase.from('servicos_recorrentes').insert(data)
      if (error) { toast.error('Erro ao cadastrar serviço recorrente.'); setLoading(false); return }
      toast.success('Serviço recorrente cadastrado!')
      router.push('/recorrentes')
    }
    router.refresh()
  }

  // Callback quando novo cliente é criado
  const handleClienteCriado = (novoCliente: { id: string; nome: string }) => {
    setClientes(prev => [...prev, novoCliente].sort((a, b) => a.nome.localeCompare(b.nome)))
    set('cliente_id', novoCliente.id)
    setMostrarNovoCliente(false)
    if (errors.cliente_id) setErrors(prev => ({ ...prev, cliente_id: '' }))
  }

  const clienteSelecionado = clientes.find(c => c.id === form.cliente_id)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Cliente e Veículo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Vincular a</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Seletor de cliente customizado */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cliente *
              </label>
              {!mostrarNovoCliente && (
                <button
                  type="button"
                  onClick={() => setMostrarNovoCliente(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Novo cliente
                </button>
              )}
            </div>

            {/* Select com busca ou dropdown */}
            <div className="relative">
              <select
                value={form.cliente_id}
                onChange={e => {
                  set('cliente_id', e.target.value)
                  set('veiculo_id', '')
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 ${errors.cliente_id ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
              >
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {errors.cliente_id && (
              <p className="mt-1 text-xs text-red-500">{errors.cliente_id}</p>
            )}

            {/* Card do cliente selecionado */}
            {clienteSelecionado && !mostrarNovoCliente && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-700 dark:text-green-400">
                    {clienteSelecionado.nome[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-medium text-green-800 dark:text-green-300 truncate">
                  {clienteSelecionado.nome}
                </span>
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 ml-auto flex-shrink-0" />
              </div>
            )}

            {/* Formulário inline de novo cliente */}
            {mostrarNovoCliente && (
              <NovoClienteInline
                onSalvo={handleClienteCriado}
                onCancelar={() => setMostrarNovoCliente(false)}
              />
            )}
          </div>

          <Select
            id="veiculo_id"
            label="Veículo (opcional)"
            value={form.veiculo_id}
            onChange={e => set('veiculo_id', e.target.value)}
            options={[
              { value: '', label: veiculos.length ? 'Sem veículo' : 'Selecione um cliente primeiro' },
              ...veiculos.map(v => ({ value: v.id, label: `${v.placa} – ${v.modelo}` })),
            ]}
          />
        </div>
      </div>

      {/* Serviço */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Serviço</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Serviço *
            </label>
            <select
              value={form.tipo_servico}
              onChange={e => {
                set('tipo_servico', e.target.value)
                setIsCustomTipo(e.target.value === 'custom')
              }}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tipo_servico ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            >
              <option value="">Selecione...</option>
              {TIPOS_SERVICO.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="custom">Outro (digitar)</option>
            </select>
            {isCustomTipo && (
              <input
                type="text"
                value={form.tipo_servico_custom}
                onChange={e => set('tipo_servico_custom', e.target.value)}
                placeholder="Descreva o tipo..."
                className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {errors.tipo_servico && <p className="mt-1 text-xs text-red-500">{errors.tipo_servico}</p>}
          </div>
          <Input
            id="valor"
            label="Valor estimado (R$)"
            placeholder="0,00"
            value={form.valor}
            onChange={e => set('valor', e.target.value.replace(/[^0-9,]/g, ''))}
          />
          <div className="sm:col-span-2">
            <Textarea
              id="descricao"
              label="Descrição"
              placeholder="Detalhes sobre o serviço recorrente..."
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Recorrência */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recorrência</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            id="periodicidade"
            label="Periodicidade *"
            value={form.periodicidade}
            onChange={e => set('periodicidade', e.target.value)}
            options={PERIODICIDADE_OPTIONS}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Próximo Vencimento *
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.proximo_vencimento}
                onChange={e => set('proximo_vencimento', e.target.value)}
                className={`flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.proximo_vencimento ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
              />
              <button
                type="button"
                onClick={sugerirProximoVencimento}
                title="Sugerir data baseada na periodicidade"
                className="px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
            {errors.proximo_vencimento && <p className="mt-1 text-xs text-red-500">{errors.proximo_vencimento}</p>}
          </div>
          <Select
            id="antecedencia_dias"
            label="Alertar com antecedência"
            value={form.antecedencia_dias}
            onChange={e => set('antecedencia_dias', e.target.value)}
            options={ANTECEDENCIA_OPTIONS}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Você receberá uma notificação {form.antecedencia_dias} dias antes do vencimento em{' '}
            {form.proximo_vencimento
              ? <strong>{new Date(form.proximo_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
              : 'data não definida'}.
          </p>
        </div>

        {/* Ativo toggle */}
        <div className="flex items-center gap-3 pt-1">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={e => set('ativo', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Serviço ativo {form.ativo ? '(gerando notificações)' : '(pausado)'}
          </span>
        </div>
      </div>

      {/* Observações */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <Textarea
          id="observacoes"
          label="Observações"
          placeholder="Notas adicionais..."
          value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {servico ? 'Salvar alterações' : 'Cadastrar serviço recorrente'}
        </Button>
      </div>
    </form>
  )
}
