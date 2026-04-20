export type ClienteTag = 'vip' | 'inadimplente' | 'recorrente' | 'novo'

export interface Cliente {
  id: string
  nome: string
  telefone: string
  whatsapp: boolean
  email?: string
  endereco?: string
  cpf_cnpj: string
  observacoes?: string
  tags: ClienteTag[]
  created_at: string
  updated_at: string
}

export interface Veiculo {
  id: string
  cliente_id: string
  tipo: 'carro' | 'moto'
  placa: string
  renavam: string
  marca: string
  modelo: string
  ano: number
  cor?: string
  observacoes?: string
  created_at: string
}

export type StatusServico = 'em_andamento' | 'concluido' | 'pendente'
export type PagamentoStatus = 'pago' | 'a_receber' | 'pendente'
export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto'

export interface Servico {
  id: string
  cliente_id: string
  veiculo_id?: string
  tipo_servico: string
  descricao?: string
  data_inicio: string
  data_conclusao?: string
  status: StatusServico
  pagamento_status: PagamentoStatus
  valor?: number
  forma_pagamento?: FormaPagamento
  created_at: string
  updated_at: string
  cliente?: Cliente
  veiculo?: Veiculo
}

export interface Anexo {
  id: string
  servico_id: string
  nome: string
  url: string
  tipo: string
  tamanho: number
  created_at: string
}

export type CategoriaDocumento =
  | 'rg'
  | 'cpf'
  | 'cnh'
  | 'crv'
  | 'crlv'
  | 'comprovante_residencia'
  | 'procuracao'
  | 'contrato'
  | 'laudo'
  | 'outro'

export interface Documento {
  id: string
  cliente_id?: string
  veiculo_id?: string
  nome: string
  categoria: CategoriaDocumento
  url: string
  tipo: string
  tamanho: number
  observacoes?: string
  created_at: string
}

export interface DashboardStats {
  total_clientes: number
  servicos_em_andamento: number
  servicos_concluidos_mes: number
  receita_mensal: number
}

export type Periodicidade = 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'

export interface ServicoRecorrente {
  id: string
  cliente_id: string
  veiculo_id?: string
  tipo_servico: string
  descricao?: string
  valor?: number
  periodicidade: Periodicidade
  proximo_vencimento: string
  antecedencia_dias: number
  ativo: boolean
  observacoes?: string
  created_at: string
  updated_at: string
  cliente?: { id: string; nome: string }
  veiculo?: { id: string; placa: string; modelo: string }
}

export type CategoriaTemplate = 'servico' | 'pagamento' | 'documento' | 'geral'

export interface MensagemTemplate {
  id: string
  nome: string
  categoria: CategoriaTemplate
  conteudo: string
  ativo: boolean
  created_at: string
}

export interface MensagemEnviada {
  id: string
  cliente_id?: string
  servico_id?: string
  template_id?: string
  mensagem: string
  telefone: string
  created_at: string
  cliente?: { id: string; nome: string }
  servico?: { tipo_servico: string }
  template?: { nome: string }
}

export interface NotificacaoItem {
  id: string
  tipo: 'recorrente' | 'pagamento'
  titulo: string
  descricao: string
  href: string
  diasRestantes: number
  valor?: number
}
