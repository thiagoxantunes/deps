'use client'

import { cn } from '@/utils/cn'
import {
  LayoutDashboard, Users, Car, FileText, Search,
  LogOut, Moon, Sun, Menu, X, ChevronRight, BarChart2, RefreshCw, MessageCircle, Wallet, TrendingDown, Globe
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import NotificacoesDropdown from '@/components/ui/NotificacoesDropdown'
import type { NotificacaoItem } from '@/types'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clientes', icon: Users, label: 'Clientes' },
  { href: '/veiculos', icon: Car, label: 'Veículos' },
  { href: '/servicos', icon: FileText, label: 'Serviços' },
  { href: '/recorrentes', icon: RefreshCw, label: 'Recorrentes' },
  { href: '/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { href: '/contas', icon: Wallet, label: 'Contas' },
  { href: '/saidas', icon: TrendingDown, label: 'Saídas' },
  { href: '/relatorios', icon: BarChart2, label: 'Relatórios' },
  { href: '/busca', icon: Search, label: 'Busca' },
  { href: '/landing', icon: Globe, label: 'Landing Page' },
]

interface SidebarProps {
  userEmail?: string
  notificacoes?: NotificacaoItem[]
}

export default function Sidebar({ userEmail, notificacoes = [] }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDark = () => {
    setDark(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const notifCount = notificacoes.length
  const recorrentesCount = notificacoes.filter(n => n.tipo === 'recorrente').length

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Cone icon with brand orange */}
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight tracking-tight">
              Thiago Antunes
            </h1>
            <p className="text-[11px] text-orange-500 dark:text-orange-400 font-medium uppercase tracking-wider truncate">
              Assessoria de Trânsito
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          const isRecorrentes = item.href === '/recorrentes'
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 flex-shrink-0 transition-colors',
                active ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
              )} />
              <span className="flex-1">{item.label}</span>
              {isRecorrentes && recorrentesCount > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {recorrentesCount > 9 ? '9+' : recorrentesCount}
                </span>
              )}
              {active && !isRecorrentes && (
                <ChevronRight className="w-4 h-4 opacity-40 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {userEmail && (
          <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 truncate">
            {userEmail}
          </div>
        )}
        <button
          onClick={toggleDark}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition-colors"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {dark ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {loggingOut ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
            <Car className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm text-gray-900 dark:text-white leading-none block">
              Thiago Antunes
            </span>
            <span className="text-[10px] text-orange-500 font-medium uppercase tracking-wider">
              Assessoria de Trânsito
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificacoesDropdown notificacoes={notificacoes} />
          <button
            onClick={() => setMobileOpen(prev => !prev)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        'lg:hidden fixed top-0 left-0 h-full w-64 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform pt-14',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="absolute top-[18px] right-4 z-10">
          <NotificacoesDropdown notificacoes={notificacoes} align="left" />
        </div>
        <NavContent />
      </aside>
    </>
  )
}
