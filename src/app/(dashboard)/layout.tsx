import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { differenceInDays } from 'date-fns'
import type { NotificacaoItem } from '@/types'

async function getNotificacoes(): Promise<NotificacaoItem[]> {
  const supabase = await createClient()
  const hoje = new Date()
  const notificacoes: NotificacaoItem[] = []

  // Serviços recorrentes ativos (busca todos e filtra por antecedência)
  const { data: recorrentes } = await supabase
    .from('servicos_recorrentes')
    .select('id, tipo_servico, proximo_vencimento, antecedencia_dias, valor, cliente:clientes(id, nome)')
    .eq('ativo', true)
    .order('proximo_vencimento', { ascending: true })
    .limit(50)

  for (const r of recorrentes || []) {
    const dias = differenceInDays(new Date(r.proximo_vencimento + 'T00:00:00'), hoje)
    if (dias <= r.antecedencia_dias) {
      const clienteRaw = r.cliente as unknown
      const cliente = (Array.isArray(clienteRaw) ? clienteRaw[0] : clienteRaw) as { id: string; nome: string } | null
      notificacoes.push({
        id: `rec_${r.id}`,
        tipo: 'recorrente',
        titulo: r.tipo_servico,
        descricao: dias < 0
          ? `Vencido há ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''} — ${cliente?.nome || ''}`
          : `Vence em ${dias} dia${dias !== 1 ? 's' : ''} — ${cliente?.nome || ''}`,
        href: '/recorrentes',
        diasRestantes: dias,
        valor: r.valor ?? undefined,
      })
    }
  }

  // Pagamentos pendentes (a_receber)
  const { data: pagamentos } = await supabase
    .from('servicos')
    .select('id, tipo_servico, valor, cliente:clientes(nome)')
    .eq('pagamento_status', 'a_receber')
    .order('created_at', { ascending: true })
    .limit(20)

  for (const p of pagamentos || []) {
    const clienteRaw = p.cliente as unknown
    const cliente = (Array.isArray(clienteRaw) ? clienteRaw[0] : clienteRaw) as { nome: string } | null
    notificacoes.push({
      id: `pag_${p.id}`,
      tipo: 'pagamento',
      titulo: p.tipo_servico,
      descricao: `Pagamento pendente — ${cliente?.nome || ''}`,
      href: `/servicos/${p.id}`,
      diasRestantes: 0,
      valor: p.valor ?? undefined,
    })
  }

  return notificacoes
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const notificacoes = await getNotificacoes()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar userEmail={user.email} notificacoes={notificacoes} />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
