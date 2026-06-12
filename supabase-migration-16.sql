-- =========================================
-- MIGRATION 16: Sistema de Orçamentos
-- =========================================

-- Tabela principal de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  numero          SERIAL UNIQUE NOT NULL,
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id      UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'rascunho'
                    CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'recusado', 'expirado')),
  valor_total     DECIMAL(10,2) NOT NULL DEFAULT 0,
  observacoes     TEXT,
  validade        DATE,
  data_aprovacao  TIMESTAMPTZ,
  data_recusa     TIMESTAMPTZ,
  servico_id      UUID REFERENCES servicos(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente   ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_veiculo   ON orcamentos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status    ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_servico   ON orcamentos(servico_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_created   ON orcamentos(created_at);

-- Itens do orçamento (1 orçamento → N itens)
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  orcamento_id  UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  descricao     TEXT NOT NULL,
  valor         DECIMAL(10,2) NOT NULL DEFAULT 0,
  ordem         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);

-- Trigger updated_at
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS — apenas usuários autenticados
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything on orcamentos"
  ON orcamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on orcamento_itens"
  ON orcamento_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
