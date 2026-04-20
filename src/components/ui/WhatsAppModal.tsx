'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from './Modal'
import { MessageCircle, Send, ChevronDown, ChevronUp, Check, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/utils/cn'
import type { MensagemTemplate } from '@/types'

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: {
    id: string
    nome: string
    telefone: string
  }
  contexto?: {
    servicoId?: string
    tipoServico?: string
    valor?: number
    placa?: string
    comprovanteUrl?: string
  }
}

const CATEGORIA_LABELS: Record<string, string> = {
  servico: '📋 Serviço',
  pagamento: '💰 Pagamento',
  documento: '📄 Documento',
  geral: '💬 Geral',
}

// Order in which categories are shown
const CATEGORIA_ORDER = ['servico', 'pagamento', 'documento', 'geral']

const CATEGORIA_COR: Record<string, string> = {
  servico: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  pagamento: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  documento: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  geral: 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600',
}

/** Substitui os placeholders {{variavel}} pelo valor real */
function preencherTemplate(
  conteudo: string,
  vars: Record<string, string | undefined>
): string {
  let texto = conteudo
  // Blocos condicionais {{#variavel}}...{{/variavel}}
  texto = texto.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => {
    return vars[key] ? inner.replace(`{{${key}}}`, vars[key]!) : ''
  })
  // Substituição simples
  Object.entries(vars).forEach(([key, val]) => {
    texto = texto.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || '')
  })
  // Remove linhas vazias duplicadas deixadas por blocos condicionais vazios
  texto = texto.replace(/\n{3,}/g, '\n\n')
  return texto.trim()
}

/** Escolhe o melhor template para o contexto atual */
function escolherTemplateInicial(
  templates: MensagemTemplate[],
  temServico: boolean,
): MensagemTemplate | null {
  if (templates.length === 0) return null
  if (temServico) {
    return (
      templates.find(t => t.categoria === 'servico' && t.nome.includes('Concluído')) ??
      templates.find(t => t.categoria === 'servico') ??
      templates[0]
    )
  }
  return (
    templates.find(t => t.nome === 'Boas-vindas') ??
    templates.find(t => t.categoria === 'geral') ??
    templates[0]
  )
}

export default function WhatsAppModal({ isOpen, onClose, cliente, contexto }: WhatsAppModalProps) {
  const [templates, setTemplates] = useState<MensagemTemplate[]>([])
  const [templateSelecionado, setTemplateSelecionado] = useState<MensagemTemplate | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [mostrarTemplates, setMostrarTemplates] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const vars: Record<string, string | undefined> = {
    nome: cliente.nome,
    servico: contexto?.tipoServico,
    valor: contexto?.valor ? formatCurrency(contexto.valor) : undefined,
    placa: contexto?.placa,
    data: new Date().toLocaleDateString('pt-BR'),
    comprovante: contexto?.comprovanteUrl,
  }

  const aplicarTemplate = useCallback((t: MensagemTemplate, mostrar = false) => {
    setTemplateSelecionado(t)
    setMensagem(preencherTemplate(t.conteudo, vars))
    setMostrarTemplates(mostrar)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.nome, contexto?.tipoServico, contexto?.valor, contexto?.placa])

  // Carrega templates e já seleciona o melhor ao abrir
  useEffect(() => {
    if (!isOpen) return
    setCarregando(true)
    const supabase = createClient()
    supabase.from('mensagens_templates')
      .select('*')
      .eq('ativo', true)
      .order('categoria')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTemplates(data)
          const inicial = escolherTemplateInicial(data, !!contexto?.tipoServico)
          if (inicial) aplicarTemplate(inicial)
        }
        setCarregando(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTemplateSelecionado(null)
      setMensagem('')
      setTemplates([])
      setEnviado(false)
      setMostrarTemplates(false)
    }
  }, [isOpen])

  const handleEnviar = async () => {
    if (!mensagem.trim()) return
    setEnviando(true)

    const telefone = cliente.telefone.replace(/\D/g, '')
    // api.whatsapp.com/send preserva emojis melhor que wa.me (sem redirecionamento intermediário)
    const url = `https://api.whatsapp.com/send?phone=55${telefone}&text=${encodeURIComponent(mensagem)}`

    // Registra no histórico
    const supabase = createClient()
    await supabase.from('mensagens_enviadas').insert({
      cliente_id: cliente.id,
      servico_id: contexto?.servicoId || null,
      template_id: templateSelecionado?.id || null,
      mensagem: mensagem,
      telefone: telefone,
    })

    // Abre WhatsApp
    window.open(url, '_blank')

    setEnviando(false)
    setEnviado(true)
    toast.success('WhatsApp aberto! Mensagem pronta para enviar.')

    // Fecha modal após 1.5s
    setTimeout(() => { onClose(); setEnviado(false) }, 1500)
  }

  // Categorias na ordem correta
  const categorias = CATEGORIA_ORDER.filter(cat =>
    templates.some(t => t.categoria === cat)
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar WhatsApp" size="md">
      <div className="space-y-4">

        {/* Info do destinatário */}
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{cliente.nome}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{cliente.telefone}</p>
          </div>
          {contexto?.tipoServico && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Serviço</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                {contexto.tipoServico}
              </p>
            </div>
          )}
        </div>

        {/* Template selecionado + botão para trocar */}
        <div>
          <button
            onClick={() => setMostrarTemplates(p => !p)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              {carregando ? (
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
              ) : templateSelecionado ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {carregando
                  ? 'Carregando modelos...'
                  : templateSelecionado
                    ? templateSelecionado.nome
                    : 'Escolher modelo de mensagem'}
              </span>
            </div>
            {mostrarTemplates
              ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </button>

          {/* Lista de templates — colapsável */}
          {mostrarTemplates && (
            <div className="mt-2 space-y-3 max-h-52 overflow-y-auto pr-1 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              {categorias.map(cat => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    {CATEGORIA_LABELS[cat] || cat}
                  </p>
                  <div className="space-y-1">
                    {templates.filter(t => t.categoria === cat).map(t => (
                      <button
                        key={t.id}
                        onClick={() => aplicarTemplate(t)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                          templateSelecionado?.id === t.id
                            ? 'ring-2 ring-green-500 border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                            : `${CATEGORIA_COR[cat]} hover:opacity-90`
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{t.nome}</span>
                          {templateSelecionado?.id === t.id && (
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor da mensagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Mensagem{' '}
            <span className="text-xs text-gray-400 font-normal">(edite antes de enviar se precisar)</span>
          </label>
          <textarea
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
            placeholder={carregando ? 'Carregando mensagem...' : 'Escolha um modelo acima ou digite a mensagem...'}
            rows={9}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono leading-relaxed"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{mensagem.length} caracteres</p>
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ao clicar em <strong>Enviar</strong>, o WhatsApp abre com a mensagem já preenchida.
            O envio fica registrado no histórico.
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={!mensagem.trim() || enviando || enviado}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {enviado ? (
              <><Check className="w-4 h-4" />Enviado!</>
            ) : enviando ? (
              <>Abrindo...</>
            ) : (
              <><Send className="w-4 h-4" />Abrir WhatsApp</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
