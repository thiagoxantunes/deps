'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { seedTemplates } from './seed-templates-action'

export default function RestaurarTemplatesButton() {
  const [loading, setLoading] = useState(false)

  const handleRestaurar = async () => {
    if (!confirm('Isso vai apagar todos os templates atuais e restaurar os padrões com emojis corretos. Continuar?')) return
    setLoading(true)
    try {
      const { total } = await seedTemplates()
      toast.success(`${total} templates restaurados com sucesso!`)
    } catch (err) {
      toast.error('Erro ao restaurar templates.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRestaurar}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-xs font-medium transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Restaurando...' : 'Restaurar templates padrão'}
    </button>
  )
}
