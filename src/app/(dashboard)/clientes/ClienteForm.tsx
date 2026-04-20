'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { formatCPFCNPJ, formatPhone, TAG_LABELS } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { Cliente } from '@/types'
import { AlertTriangle } from 'lucide-react'

interface ClienteFormProps {
  cliente?: Cliente
}

const TAG_OPTIONS = ['vip', 'inadimplente', 'recorrente', 'novo'] as const

export default function ClienteForm({ cliente }: ClienteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: cliente?.nome || '',
    telefone: cliente?.telefone || '',
    whatsapp: cliente?.whatsapp ?? true,
    email: cliente?.email || '',
    endereco: cliente?.endereco || '',
    cpf_cnpj: cliente?.cpf_cnpj || '',
    observacoes: cliente?.observacoes || '',
    tags: cliente?.tags || [] as string[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    return errs
  }

  // Campos pendentes de preenchimento (não bloqueiam, mas alertam)
  const pendencias: string[] = []
  if (!form.cpf_cnpj.trim()) pendencias.push('CPF/CNPJ')
  if (!form.telefone.trim()) pendencias.push('Telefone')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    const supabase = createClient()

    const data = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp,
      email: form.email.trim() || null,
      endereco: form.endereco.trim() || null,
      cpf_cnpj: form.cpf_cnpj.replace(/\D/g, '') || '',
      observacoes: form.observacoes.trim() || null,
      tags: form.tags,
    }

    if (cliente) {
      const { error } = await supabase.from('clientes').update(data).eq('id', cliente.id)
      if (error) {
        if (error.code === '23505') toast.error('CPF/CNPJ já cadastrado.')
        else toast.error('Erro ao atualizar cliente.')
        setLoading(false)
        return
      }
      toast.success('Cliente atualizado!')
      router.push(`/clientes/${cliente.id}`)
    } else {
      const { data: novo, error } = await supabase.from('clientes').insert(data).select().single()
      if (error) {
        if (error.code === '23505') toast.error('CPF/CNPJ já cadastrado.')
        else toast.error('Erro ao cadastrar cliente.')
        setLoading(false)
        return
      }
      if (pendencias.length > 0) {
        toast.success(`Cliente cadastrado! Pendências: ${pendencias.join(', ')}`, { duration: 5000 })
      } else {
        toast.success('Cliente cadastrado com sucesso!')
      }
      router.push(`/clientes/${novo.id}`)
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Alerta de pendências */}
      {pendencias.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Dados incompletos</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
              Preencha também: <strong>{pendencias.join(' e ')}</strong> — você pode salvar agora e completar depois.
            </p>
          </div>
        </div>
      )}

      {/* Dados pessoais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Dados Pessoais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <Input
              id="nome"
              label="Nome completo *"
              placeholder="João da Silva"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              error={errors.nome}
            />
          </div>
          <div>
            <Input
              id="cpf_cnpj"
              label={
                <span className="flex items-center gap-1">
                  CPF / CNPJ
                  {!form.cpf_cnpj.trim() && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">(pendente)</span>
                  )}
                </span>
              }
              placeholder="000.000.000-00"
              value={formatCPFCNPJ(form.cpf_cnpj)}
              onChange={e => set('cpf_cnpj', e.target.value.replace(/\D/g, ''))}
              maxLength={18}
            />
          </div>
          <Input
            id="email"
            type="email"
            label="E-mail"
            placeholder="joao@email.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>
      </div>

      {/* Contato */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Contato</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              id="telefone"
              label={
                <span className="flex items-center gap-1">
                  Telefone
                  {!form.telefone.trim() && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">(pendente)</span>
                  )}
                </span>
              }
              placeholder="(11) 99999-9999"
              value={formatPhone(form.telefone)}
              onChange={e => set('telefone', e.target.value.replace(/\D/g, ''))}
              maxLength={15}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.whatsapp}
                onChange={e => set('whatsapp', e.target.checked)}
                className="w-4 h-4 accent-green-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Número de WhatsApp</span>
            </label>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Input
              id="endereco"
              label="Endereço completo"
              placeholder="Rua, número, bairro, cidade - UF"
              value={form.endereco}
              onChange={e => set('endereco', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                form.tags.includes(tag)
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              {TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      {/* Observações */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <Textarea
          id="observacoes"
          label="Observações"
          placeholder="Informações adicionais sobre o cliente..."
          value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
      </div>
    </form>
  )
}
