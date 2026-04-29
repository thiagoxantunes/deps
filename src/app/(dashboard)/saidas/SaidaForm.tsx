'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'
import { revalidarSaidas } from './actions'

interface SaidaFormProps {
  saida?: {
    id: string
    data: string
    horario: string | null
    descricao: string
    valor: number
    conta_id: string | null
  }
}

const CATEGORIAS = [
  'Materiais de escritório',
  'Combustível / Transporte',
  'Taxas e impostos',
  'Despesas bancárias',
  'Marketing e publicidade',
  'Manutenção / Equipamentos',
  'Alimentação',
  'Outros',
]

export default function SaidaForm({ saida }: SaidaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contas, setContas] = useState<{ id: string; nome: string; descricao: string | null }[]>([])
  const [form, setForm] = useState({
    data: saida?.data || new Date().toISOString().split('T')[0],
    horario: saida?.horario || new Date().toTimeString().slice(0, 5),
    descricao: saida?.descricao || '',
    valor: saida?.valor ? String(saida.valor) : '',
    conta_id: saida?.conta_id || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.from('contas_recebimento').select('id, nome, descricao').eq('ativo', true).order('nome')
      .then(({ data }) => { if (data) setContas(data) })
  }, [])

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.data) errs.data = 'Data é obrigatória'
    if (!form.descricao.trim()) errs.descricao = 'Descrição é obrigatória'
    if (!form.valor || isNaN(parseFloat(form.valor.replace(',', '.')))) errs.valor = 'Valor inválido'
    if (!form.conta_id) errs.conta_id = 'Selecione de onde saiu o dinheiro'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    const supabase = createClient()
    const valor = parseFloat(form.valor.replace(',', '.'))

    const data = {
      data: form.data,
      horario: form.horario || null,
      descricao: form.descricao.trim(),
      valor,
      conta_id: form.conta_id || null,
    }

    if (saida) {
      const { error } = await supabase.from('saidas').update(data).eq('id', saida.id)
      if (error) {
        console.error('Erro ao atualizar saída:', error)
        toast.error('Erro ao atualizar saída. Tente novamente.')
        setLoading(false)
        return
      }
      toast.success('Saída atualizada!')
    } else {
      const { error } = await supabase.from('saidas').insert(data)
      if (error) {
        console.error('Erro ao registrar saída:', error)
        toast.error('Erro ao registrar saída. Tente novamente.')
        setLoading(false)
        return
      }
      toast.success('Saída registrada!')
    }

    await revalidarSaidas()
    router.push('/saidas')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Data + Valor */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Dados da Saída</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="data"
            type="date"
            label="Data *"
            value={form.data}
            onChange={e => set('data', e.target.value)}
            error={errors.data}
          />
          <Input
            id="horario"
            type="time"
            label="Horário do pagamento"
            value={form.horario}
            onChange={e => set('horario', e.target.value)}
          />
          <Input
            id="valor"
            type="text"
            label="Valor (R$) *"
            placeholder="0,00"
            value={form.valor}
            onChange={e => set('valor', e.target.value.replace(/[^0-9,.]/g, ''))}
            error={errors.valor}
          />
        </div>

        {/* Conta de origem */}
        {contas.length > 0 ? (
          <Select
            id="conta_id"
            label="De onde saiu o dinheiro *"
            value={form.conta_id}
            onChange={e => set('conta_id', e.target.value)}
            options={contas.map(c => ({ value: c.id, label: c.descricao ? `${c.nome} — ${c.descricao}` : c.nome }))}
            placeholder="Selecione a conta"
            error={errors.conta_id}
          />
        ) : (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Nenhuma conta cadastrada.{' '}
              <a href="/contas" target="_blank" className="font-semibold underline">
                Cadastre uma conta →
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Descrição */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Descrição</h2>

        {/* Atalhos de categoria */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Categoria rápida:</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => set('descricao', cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  form.descricao === cat
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-red-400 hover:text-red-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          id="descricao"
          label="Onde foi gasto / O que foi comprado *"
          placeholder="Ex: Cartório para reconhecimento de firma, Recarga de toner, Gasolina para cartório..."
          value={form.descricao}
          onChange={e => set('descricao', e.target.value)}
          rows={3}
          error={errors.descricao}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading} className="bg-red-600 hover:bg-red-700 focus:ring-red-400">
          {saida ? 'Salvar alterações' : 'Registrar saída'}
        </Button>
      </div>
    </form>
  )
}
