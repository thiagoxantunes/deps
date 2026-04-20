'use client'

import { useState } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import WhatsAppModal from '@/components/ui/WhatsAppModal'
import type { MensagemTemplate } from '@/types'

interface ContatosWhatsAppProps {
  clientes: { id: string; nome: string; telefone: string; whatsapp: boolean }[]
  templates: MensagemTemplate[]
}

export default function ContatosWhatsApp({ clientes, templates }: ContatosWhatsAppProps) {
  const [search, setSearch] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<typeof clientes[0] | null>(null)

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search)
  )

  return (
    <>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar contato..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {clientes.length === 0
              ? 'Nenhum cliente com WhatsApp cadastrado'
              : 'Nenhum contato encontrado'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {filtrados.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {c.nome[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.telefone}</p>
              </div>
              <button
                onClick={() => setClienteSelecionado(c)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium transition-colors flex-shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Enviar
              </button>
            </div>
          ))}
        </div>
      )}

      {clienteSelecionado && (
        <WhatsAppModal
          isOpen={!!clienteSelecionado}
          onClose={() => setClienteSelecionado(null)}
          cliente={clienteSelecionado}
        />
      )}
    </>
  )
}
