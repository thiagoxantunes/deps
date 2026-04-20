import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCPFCNPJ(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatPlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
}

export const TIPOS_SERVICO = [
  'Transferência de Propriedade',
  'Licenciamento',
  'IPVA',
  'Multa',
  'Emplacamento',
  'Transferência de Estado',
  'Baixa de Veículo',
  'Segunda Via de CRV',
  'Segunda Via de CRLV',
  'Renovação de CNH',
  'Primeira Habilitação',
  'Adição de Categoria',
  'Recurso de Multa',
  'Outro',
]

export const TAG_LABELS: Record<string, string> = {
  vip: 'VIP',
  inadimplente: 'Inadimplente',
  recorrente: 'Recorrente',
  novo: 'Novo',
}

export const TAG_COLORS: Record<string, string> = {
  vip: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  inadimplente: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  recorrente: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  novo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export const STATUS_LABELS: Record<string, string> = {
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  pendente: 'Pendente',
}

export const STATUS_COLORS: Record<string, string> = {
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  concluido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

export const PAGAMENTO_STATUS_LABELS: Record<string, string> = {
  pago: 'Pago',
  a_receber: 'A Receber',
  pendente: 'Sem Cobrança',
}

export const PAGAMENTO_STATUS_COLORS: Record<string, string> = {
  pago: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  a_receber: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  pendente: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

export const PERIODICIDADE_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

export const PERIODICIDADE_MESES: Record<string, number> = {
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  semestral: 6,
  anual: 12,
}

export const CATEGORIAS_DOCUMENTO: Record<string, string> = {
  rg: 'RG',
  cpf: 'CPF',
  cnh: 'CNH',
  crv: 'CRV / Documento do Veículo',
  crlv: 'CRLV / Licenciamento',
  comprovante_residencia: 'Comprovante de Residência',
  procuracao: 'Procuração',
  contrato: 'Contrato',
  laudo: 'Laudo / Vistoria',
  outro: 'Outro',
}
