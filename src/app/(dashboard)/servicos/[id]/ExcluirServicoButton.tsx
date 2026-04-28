'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConfirmComSenhaDialog from '@/components/ui/ConfirmComSenhaDialog'
import toast from 'react-hot-toast'

export default function ExcluirServicoButton({ servicoId }: { servicoId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleExcluir = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('servicos').delete().eq('id', servicoId)
    if (error) {
      toast.error('Erro ao excluir serviço.')
    } else {
      toast.success('Serviço excluído!')
      router.push('/servicos')
      router.refresh()
    }
    setLoading(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Excluir
      </button>

      <ConfirmComSenhaDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleExcluir}
        title="Excluir serviço"
        message="Esta ação é permanente e removerá o serviço e todos os seus anexos. Digite sua senha para confirmar."
        confirmLabel="Excluir"
        loading={loading}
      />
    </>
  )
}
