-- =========================================
-- MIGRATION 7: Contas de recebimento + PDF storage
-- Execute no Supabase SQL Editor
-- =========================================

-- 1. Tabela de contas de recebimento
CREATE TABLE IF NOT EXISTS contas_recebimento (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT        NOT NULL,
  descricao   TEXT,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contas_recebimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access on contas_recebimento"
  ON contas_recebimento FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 2. Adiciona conta_id e comprovante_url na tabela de serviços
ALTER TABLE servicos
  ADD COLUMN IF NOT EXISTS conta_id        UUID REFERENCES contas_recebimento(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

CREATE INDEX IF NOT EXISTS idx_servicos_conta ON servicos(conta_id);

-- 3. Contas padrão (seed)
INSERT INTO contas_recebimento (nome, descricao) VALUES
  ('Caixa (Dinheiro)', 'Recebimentos em dinheiro físico no escritório'),
  ('PIX',             'Recebimentos via transferência PIX'),
  ('Maquininha — Cartão', 'Pagamentos no cartão de crédito ou débito'),
  ('Boleto Bancário', 'Recebimentos via boleto')
ON CONFLICT DO NOTHING;

-- =========================================
-- IMPORTANTE: Crie o bucket no Supabase Dashboard
-- Storage → New bucket → Nome: "comprovantes" → Marcar "Public bucket"
-- =========================================
