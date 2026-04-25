'use client'

import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import MovimentacaoModal from './MovimentacaoModal'

export default function MovimentacaoButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        <ArrowRightLeft className="w-4 h-4" />
        Transferência / Depósito
      </button>
      <MovimentacaoModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
