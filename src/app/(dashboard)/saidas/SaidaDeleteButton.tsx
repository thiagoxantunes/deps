'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { revalidarSaidas } from './actions'
import ConfirmComSenhaDialog from '@/components/ui/ConfirmComSenhaDialog'

export default function SaidaDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('saidas').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir.')
      setLoading(false)
      return
    }
    toast.success('Saída excluída.')
    await revalidarSaidas()
    router.refresh()
    setAberto(false)
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <ConfirmComSenhaDialog
        isOpen={aberto}
        onClose={() => setAberto(false)}
        onConfirm={handleDelete}
        title="Excluir saída"
        message="Esta ação é permanente e não pode ser desfeita. Digite sua senha para confirmar."
        confirmLabel="Excluir"
        loading={loading}
      />
    </>
  )
}
