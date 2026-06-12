'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  orcamento: {
    numero: number
    status: string
    observacoes?: string | null
    validade?: string | null
    data_criacao: string
    valor_total: number
    itens: { descricao: string; valor: number }[]
  }
  cliente: {
    nome: string
    cpf_cnpj?: string | null
    telefone?: string | null
    email?: string | null
  }
  veiculo?: {
    placa: string
    modelo: string
  } | null
}

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function OrcamentoPDFButton({ orcamento, cliente, veiculo }: Props) {
  const [loading, setLoading] = useState(false)

  const handleGerar = async () => {
    setLoading(true)
    try {
      const { gerarOrcamentoPDF } = await import('@/utils/pdf')
      const doc = gerarOrcamentoPDF(orcamento, cliente, veiculo || null)
      const nome = `orcamento-${String(orcamento.numero).padStart(4, '0')}-${slugify(cliente.nome)}.pdf`
      doc.save(nome)
      toast.success('PDF gerado!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar PDF.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleGerar} loading={loading}>
      <Download className="w-4 h-4" />
      Baixar PDF
    </Button>
  )
}
