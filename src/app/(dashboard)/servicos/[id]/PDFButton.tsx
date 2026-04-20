'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Download, Upload, Check, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface PDFButtonProps {
  servicoId: string
  servico: {
    tipo_servico: string
    descricao?: string | null
    data_inicio: string
    data_conclusao?: string | null
    status: string
    valor?: number | null
    conta_nome?: string | null
  }
  cliente: {
    nome: string
    cpf_cnpj?: string | null
    telefone?: string | null
    email?: string | null
    endereco?: string | null
  }
  comprovanteUrl?: string | null
}

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Garante que o bucket existe, criando-o se necessário */
async function garantirBucket(supabase: ReturnType<typeof createClient>) {
  // Tenta criar — se já existir, ignora o erro
  const { error } = await supabase.storage.createBucket('comprovantes', {
    public: true,
    fileSizeLimit: 10485760, // 10 MB
  })
  // "already exists" é ok; qualquer outro erro retornamos
  if (error && !error.message.toLowerCase().includes('already exist')) {
    return error
  }
  return null
}

export default function PDFButton({ servicoId, servico, cliente, comprovanteUrl: initialUrl }: PDFButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState(initialUrl || null)
  const [copiado, setCopiado] = useState(false)

  const handleGerar = async () => {
    setLoading(true)
    try {
      const { gerarComprovanteServico } = await import('@/utils/pdf')
      const doc = gerarComprovanteServico(servico, cliente)
      const nomeArquivo = `comprovante-${slugify(servico.tipo_servico)}-${slugify(cliente.nome)}.pdf`

      // Download local imediato
      doc.save(nomeArquivo)

      const supabase = createClient()
      const storagePath = `servicos/${servicoId}/${nomeArquivo}`

      // Garante que o bucket existe antes de fazer upload
      const bucketError = await garantirBucket(supabase)
      if (bucketError) {
        console.warn('Não foi possível criar/verificar o bucket:', bucketError)
        // Continua mesmo assim — o bucket pode já existir e o erro ser de permissão na criação
      }

      // Upload para o Storage
      const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(storagePath, pdfBlob, { contentType: 'application/pdf', upsert: true })

      if (uploadError) {
        console.error('Erro no upload do PDF:', uploadError)
        toast.error(
          `PDF baixado localmente, mas falha no upload: ${uploadError.message}`,
          { duration: 7000 }
        )
        setLoading(false)
        return
      }

      // URL pública
      const { data: urlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl

      // Salva URL no serviço
      const { error: updateError } = await supabase
        .from('servicos')
        .update({ comprovante_url: publicUrl })
        .eq('id', servicoId)

      if (updateError) {
        console.error('Erro ao salvar URL no serviço:', updateError)
        toast.error(`Upload feito, mas erro ao vincular ao serviço: ${updateError.message}`)
        setLoading(false)
        return
      }

      setUrl(publicUrl)
      toast.success('PDF gerado e salvo no serviço!')
      router.refresh()
    } catch (err) {
      console.error('Erro inesperado ao gerar PDF:', err)
      toast.error('Erro inesperado ao gerar PDF.')
    }
    setLoading(false)
  }

  const copiarLink = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
    toast.success('Link copiado!')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={handleGerar} loading={loading}>
        {url ? <Upload className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        {url ? 'Regerar PDF' : 'Gerar PDF'}
      </Button>

      {url && (
        <>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </a>
          <Button variant="ghost" size="sm" onClick={copiarLink}>
            {copiado ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
            {copiado ? 'Copiado!' : 'Copiar link'}
          </Button>
        </>
      )}
    </div>
  )
}
