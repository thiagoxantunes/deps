'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Bell, RefreshCw, DollarSign, AlertTriangle, Clock,
  CheckCircle2, X, Calendar, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import type { NotificacaoItem } from '@/types'
import { formatCurrency } from '@/utils/cn'

interface NotificacoesDropdownProps {
  notificacoes: NotificacaoItem[]
  /** 'right' = abre para esquerda (top bar mobile)
   *  'left'  = abre para direita (sidebar desktop) */
  align?: 'right' | 'left'
}

function ItemRecorrente({ n, onClose }: { n: NotificacaoItem; onClose: () => void }) {
  const vencido = n.diasRestantes < 0
  const urgente = !vencido && n.diasRestantes <= 7

  return (
    <Link
      href={n.href}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
    >
      {/* Ícone urgência */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        vencido ? 'bg-red-100 dark:bg-red-900/30' :
        urgente ? 'bg-orange-100 dark:bg-orange-900/30' :
        'bg-blue-100 dark:bg-blue-900/30'
      }`}>
        {vencido
          ? <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          : urgente
          ? <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          : <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        }
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.titulo}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.descricao}</p>
        {n.valor && (
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-0.5">
            {formatCurrency(n.valor)}
          </p>
        )}
      </div>

      {/* Badge dias */}
      <div className="flex-shrink-0">
        {vencido ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 whitespace-nowrap">
            Vencido
          </span>
        ) : (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
            urgente
              ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          }`}>
            {n.diasRestantes}d
          </span>
        )}
      </div>
    </Link>
  )
}

function ItemPagamento({ n, onClose }: { n: NotificacaoItem; onClose: () => void }) {
  return (
    <Link
      href={n.href}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
    >
      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
        <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.titulo}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.descricao}</p>
        {n.valor && (
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
            {formatCurrency(n.valor)}
          </p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </Link>
  )
}

export default function NotificacoesDropdown({
  notificacoes,
  align = 'right',
}: NotificacoesDropdownProps) {
  const [open, setOpen] = useState(false)
  const [vistas, setVistas] = useState<Set<string>>(new Set())
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const naoVistas = notificacoes.filter(n => !vistas.has(n.id))
  const count = naoVistas.length

  const recorrentes = notificacoes.filter(n => n.tipo === 'recorrente')
  const pagamentos = notificacoes.filter(n => n.tipo === 'pagamento')

  const PANEL_WIDTH = 320

  const handleOpen = () => {
    // Calcula posição fixa baseada na posição real do botão na tela
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const top = rect.bottom + 8
      const viewportW = window.innerWidth
      const margin = 8

      let left: number
      if (align === 'left') {
        // Abre para a direita do botão (sidebar desktop)
        left = rect.left
      } else {
        // Alinha pela direita do botão, mas garante que não ultrapassa a borda esquerda
        left = Math.max(margin, rect.right - PANEL_WIDTH)
      }

      // Garante que não ultrapassa a borda direita
      left = Math.min(left, viewportW - PANEL_WIDTH - margin)

      setPanelStyle({ position: 'fixed', top, left, width: PANEL_WIDTH })
    }

    setOpen(p => !p)
    setVistas(new Set(notificacoes.map(n => n.id)))
  }

  return (
    <div className="relative" ref={ref}>
      {/* Botão sino */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        title="Notificações"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Painel com posição fixa calculada — nunca corta nas bordas */}
      {open && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            style={panelStyle}
            className="z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificações</h3>
                {notificacoes.length > 0 && (
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full font-medium">
                    {notificacoes.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Conteúdo */}
            {notificacoes.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tudo em dia!</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Nenhuma notificação pendente</p>
              </div>
            ) : (
              <div className="max-h-[75vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">

                {/* ── SEÇÃO 1: Serviços Recorrentes ── */}
                {recorrentes.length > 0 && (
                  <div>
                    {/* Header da seção — azul */}
                    <div className="flex items-center justify-between px-4 py-2 bg-blue-600 dark:bg-blue-700">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-100" />
                        <p className="text-xs font-bold text-white uppercase tracking-wide">
                          Serviços Recorrentes
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-500 dark:bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                        {recorrentes.length}
                      </span>
                    </div>
                    {recorrentes.map(n => (
                      <ItemRecorrente key={n.id} n={n} onClose={() => setOpen(false)} />
                    ))}
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10">
                      <Link
                        href="/recorrentes"
                        onClick={() => setOpen(false)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                      >
                        Ver todos os recorrentes
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* ── SEÇÃO 2: Pagamentos Pendentes ── */}
                {pagamentos.length > 0 && (
                  <div>
                    {/* Header da seção — laranja */}
                    <div className="flex items-center justify-between px-4 py-2 bg-orange-500 dark:bg-orange-600">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-orange-100" />
                        <p className="text-xs font-bold text-white uppercase tracking-wide">
                          Pagamentos Pendentes
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-orange-400 dark:bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                        {pagamentos.length}
                      </span>
                    </div>
                    {pagamentos.map(n => (
                      <ItemPagamento key={n.id} n={n} onClose={() => setOpen(false)} />
                    ))}
                    <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/10">
                      <Link
                        href="/servicos"
                        onClick={() => setOpen(false)}
                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium flex items-center gap-1"
                      >
                        Ver todos os serviços
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
