'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Check, X, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Conta {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
}

interface ContasManagerProps {
  contas: Conta[]
}

export default function ContasManager({ contas: initial }: ContasManagerProps) {
  const router = useRouter()
  const [contas, setContas] = useState(initial)
  const [editando, setEditando] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '' })

  const abrirCriacao = () => {
    setForm({ nome: '', descricao: '' })
    setCriando(true)
    setEditando(null)
  }

  const abrirEdicao = (c: Conta) => {
    setForm({ nome: c.nome, descricao: c.descricao || '' })
    setEditando(c.id)
    setCriando(false)
  }

  const cancelar = () => { setCriando(false); setEditando(null) }

  const salvar = async () => {
    if (!form.nome.trim()) { toast.error('Informe o nome da conta.'); return }
    setSalvando(true)
    const supabase = createClient()

    if (criando) {
      const { data, error } = await supabase.from('contas_recebimento')
        .insert({ nome: form.nome.trim(), descricao: form.descricao.trim() || null })
        .select().single()
      if (error) { toast.error('Erro ao criar conta.'); setSalvando(false); return }
      setContas(prev => [...prev, data])
      toast.success('Conta criada!')
      setCriando(false)
    } else if (editando) {
      const { error } = await supabase.from('contas_recebimento')
        .update({ nome: form.nome.trim(), descricao: form.descricao.trim() || null })
        .eq('id', editando)
      if (error) { toast.error('Erro ao atualizar.'); setSalvando(false); return }
      setContas(prev => prev.map(c => c.id === editando ? { ...c, ...form, descricao: form.descricao || null } : c))
      toast.success('Conta atualizada!')
      setEditando(null)
    }
    setSalvando(false)
    router.refresh()
  }

  const toggleAtivo = async (c: Conta) => {
    const supabase = createClient()
    await supabase.from('contas_recebimento').update({ ativo: !c.ativo }).eq('id', c.id)
    setContas(prev => prev.map(x => x.id === c.id ? { ...x, ativo: !x.ativo } : x))
    toast.success(c.ativo ? 'Conta desativada.' : 'Conta ativada.')
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta conta? Serviços vinculados perderão o vínculo.')) return
    const supabase = createClient()
    const { error } = await supabase.from('contas_recebimento').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir.'); return }
    setContas(prev => prev.filter(c => c.id !== id))
    toast.success('Conta excluída.')
  }

  return (
    <div className="space-y-3">
      {contas.map(c => (
        <div key={c.id} className={`border rounded-xl overflow-hidden ${c.ativo ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}>
          {editando === c.id ? (
            <FormConta form={form} setForm={setForm} onSalvar={salvar} onCancelar={cancelar} salvando={salvando} />
          ) : (
            <div className="flex items-center gap-3 p-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.ativo ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Wallet className={`w-4 h-4 ${c.ativo ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.nome}</p>
                {c.descricao && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.descricao}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleAtivo(c)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${c.ativo ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
                >
                  {c.ativo ? 'Ativa' : 'Inativa'}
                </button>
                <button onClick={() => abrirEdicao(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => excluir(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {criando && (
        <div className="border-2 border-orange-300 dark:border-orange-700 rounded-xl overflow-hidden">
          <div className="px-3 pt-3 pb-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nova conta</p>
          </div>
          <FormConta form={form} setForm={setForm} onSalvar={salvar} onCancelar={cancelar} salvando={salvando} />
        </div>
      )}

      {!criando && !editando && (
        <button
          onClick={abrirCriacao}
          className="flex items-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-600 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova conta de recebimento
        </button>
      )}
    </div>
  )
}

function FormConta({
  form, setForm, onSalvar, onCancelar, salvando,
}: {
  form: { nome: string; descricao: string }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  onSalvar: () => void
  onCancelar: () => void
  salvando: boolean
}) {
  return (
    <div className="p-3 space-y-3">
      <input
        type="text"
        placeholder="Nome da conta *"
        value={form.nome}
        onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <input
        type="text"
        placeholder="Descrição (opcional)"
        value={form.descricao}
        onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancelar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
          <X className="w-3.5 h-3.5" />Cancelar
        </button>
        <button onClick={onSalvar} disabled={salvando} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50">
          <Check className="w-3.5 h-3.5" />{salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
