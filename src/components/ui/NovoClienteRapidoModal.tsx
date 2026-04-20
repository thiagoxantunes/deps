'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import { formatCPFCNPJ, formatPhone } from '@/utils/cn'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

interface NovoClienteRapidoModalProps {
  isOpen: boolean
  onClose: () => void
  onClienteCriado: (cliente: { id: string; nome: string }) => void
}

export default function NovoClienteRapidoModal({
  isOpen, onClose, onClienteCriado
}: NovoClienteRapidoModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    whatsapp: true,
    cpf_cnpj: '',
    email: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.from('clientes').insert({
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp,
      cpf_cnpj: form.cpf_cnpj.replace(/\D/g, '') || null,
      email: form.email.trim() || null,
      tags: [],
    }).select('id, nome').single()

    if (error) {
      if (error.code === '23505') {
        setErrors({ cpf_cnpj: 'CPF/CNPJ já cadastrado.' })
      } else {
        toast.error('Erro ao cadastrar cliente.')
      }
      setLoading(false)
      return
    }

    toast.success(`Cliente "${data.nome}" cadastrado!`)
    onClienteCriado(data)
    // Reset form
    setForm({ nome: '', telefone: '', whatsapp: true, cpf_cnpj: '', email: '' })
    setErrors({})
    setLoading(false)
    onClose()
  }

  const handleClose = () => {
    setForm({ nome: '', telefone: '', whatsapp: true, cpf_cnpj: '', email: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cadastrar novo cliente" size="md">
      <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Cadastro rápido — você pode completar os dados do cliente depois.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="qr-nome"
          label="Nome completo *"
          placeholder="João da Silva"
          value={form.nome}
          onChange={e => set('nome', e.target.value)}
          error={errors.nome}
          autoFocus
        />

        <Input
          id="qr-cpf"
          label="CPF / CNPJ"
          placeholder="000.000.000-00"
          value={formatCPFCNPJ(form.cpf_cnpj)}
          onChange={e => set('cpf_cnpj', e.target.value.replace(/\D/g, ''))}
          maxLength={18}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="qr-tel"
            label="Telefone"
            placeholder="(11) 99999-9999"
            value={formatPhone(form.telefone)}
            onChange={e => set('telefone', e.target.value.replace(/\D/g, ''))}
            maxLength={15}
          />
          <Input
            id="qr-email"
            type="email"
            label="E-mail"
            placeholder="joao@email.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.whatsapp}
            onChange={e => set('whatsapp', e.target.checked)}
            className="w-4 h-4 accent-green-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Número de WhatsApp</span>
        </label>

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            <UserPlus className="w-4 h-4" />
            Cadastrar e selecionar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
