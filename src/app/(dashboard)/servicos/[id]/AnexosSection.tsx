'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Download, Trash2, File, FileText, Image, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import ConfirmComSenhaDialog from '@/components/ui/ConfirmComSenhaDialog'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { Anexo } from '@/types'

interface AnexosSectionProps {
  servicoId: string
  anexos: Anexo[]
}

function getFileIcon(tipo: string) {
  if (tipo.startsWith('image/')) return Image
  if (tipo === 'application/pdf') return FileText
  return File
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AnexosSection({ servicoId, anexos: initialAnexos }: AnexosSectionProps) {
  const router = useRouter()
  const [anexos, setAnexos] = useState(initialAnexos)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmAnexo, setConfirmAnexo] = useState<Anexo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const TIPOS_PERMITIDOS = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const supabase = createClient()

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} excede o limite de 10MB.`)
        continue
      }

      if (!TIPOS_PERMITIDOS.includes(file.type)) {
        toast.error(`Tipo de arquivo não permitido: ${file.name}`)
        continue
      }

      // Sanitiza o nome do arquivo: remove caracteres especiais
      const nomeSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${servicoId}/${Date.now()}-${nomeSeguro}`

      // Usa o MIME type real detectado pelo browser, não o declarado pelo servidor
      const tipoSeguro = TIPOS_PERMITIDOS.includes(file.type) ? file.type : 'application/octet-stream'

      const { error: uploadError } = await supabase.storage
        .from('anexos')
        .upload(path, file, { contentType: tipoSeguro })

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}.`)
        continue
      }

      const { data: urlData } = supabase.storage.from('anexos').getPublicUrl(path)

      const { data: anexo, error: dbError } = await supabase.from('anexos').insert({
        servico_id: servicoId,
        nome: file.name,
        url: path,
        tipo: file.type,
        tamanho: file.size,
      }).select().single()

      if (dbError) {
        toast.error(`Erro ao registrar ${file.name}.`)
      } else {
        setAnexos(prev => [...prev, anexo])
        toast.success(`${file.name} enviado!`)
      }
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  const handleDownload = async (anexo: Anexo) => {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('anexos').download(anexo.url)
    if (error || !data) {
      toast.error('Erro ao baixar arquivo.')
      return
    }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = anexo.nome
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!confirmAnexo) return
    setDeleting(true)
    const supabase = createClient()

    await supabase.storage.from('anexos').remove([confirmAnexo.url])
    const { error } = await supabase.from('anexos').delete().eq('id', confirmAnexo.id)

    if (error) {
      toast.error('Erro ao excluir anexo.')
    } else {
      setAnexos(prev => prev.filter(a => a.id !== confirmAnexo.id))
      toast.success('Anexo excluído!')
    }
    setDeleting(false)
    setConfirmAnexo(null)
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Enviando...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Upload className="w-8 h-8" />
            <p className="text-sm font-medium">Clique para enviar documentos</p>
            <p className="text-xs">PDF, imagens, Word — até 10MB por arquivo</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {anexos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum anexo ainda</p>
      ) : (
        <div className="space-y-2">
          {anexos.map(anexo => {
            const Icon = getFileIcon(anexo.tipo)
            return (
              <div key={anexo.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{anexo.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(anexo.tamanho)}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDownload(anexo)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmAnexo(anexo)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmComSenhaDialog
        isOpen={!!confirmAnexo}
        onClose={() => setConfirmAnexo(null)}
        onConfirm={handleDelete}
        title="Excluir anexo"
        message={`Deseja excluir "${confirmAnexo?.nome}"? Esta ação não pode ser desfeita. Digite sua senha para confirmar.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
