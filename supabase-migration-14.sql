-- =========================================================
-- MIGRATION 14: Tabela de movimentações entre contas
-- (transferências e depósitos externos)
-- Execute no Supabase SQL Editor
-- =========================================================

CREATE TABLE IF NOT EXISTS movimentacoes (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  data             DATE          NOT NULL DEFAULT CURRENT_DATE,
  descricao        TEXT          NOT NULL,
  valor            NUMERIC(10,2) NOT NULL,
  conta_origem_id  UUID          REFERENCES contas_recebimento(id) ON DELETE SET NULL,
  conta_destino_id UUID          NOT NULL REFERENCES contas_recebimento(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- conta_origem_id NULL  → depósito externo (conta como receita no faturamento)
-- conta_origem_id NOT NULL → transferência entre contas (só move saldo, não afeta faturamento)

ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access movimentacoes"
  ON movimentacoes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_data    ON movimentacoes(data);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_origem  ON movimentacoes(conta_origem_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_destino ON movimentacoes(conta_destino_id);
