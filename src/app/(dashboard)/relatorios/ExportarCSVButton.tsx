'use client'

import Button from '@/components/ui/Button'
import { Download } from 'lucide-react'

interface Servico {
  data_inicio: string
  tipo_servico: string
  status: string
  pagamento_status: string
  valor?: number
  forma_pagamento?: string
  cliente?: { nome: string } | null
}

export default function ExportarCSVButton({
  servicos, mes, ano,
}: {
  servicos: Servico[]
  mes: number
  ano: number
}) {
  const exportar = () => {
    const STATUS_MAP: Record<string, string> = {
      concluido: 'Concluído', em_andamento: 'Em Andamento', pendente: 'Pendente'
    }
    const PAG_MAP: Record<string, string> = {
      pago: 'Pago', a_receber: 'A Receber', pendente: 'Sem cobrança'
    }
    const FORMA_MAP: Record<string, string> = {
      dinheiro: 'Dinheiro', pix: 'PIX', cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito', transferencia: 'Transferência', boleto: 'Boleto',
    }

    const header = ['Data', 'Cliente', 'Serviço', 'Status', 'Pagamento', 'Forma de Pagamento', 'Valor (R$)']
    const rows = servicos.map(s => [
      s.data_inicio,
      s.cliente?.nome || '',
      s.tipo_servico,
      STATUS_MAP[s.status] || s.status,
      PAG_MAP[s.pagamento_status] || s.pagamento_status,
      s.forma_pagamento ? FORMA_MAP[s.forma_pagamento] || s.forma_pagamento : '',
      s.valor ? s.valor.toFixed(2).replace('.', ',') : '0,00',
    ])

    const csv = [header, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${String(mes).padStart(2, '0')}-${ano}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={exportar}>
      <Download className="w-4 h-4" />
      Exportar CSV
    </Button>
  )
}
