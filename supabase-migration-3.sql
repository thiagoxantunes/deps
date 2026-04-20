-- =========================================
-- MIGRATION 3: Serviços Recorrentes
-- Execute no Supabase SQL Editor
-- =========================================

-- Tabela de serviços recorrentes/mensais
CREATE TABLE IF NOT EXISTS servicos_recorrentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  tipo_servico TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(10,2),
  periodicidade TEXT NOT NULL DEFAULT 'anual'
    CHECK (periodicidade IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual')),
  proximo_vencimento DATE NOT NULL,
  antecedencia_dias INTEGER NOT NULL DEFAULT 15,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE servicos_recorrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access on servicos_recorrentes"
  ON servicos_recorrentes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para updated_at (cria a função se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_servicos_recorrentes_updated_at ON servicos_recorrentes;

CREATE TRIGGER update_servicos_recorrentes_updated_at
  BEFORE UPDATE ON servicos_recorrentes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index para queries de vencimento
CREATE INDEX IF NOT EXISTS idx_servicos_recorrentes_vencimento
  ON servicos_recorrentes(proximo_vencimento)
  WHERE ativo = true;
