'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { MensagemTemplate, CategoriaTemplate } from '@/types'

interface TemplatesManagerProps {
  templates: MensagemTemplate[]
}

const CATEGORIAS: { value: CategoriaTemplate; label: string; cor: string }[] = [
  { value: 'servico', label: '📋 Serviço', cor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'pagamento', label: '💰 Pagamento', cor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { value: 'documento', label: '📄 Documento', cor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'geral', label: '💬 Geral', cor: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
]

const PLACEHOLDERS_AJUDA = `Variáveis disponíveis:
{{nome}} → Nome do cliente
{{servico}} → Tipo do serviço
{{valor}} → Valor formatado (R$)
{{placa}} → Placa do veículo
{{data}} → Data de hoje

Bloco condicional (só aparece se a variável existir):
{{#valor}}Valor: {{valor}}{{/valor}}`

export default function TemplatesManager({ templates: initial }: TemplatesManagerProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initial)
  const [editando, setEditando] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', categoria: 'geral' as CategoriaTemplate, conteudo: '' })
  const [salvando, setSalvando] = useState(false)

  const abrirCriacao = () => {
    setForm({ nome: '', categoria: 'geral', conteudo: '' })
    setCriando(true)
    setEditando(null)
  }

  const abrirEdicao = (t: MensagemTemplate) => {
    setForm({ nome: t.nome, categoria: t.categoria, conteudo: t.conteudo })
    setEditando(t.id)
    setCriando(false)
  }

  const cancelar = () => { setCriando(false); setEditando(null) }

  const salvar = async () => {
    if (!form.nome.trim() || !form.conteudo.trim()) {
      toast.error('Preencha o nome e o conteúdo.')
      return
    }
    setSalvando(true)
    const supabase = createClient()

    if (criando) {
      const { data, error } = await supabase.from('mensagens_templates').insert({
        nome: form.nome.trim(),
        categoria: form.categoria,
        conteudo: form.conteudo.trim(),
      }).select().single()
      if (error) { toast.error('Erro ao criar template.'); setSalvando(false); return }
      setTemplates(prev => [...prev, data])
      toast.success('Template criado!')
      setCriando(false)
    } else if (editando) {
      const { error } = await supabase.from('mensagens_templates')
        .update({ nome: form.nome.trim(), categoria: form.categoria, conteudo: form.conteudo.trim() })
        .eq('id', editando)
      if (error) { toast.error('Erro ao atualizar.'); setSalvando(false); return }
      setTemplates(prev => prev.map(t => t.id === editando ? { ...t, ...form } : t))
      toast.success('Template atualizado!')
      setEditando(null)
    }
    setSalvando(false)
    router.refresh()
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir este template?')) return
    const supabase = createClient()
    const { error } = await supabase.from('mensagens_templates').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir.'); return }
    setTemplates(prev => prev.filter(t => t.id !== id))
    toast.success('Template excluído.')
  }

  const categoriaInfo = (cat: string) => CATEGORIAS.find(c => c.value === cat)

  return (
    <div className="space-y-3">
      {/* Lista de templates */}
      {templates.map(t => {
        const cat = categoriaInfo(t.categoria)
        const isEditando = editando === t.id
        const isExpandido = expandido === t.id

        return (
          <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {isEditando ? (
              <FormTemplate
                form={form}
                setForm={setForm}
                onSalvar={salvar}
                onCancelar={cancelar}
                salvando={salvando}
              />
            ) : (
              <>
                <div className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.nome}</p>
                      {cat && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cat.cor}`}>
                          {cat.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setExpandido(isExpandido ? null : t.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                      title="Ver conteúdo"
                    >
                      {isExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => abrirEdicao(t)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => excluir(t.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isExpandido && (
                  <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                      {t.conteudo}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      {/* Formulário de criação */}
      {criando && (
        <div className="border border-blue-300 dark:border-blue-700 rounded-xl overflow-hidden">
          <div className="px-3 pt-3 pb-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Novo template</p>
          </div>
          <FormTemplate
            form={form}
            setForm={setForm}
            onSalvar={salvar}
            onCancelar={cancelar}
            salvando={salvando}
          />
        </div>
      )}

      {/* Botão adicionar */}
      {!criando && !editando && (
        <button
          onClick={abrirCriacao}
          className="flex items-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-600 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo modelo de mensagem
        </button>
      )}

      {/* Referência de variáveis */}
      <details className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        <summary className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
          Ver variáveis disponíveis
        </summary>
        <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
          {PLACEHOLDERS_AJUDA}
        </pre>
      </details>
    </div>
  )
}

function FormTemplate({
  form, setForm, onSalvar, onCancelar, salvando,
}: {
  form: { nome: string; categoria: CategoriaTemplate; conteudo: string }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  onSalvar: () => void
  onCancelar: () => void
  salvando: boolean
}) {
  const CATEGORIAS: { value: CategoriaTemplate; label: string }[] = [
    { value: 'servico', label: '📋 Serviço' },
    { value: 'pagamento', label: '💰 Pagamento' },
    { value: 'documento', label: '📄 Documento' },
    { value: 'geral', label: '💬 Geral' },
  ]

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Nome do template *"
          value={form.nome}
          onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={form.categoria}
          onChange={e => setForm(p => ({ ...p, categoria: e.target.value as CategoriaTemplate }))}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <textarea
        placeholder="Conteúdo da mensagem... Use {{nome}}, {{servico}}, etc."
        value={form.conteudo}
        onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))}
        rows={6}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancelar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
        <button
          onClick={onSalvar}
          disabled={salvando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
