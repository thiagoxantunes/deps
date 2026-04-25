'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency } from '@/utils/cn'

interface DiaData {
  dia: string
  receita: number
  a_receber: number
  total: number
}

interface MesData {
  mes: string
  receita: number
  a_receber: number
  total: number
}

interface Props {
  evolucao: MesData[]
  diasMes: DiaData[]
  diaAtivo: boolean
}

export default function RelatorioGraficoClient({ evolucao, diasMes, diaAtivo }: Props) {
  const [modo, setModo] = useState<'dias' | 'meses'>(diaAtivo ? 'dias' : 'dias')

  const tooltipFormatter = (v: number, name: string) => [
    formatCurrency(v),
    name === 'receita' ? 'Recebido' : 'A Receber',
  ]

  return (
    <div>
      {/* Tabs */}
      {!diaAtivo && (
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setModo('dias')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              modo === 'dias'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Dias do mês
          </button>
          <button
            onClick={() => setModo('meses')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              modo === 'meses'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Últimos 12 meses
          </button>
        </div>
      )}

      {/* Gráfico dias do mês */}
      {(modo === 'dias' || diaAtivo) && (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {diaAtivo ? 'Serviços do dia selecionado' : 'Receita por dia do mês selecionado'}
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={diasMes} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="dia"
                interval={0}
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
              />
              <Tooltip
                formatter={(v, name) => tooltipFormatter(Number(v), String(name))}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={label => `Dia ${label}`}
              />
              <Legend formatter={v => v === 'receita' ? 'Recebido' : 'A Receber'} />
              <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} name="receita" />
              <Bar dataKey="a_receber" fill="#f97316" radius={[4, 4, 0, 0]} name="a_receber" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Gráfico evolução mensal */}
      {modo === 'meses' && !diaAtivo && (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Receita dos últimos 12 meses
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evolucao} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
              />
              <Tooltip
                formatter={(v, name) => tooltipFormatter(Number(v), String(name))}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend formatter={v => v === 'receita' ? 'Recebido' : 'A Receber'} />
              <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} name="receita" />
              <Bar dataKey="a_receber" fill="#f97316" radius={[4, 4, 0, 0]} name="a_receber" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
