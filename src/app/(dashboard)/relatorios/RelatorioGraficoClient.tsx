'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency } from '@/utils/cn'

interface Props {
  data: { mes: string; receita: number; a_receber: number; total: number }[]
}

export default function RelatorioGraficoClient({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={v => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
        />
        <Tooltip
          formatter={(v, name) => [
            formatCurrency(Number(v)),
            name === 'receita' ? 'Recebido' : 'A Receber',
          ]}
          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
        />
        <Legend
          formatter={v => v === 'receita' ? 'Recebido' : 'A Receber'}
        />
        <Bar dataKey="receita" fill="#22c55e" radius={[4, 4, 0, 0]} name="receita" />
        <Bar dataKey="a_receber" fill="#f97316" radius={[4, 4, 0, 0]} name="a_receber" />
      </BarChart>
    </ResponsiveContainer>
  )
}
