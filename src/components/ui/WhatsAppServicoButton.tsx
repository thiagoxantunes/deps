'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import WhatsAppModal from './WhatsAppModal'
import Button from './Button'

interface WhatsAppServicoButtonProps {
  cliente: {
    id: string
    nome: string
    telefone: string
  }
  contexto: {
    servicoId: string
    tipoServico: string
    valor?: number | null
    placa?: string | null
    comprovanteUrl?: string | null
  }
}

export default function WhatsAppServicoButton({ cliente, contexto }: WhatsAppServicoButtonProps) {
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
        contexto={{
          servicoId: contexto.servicoId,
          tipoServico: contexto.tipoServico,
          valor: contexto.valor ?? undefined,
          placa: contexto.placa ?? undefined,
          comprovanteUrl: contexto.comprovanteUrl ?? undefined,
        }}
      />
    </>
  )
}
