import { ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react'
import { formatCurrency } from '@/utils/cn'

interface SaldoConta {
  id: string
  nome: string
  entradas: number
  saidas: number
  saldo: number
}

interface Props {
  saldos: SaldoConta[]
}

export default function SaldoRealContas({ saldos }: Props) {
  const totalEntradas = saldos.reduce((s, c) => s + c.entradas, 0)
  const totalSaidas   = saldos.reduce((s, c) => s + c.saidas, 0)
  const totalSaldo    = totalEntradas - totalSaidas

  if (saldos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-600">
        <p className="text-sm">Nenhuma conta cadastrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Total geral */}
      <div className={`p-4 rounded-xl border ${
        totalSaldo >= 0
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${
          totalSaldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>Saldo Total (todas as contas)</p>
        <p className={`text-3xl font-bold mt-1 ${
          totalSaldo >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
        }`}>{formatCurrency(totalSaldo)}</p>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <ArrowUpCircle className="w-3.5 h-3.5 text-green-500" />
            Entradas: {formatCurrency(totalEntradas)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
            Saídas: {formatCurrency(totalSaidas)}
          </span>
        </div>
      </div>

      {/* Por conta */}
      <div className="space-y-3">
        {saldos.map(c => (
          <div
            key={c.id}
            className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.nome}</p>
              <span className={`text-sm font-bold ${
                c.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {c.saldo >= 0 ? '+' : ''}{formatCurrency(c.saldo)}
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">Entradas</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(c.entradas)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowDownCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">Saídas</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(c.saidas)}</p>
                </div>
              </div>
            </div>

            {/* Barra de proporção */}
            {(c.entradas > 0 || c.saidas > 0) && (
              <div className="mt-2.5 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                {c.entradas > 0 && (
                  <div
                    className="h-full bg-green-400 rounded-l-full"
                    style={{ width: `${Math.min(100, (c.entradas / (c.entradas + c.saidas)) * 100)}%` }}
                  />
                )}
                {c.saidas > 0 && (
                  <div
                    className="h-full bg-red-400 rounded-r-full"
                    style={{ width: `${Math.min(100, (c.saidas / (c.entradas + c.saidas)) * 100)}%` }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
