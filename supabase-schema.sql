-- =========================================
-- SCHEMA: Sistema Despachante Documentalista
-- Execute no Supabase SQL Editor
-- =========================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- TABELA: clientes
-- =========================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  whatsapp BOOLEAN DEFAULT true,
  email TEXT,
  endereco TEXT,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  observacoes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- TABELA: veiculos
-- =========================================
CREATE TABLE IF NOT EXISTS veiculos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('carro', 'moto')),
  placa TEXT NOT NULL,
  renavam TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  cor TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_id ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);

-- =========================================
-- TABELA: servicos
-- =========================================
CREATE TABLE IF NOT EXISTS servicos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  tipo_servico TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_conclusao DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('em_andamento', 'concluido', 'pendente')),
  valor DECIMAL(10,2),
  forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicos_cliente_id ON servicos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicos_status ON servicos(status);
CREATE INDEX IF NOT EXISTS idx_servicos_data_inicio ON servicos(data_inicio);

-- =========================================
-- TABELA: anexos
-- =========================================
CREATE TABLE IF NOT EXISTS anexos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anexos_servico_id ON anexos(servico_id);

-- =========================================
-- TRIGGER: atualizar updated_at automaticamente
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados têm acesso total
CREATE POLICY "Authenticated users can do everything on clientes"
  ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on veiculos"
  ON veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on servicos"
  ON servicos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on anexos"
  ON anexos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================
-- STORAGE: bucket para anexos
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('anexos', 'anexos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload anexos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'anexos');

CREATE POLICY "Authenticated users can read anexos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'anexos');

CREATE POLICY "Authenticated users can delete anexos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'anexos');

-- =========================================
-- VIEWS ÚTEIS
-- =========================================

-- View de dashboard stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM clientes) AS total_clientes,
  (SELECT COUNT(*) FROM servicos WHERE status = 'em_andamento') AS servicos_em_andamento,
  (SELECT COUNT(*) FROM servicos
    WHERE status = 'concluido'
    AND DATE_TRUNC('month', data_conclusao::TIMESTAMPTZ) = DATE_TRUNC('month', NOW())
  ) AS servicos_concluidos_mes,
  (SELECT COALESCE(SUM(valor), 0) FROM servicos
    WHERE status = 'concluido'
    AND DATE_TRUNC('month', data_conclusao::TIMESTAMPTZ) = DATE_TRUNC('month', NOW())
  ) AS receita_mensal;
