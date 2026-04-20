import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Globe, ExternalLink, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function LandingPageAdmin() {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('landing_config')
    .select('updated_at')
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="w-7 h-7 text-blue-500" />
          Landing Page
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerencie o conteúdo do site público
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Site no ar</span>
            </div>
            {config?.updated_at ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Última edição:{' '}
                {format(new Date(config.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Usando conteúdo padrão (nenhuma edição salva ainda)
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Visualizar site
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como editar o site</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <Edit3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Painel de edição integrado
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                O site possui um painel administrativo próprio. Para editar:
              </p>
              <ol className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-decimal list-inside">
                <li>Acesse o site público</li>
                <li>Role até o rodapé</li>
                <li>
                  Clique no ícone <strong>⚙</strong> discreto ao lado do copyright
                </li>
                <li>
                  Digite a senha do painel (padrão:{' '}
                  <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">
                    antunes2024
                  </code>
                  )
                </li>
                <li>Edite os textos, telefones e serviços</li>
                <li>
                  Clique em <strong>Salvar alterações</strong> — as mudanças ficam salvas no
                  servidor
                </li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { icon: '📞', label: 'WhatsApp', desc: 'Números de contato e links' },
              { icon: '📊', label: 'Estatísticas', desc: 'Clientes, anos de experiência' },
              { icon: '🔧', label: 'Serviços', desc: 'Cards de serviços oferecidos' },
            ].map(item => (
              <div
                key={item.label}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
