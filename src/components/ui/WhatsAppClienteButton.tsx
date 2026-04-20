'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import WhatsAppModal from './WhatsAppModal'
import Button from './Button'

interface WhatsAppClienteButtonProps {
  cliente: {
    id: string
    nome: string
    telefone: string
  }
}

export default function WhatsAppClienteButton({ cliente }: WhatsAppClienteButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <MessageCircle className="w-4 h-4 text-green-600" />
        WhatsApp
      </Button>

      <WhatsAppModal
        isOpen={open}
        onClose={() => setOpen(false)}
        cliente={cliente}
      />
    </>
  )
}
