'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Check, X, Eye, EyeOff, List } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/utils/cn'
import toast from 'react-hot-toast'
import {
  criarItemCatalogo,
  atualizarItemCatalogo,
  alternarAtivoCatalogo,
  excluirItemCatalogo,
} from './actions'
import type { CatalogoServico } from '@/types'

interface Props {
  itens: CatalogoServico[]
}

interface EditState {
  id: string | null  // null = criando novo
  nome: string
  valor: string
}

export default function CatalogoTable({ itens }: Props) {
  const router = useRouter()
  const [edit, setEdit] = useState<EditState | null>(null)
  const [loading, setLoading] = useState(false)
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<CatalogoServico | null>(null)

  const filtrados = mostrarInativos ? itens : itens.filter(i => i.ativo)

  const iniciarNovo = () => {
    setEdit({ id: null, nome: '', valor: '' })
  }

  const iniciarEditar = (item: CatalogoServico) => {
    setEdit({ id: item.id, nome: item.nome, valor: String(item.valor_padrao) })
  }

  const cancelar = () => setEdit(null)

  const parseValor = (s: string) => {
    const n = parseFloat(s.replace(/[^0-9,.]/g, '').replace(',', '.'))
    return isNaN(n) ? 0 : n
  }

  const salvar = async () => {
    if (!edit) return
    if (!edit.nome.trim()) {
      toast.error('Informe o nome do serviço')
      return
    }
    setLoading(true)
    try {
      const payload = {
        nome: edit.nome.trim(),
        valor_padrao: parseValor(edit.valor),
      }
      if (edit.id) {
        await atualizarItemCatalogo(edit.id, payload)
        toast.success('Item atualizado!')
      } else {
        await criarItemCatalogo(payload)
        toast.success('Item adicionado!')
      }
      setEdit(null)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const alternarAtivo = async (item: CatalogoServico) => {
    try {
      await alternarAtivoCatalogo(item.id, !item.ativo)
      toast.success(item.ativo ? 'Item desativado' : 'Item ativado')
      router.refresh()
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  const excluir = async () => {
    if (!confirmExcluir) return
    setLoading(true)
    try {
      await excluirItemCatalogo(confirmExcluir.id)
      toast.success('Item excluído')
      router.refresh()
      setConfirmExcluir(null)
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={e => setMostrarInativos(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-400"
            />
            Mostrar inativos
          </label>
          <span className="text-xs text-gray-400">
            {filtrados.length} {filtrados.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        <Button onClick={iniciarNovo} disabled={!!edit}>
          <Plus className="w-4 h-4" />
          Adicionar item
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Serviço</th>
                <th className="text-right px-4 py-3 font-semibold w-40">Valor sugerido</th>
                <th className="text-center px-4 py-3 font-semibold w-24">Status</th>
                <th className="text-center px-4 py-3 font-semibold w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Linha de novo item (no topo) */}
              {edit && edit.id === null && (
                <tr className="bg-orange-50 dark:bg-orange-900/10">
                  <td className="px-4 py-3">
                    <Input
                      autoFocus
                      placeholder="Nome do serviço"
                      value={edit.nome}
                      onChange={e => setEdit({ ...edit, nome: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') salvar() }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      placeholder="0,00"
                      value={edit.valor}
                      onChange={e => setEdit({ ...edit, valor: e.target.value.replace(/[^0-9,.]/g, '') })}
                      onKeyDown={e => { if (e.key === 'Enter') salvar() }}
                      className="text-right"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Novo
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={salvar}
                        disabled={loading}
                        className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 disabled:opacity-50"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelar}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Itens existentes */}
              {filtrados.length === 0 && !edit && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <List className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Nenhum item no catálogo</p>
                    <button onClick={iniciarNovo} className="text-orange-600 dark:text-orange-400 hover:underline text-sm font-medium mt-1">
                      Adicionar primeiro item →
                    </button>
                  </td>
                </tr>
              )}

              {filtrados.map(item => {
                const editando = edit?.id === item.id
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${editando ? 'bg-orange-50 dark:bg-orange-900/10' : !item.ativo ? 'opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                  >
                    <td className="px-4 py-3">
                      {editando ? (
                        <Input
                          autoFocus
                          value={edit!.nome}
                          onChange={e => setEdit({ ...edit!, nome: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') salvar() }}
                        />
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">{item.nome}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editando ? (
                        <Input
                          value={edit!.valor}
                          onChange={e => setEdit({ ...edit!, valor: e.target.value.replace(/[^0-9,.]/g, '') })}
                          onKeyDown={e => { if (e.key === 'Enter') salvar() }}
                          className="text-right"
                        />
                      ) : (
                        <span className={`font-semibold ${item.valor_padrao > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                          {item.valor_padrao > 0 ? formatCurrency(item.valor_padrao) : 'a definir'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!editando && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          item.ativo
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400'
                        }`}>
                          {item.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editando ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={salvar}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 disabled:opacity-50"
                            title="Salvar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelar}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => iniciarEditar(item)}
                            disabled={!!edit}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alternarAtivo(item)}
                            disabled={!!edit}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={item.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {item.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setConfirmExcluir(item)}
                            disabled={!!edit}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmExcluir}
        onClose={() => setConfirmExcluir(null)}
        onConfirm={excluir}
        title="Excluir item do catálogo?"
        message={`Deseja excluir "${confirmExcluir?.nome}"? Esta ação é permanente. Os orçamentos existentes não serão afetados.`}
        confirmLabel="Excluir"
        loading={loading}
      />
    </>
  )
}
