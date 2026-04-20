import { createClient } from '@/lib/supabase/server'
import { MessageCircle, Send, FileText, Users } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import TemplatesManager from './TemplatesManager'
import ContatosWhatsApp from './ContatosWhatsApp'
import RestaurarTemplatesButton from './RestaurarTemplatesButton'

export default async function WhatsAppPage() {
  const supabase = await createClient()

  const [
    { data: mensagens },
    { data: templates },
    { data: clientes },
    { count: totalClientes },
    { count: totalEnviados },
  ] = await Promise.all([
    supabase.from('mensagens_enviadas')
      .select('*, cliente:clientes(id, nome), template:mensagens_templates(nome)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('mensagens_templates')
      .select('*')
      .eq('ativo', true)
      .order('categoria'),
    supabase.from('clientes')
      .select('id, nome, telefone, whatsapp')
      .eq('whatsapp', true)
      .order('nome'),
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('whatsapp', true),
    supabase.from('mensagens_enviadas').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-7 h-7 text-green-500" />
          WhatsApp
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Envie mensagens aos clientes com modelos pré-definidos — o WhatsApp abre com a mensagem já preenchida
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalClientes || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Contatos com WhatsApp</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEnviados || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Mensagens registradas</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{templates?.length || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Modelos ativos</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contatos com WhatsApp — envio rápido */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Envio Rápido</CardTitle>
              <Link href="/clientes" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Gerenciar clientes
              </Link>
            </CardHeader>
            <ContatosWhatsApp
              clientes={(clientes || []) as { id: string; nome: string; telefone: string; whatsapp: boolean }[]}
              templates={(templates || []) as import('@/types').MensagemTemplate[]}
            />
          </Card>
        </div>

        {/* Histórico de mensagens */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Envios</CardTitle>
            </CardHeader>
            {!mensagens?.length ? (
              <div className="text-center py-8">
                <Send className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma mensagem enviada ainda</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Quando você enviar mensagens, elas aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {mensagens.map((m: Record<string, unknown>) => {
                  const clienteM = m.cliente as { id: string; nome: string } | null
                  const templateM = m.template as { nome: string } | null
                  return (
                    <div key={m.id as string} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          {clienteM ? (
                            <Link
                              href={`/clientes/${clienteM.id}`}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
                            >
                              {clienteM.nome}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {m.telefone as string}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                            {format(new Date(m.created_at as string), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {templateM && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Modelo: {templateM.nome}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                          {(m.mensagem as string).split('\n')[0]}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Gerenciar Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos de Mensagem</CardTitle>
          <RestaurarTemplatesButton />
        </CardHeader>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Use <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{{nome}}'}</code>{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{{servico}}'}</code>{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{{valor}}'}</code>{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{{placa}}'}</code>
        </p>
        <TemplatesManager templates={(templates || []) as import('@/types').MensagemTemplate[]} />
      </Card>
    </div>
  )
}
