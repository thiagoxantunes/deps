'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from './Modal'
import Button from './Button'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'

interface ConfirmComSenhaDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export default function ConfirmComSenhaDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Excluir', loading: externalLoading,
}: ConfirmComSenhaDialogProps) {
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [verificando, setVerificando] = useState(false)

  const loading = verificando || externalLoading

  const handleClose = () => {
    setSenha('')
    setErro('')
    onClose()
  }

  const handleConfirm = async () => {
    if (!senha.trim()) {
      setErro('Digite sua senha para confirmar.')
      return
    }

    setVerificando(true)
    setErro('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      setErro('Sessão inválida. Faça login novamente.')
      setVerificando(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senha,
    })

    setVerificando(false)

    if (error) {
      setErro('Senha incorreta. Tente novamente.')
      setSenha('')
      return
    }

    setSenha('')
    setErro('')
    await onConfirm()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirme sua senha para continuar
          </label>
          <div className="relative">
            <input
              type={showSenha ? 'text' : 'password'}
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro('') }}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              placeholder="••••••••"
              autoFocus
              className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 ${erro ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            />
            <button
              type="button"
              onClick={() => setShowSenha(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {erro && <p className="mt-1 text-xs text-red-500">{erro}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
