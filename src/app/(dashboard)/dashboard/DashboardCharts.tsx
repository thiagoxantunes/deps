'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '@/utils/cn'

interface ChartData {
  mes: string
  receita: number
  servicos: number
}

export default function DashboardCharts({ data }: { data: ChartData[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-gray-500" />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} className="text-gray-500" />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v)), 'Receita']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorReceita)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serviços por Mês</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(v) => [Number(v), 'Serviços']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="servicos" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
