'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, Download, Trash2, File, FileText, Image,
  Loader2, FolderOpen, ChevronDown, ChevronUp
} from 'lucide-react'
import { CATEGORIAS_DOCUMENTO } from '@/utils/cn'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { Documento, CategoriaDocumento } from '@/types'
import ConfirmComSenhaDialog from './ConfirmComSenhaDialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DocumentosSectionProps {
  clienteId?: string
  veiculoId?: string
  documentos: Documento[]
  titulo?: string
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

const CATEGORIA_OPTIONS = Object.entries(CATEGORIAS_DOCUMENTO).map(([value, label]) => ({ value, label }))

export default function DocumentosSection({
  clienteId, veiculoId, documentos: initial, titulo = 'Documentos'
}: DocumentosSectionProps) {
  const router = useRouter()
  const [docs, setDocs] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDoc, setConfirmDoc] = useState<Documento | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaDocumento>('outro')
  const [observacoes, setObservacoes] = useState('')
  const [showForm, setShowForm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Agrupa por categoria
  const porCategoria = docs.reduce((acc: Record<string, Documento[]>, doc) => {
    if (!acc[doc.categoria]) acc[doc.categoria] = []
    acc[doc.categoria].push(doc)
    return acc
  }, {})

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const supabase = createClient()

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} excede 20MB.`)
        continue
      }

      const prefix = clienteId ? `cliente_${clienteId}` : `veiculo_${veiculoId}`
      const path = `${prefix}/${categoriaSelecionada}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(path, file, { contentType: file.type })

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}.`)
        continue
      }

      const { data: doc, error: dbError } = await supabase.from('documentos').insert({
        cliente_id: clienteId || null,
        veiculo_id: veiculoId || null,
        nome: file.name,
        categoria: categoriaSelecionada,
        url: path,
        tipo: file.type,
        tamanho: file.size,
        observacoes: observacoes.trim() || null,
      }).select().single()

      if (dbError) {
        toast.error(`Erro ao registrar ${file.name}.`)
      } else {
        setDocs(prev => [...prev, doc])
        toast.success(`${file.name} enviado!`)
      }
    }

    setUploading(false)
    setObservacoes('')
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  const handleDownload = async (doc: Documento) => {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('documentos').download(doc.url)
    if (error || !data) { toast.error('Erro ao baixar arquivo.'); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.nome
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!confirmDoc) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.storage.from('documentos').remove([confirmDoc.url])
    const { error } = await supabase.from('documentos').delete().eq('id', confirmDoc.id)
    if (error) {
      toast.error('Erro ao excluir documento.')
    } else {
      setDocs(prev => prev.filter(d => d.id !== confirmDoc.id))
      toast.success('Documento excluído!')
    }
    setDeleting(false)
    setConfirmDoc(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{titulo}</h3>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {docs.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Upload className="w-3.5 h-3.5" />
          Enviar documento
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Formulário de upload */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={categoriaSelecionada}
                onChange={e => setCategoriaSelecionada(e.target.value as CategoriaDocumento)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIA_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observação (opcional)
              </label>
              <input
                type="text"
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Ex: vencimento 12/2026"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div
            className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-center"
            onClick={() => !uploading && inputRef.current?.click()}
          >
            {uploading ? (
              <><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /><p className="text-sm text-blue-600">Enviando...</p></>
            ) : (
              <><Upload className="w-6 h-6 text-blue-500" /><p className="text-sm text-blue-600 font-medium">Clique para selecionar arquivos</p><p className="text-xs text-gray-400">PDF, imagens, Word, Excel — até 20MB</p></>
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
        </div>
      )}

      {/* Lista por categoria */}
      {docs.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum documento vinculado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(porCategoria).map(([categoria, categoriaDoc]) => (
            <div key={categoria}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {CATEGORIAS_DOCUMENTO[categoria] || categoria} ({categoriaDoc.length})
              </p>
              <div className="space-y-2">
                {categoriaDoc.map(doc => {
                  const Icon = getFileIcon(doc.tipo)
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatBytes(doc.tamanho)} • {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          {doc.observacoes && ` • ${doc.observacoes}`}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          title="Baixar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDoc(doc)}
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
            </div>
          ))}
        </div>
      )}

      <ConfirmComSenhaDialog
        isOpen={!!confirmDoc}
        onClose={() => setConfirmDoc(null)}
        onConfirm={handleDelete}
        title="Excluir documento"
        message={`Deseja excluir "${confirmDoc?.nome}"? Esta ação não pode ser desfeita. Digite sua senha para confirmar.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
