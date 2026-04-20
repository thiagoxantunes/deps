'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { formatPlate } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { Veiculo } from '@/types'
import { Car, Archive, ArrowRightLeft } from 'lucide-react'

interface VeiculoFormProps {
  veiculo?: Veiculo & { status_veiculo?: string; obs_status?: string; data_alteracao_status?: string }
  clienteId?: string
  clientes?: { id: string; nome: string }[]
}

const ANO_OPTIONS = Array.from({ length: 40 }, (_, i) => {
  const year = new Date().getFullYear() + 1 - i
  return { value: String(year), label: String(year) }
})

const MARCAS = ['Chevrolet', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jeep', 'Nissan', 'Renault', 'Toyota', 'Volkswagen', 'Yamaha', 'Outra']

const STATUS_VEICULO_OPTIONS = [
  { value: 'ativo', label: 'Ativo', desc: 'Veículo atual do cliente', icon: Car, color: 'border-green-400 bg-green-50 dark:bg-green-900/20', active: 'ring-2 ring-green-400', iconColor: 'text-green-600 dark:text-green-400' },
  { value: 'antigo', label: 'Antigo', desc: 'Cliente não possui mais, dados preservados', icon: Archive, color: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30', active: 'ring-2 ring-gray-400', iconColor: 'text-gray-500' },
  { value: 'transferido', label: 'Transferido / Vendido', desc: 'Veículo vendido ou transferido para outra pessoa', icon: ArrowRightLeft, color: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20', active: 'ring-2 ring-orange-400', iconColor: 'text-orange-600 dark:text-orange-400' },
]

export default function VeiculoForm({ veiculo, clienteId, clientes = [] }: VeiculoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    cliente_id: veiculo?.cliente_id || clienteId || '',
    tipo: veiculo?.tipo || 'carro',
    placa: veiculo?.placa || '',
    renavam: veiculo?.renavam || '',
    marca: veiculo?.marca || '',
    modelo: veiculo?.modelo || '',
    ano: veiculo?.ano ? String(veiculo.ano) : String(new Date().getFullYear()),
    cor: veiculo?.cor || '',
    observacoes: veiculo?.observacoes || '',
    status_veiculo: veiculo?.status_veiculo || 'ativo',
    obs_status: veiculo?.obs_status || '',
    data_alteracao_status: veiculo?.data_alteracao_status || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.cliente_id) errs.cliente_id = 'Selecione um cliente'
    if (!form.placa.trim()) errs.placa = 'Placa é obrigatória'
    if (!form.renavam.trim()) errs.renavam = 'RENAVAM é obrigatório'
    if (!form.marca.trim()) errs.marca = 'Marca é obrigatória'
    if (!form.modelo.trim()) errs.modelo = 'Modelo é obrigatório'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    const supabase = createClient()

    const data = {
      cliente_id: form.cliente_id,
      tipo: form.tipo,
      placa: form.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      renavam: form.renavam.replace(/\D/g, ''),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      ano: parseInt(form.ano),
      cor: form.cor.trim() || null,
      observacoes: form.observacoes.trim() || null,
      status_veiculo: form.status_veiculo,
      obs_status: form.obs_status.trim() || null,
      data_alteracao_status: form.data_alteracao_status || null,
    }

    if (veiculo) {
      const { error } = await supabase.from('veiculos').update(data).eq('id', veiculo.id)
      if (error) { toast.error('Erro ao atualizar veículo.'); setLoading(false); return }
      toast.success('Veículo atualizado!')
      router.push(`/veiculos/${veiculo.id}`)
    } else {
      const { data: novo, error } = await supabase.from('veiculos').insert(data).select().single()
      if (error) { toast.error('Erro ao cadastrar veículo.'); setLoading(false); return }
      toast.success('Veículo cadastrado!')
      router.push(`/clientes/${form.cliente_id}`)
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Dados básicos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Dados do Veículo</h2>

        {clientes.length > 0 && (
          <Select
            id="cliente_id"
            label="Cliente *"
            value={form.cliente_id}
            onChange={e => set('cliente_id', e.target.value)}
            options={clientes.map(c => ({ value: c.id, label: c.nome }))}
            placeholder="Selecione o cliente"
            error={errors.cliente_id}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="tipo"
            label="Tipo *"
            value={form.tipo}
            onChange={e => set('tipo', e.target.value)}
            options={[{ value: 'carro', label: 'Carro' }, { value: 'moto', label: 'Moto' }]}
          />
          <Input
            id="placa"
            label="Placa *"
            placeholder="ABC1234"
            value={formatPlate(form.placa)}
            onChange={e => set('placa', e.target.value)}
            error={errors.placa}
            maxLength={7}
          />
          <Input
            id="renavam"
            label="RENAVAM *"
            placeholder="00000000000"
            value={form.renavam}
            onChange={e => set('renavam', e.target.value.replace(/\D/g, ''))}
            error={errors.renavam}
            maxLength={11}
          />
          <Select
            id="ano"
            label="Ano *"
            value={form.ano}
            onChange={e => set('ano', e.target.value)}
            options={ANO_OPTIONS}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca *</label>
            <input
              list="marcas-list"
              value={form.marca}
              onChange={e => set('marca', e.target.value)}
              placeholder="Toyota, Honda..."
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.marca ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            />
            <datalist id="marcas-list">
              {MARCAS.map(m => <option key={m} value={m} />)}
            </datalist>
            {errors.marca && <p className="mt-1 text-xs text-red-500">{errors.marca}</p>}
          </div>
          <Input
            id="modelo"
            label="Modelo *"
            placeholder="Corolla, Civic..."
            value={form.modelo}
            onChange={e => set('modelo', e.target.value)}
            error={errors.modelo}
          />
          <Input
            id="cor"
            label="Cor"
            placeholder="Branco, Preto..."
            value={form.cor}
            onChange={e => set('cor', e.target.value)}
          />
        </div>
      </div>

      {/* Status do veículo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Status do Veículo</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
          Marque como &quot;Antigo&quot; ou &quot;Transferido&quot; quando o cliente não possuir mais o veículo. Os dados ficam preservados e a placa pode ser reutilizada.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUS_VEICULO_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('status_veiculo', opt.value)}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all
                ${opt.color}
                ${form.status_veiculo === opt.value ? opt.active : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'}
              `}
            >
              <opt.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${opt.iconColor}`} />
              <div>
                <p className="font-semibold text-xs text-gray-900 dark:text-white">{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {form.status_veiculo !== 'ativo' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              id="data_alteracao_status"
              type="date"
              label={form.status_veiculo === 'transferido' ? 'Data da venda/transferência' : 'Data de desativação'}
              value={form.data_alteracao_status}
              onChange={e => set('data_alteracao_status', e.target.value)}
            />
            <Input
              id="obs_status"
              label={form.status_veiculo === 'transferido' ? 'Comprador / observação' : 'Observação'}
              placeholder={form.status_veiculo === 'transferido' ? 'Nome do comprador, valor...' : 'Motivo...'}
              value={form.obs_status}
              onChange={e => set('obs_status', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <Textarea
          id="observacoes"
          label="Observações"
          placeholder="Observações sobre o veículo..."
          value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {veiculo ? 'Salvar alterações' : 'Cadastrar veículo'}
        </Button>
      </div>
    </form>
  )
}
