-- =========================================
-- MIGRATION 8: Correção e garantia das colunas/tabelas
-- Execute no Supabase SQL Editor
-- =========================================

-- 1. Garante que a tabela contas_recebimento existe
CREATE TABLE IF NOT EXISTS contas_recebimento (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT        NOT NULL,
  descricao   TEXT,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE contas_recebimento ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contas_recebimento'
      AND policyname = 'authenticated full access on contas_recebimento'
  ) THEN
    CREATE POLICY "authenticated full access on contas_recebimento"
      ON contas_recebimento FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 3. Adiciona colunas em servicos (seguro, não quebra se já existir)
ALTER TABLE servicos
  ADD COLUMN IF NOT EXISTS conta_id        UUID REFERENCES contas_recebimento(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

-- 4. Índice
CREATE INDEX IF NOT EXISTS idx_servicos_conta ON servicos(conta_id);

-- 5. Contas padrão (seed) — só insere se a tabela estiver vazia
INSERT INTO contas_recebimento (nome, descricao)
SELECT nome, descricao FROM (VALUES
  ('Caixa (Dinheiro)', 'Recebimentos em dinheiro físico no escritório'),
  ('PIX',              'Recebimentos via transferência PIX'),
  ('Maquininha — Cartão', 'Pagamentos no cartão de crédito ou débito'),
  ('Boleto Bancário',  'Recebimentos via boleto')
) AS v(nome, descricao)
WHERE NOT EXISTS (SELECT 1 FROM contas_recebimento LIMIT 1);

-- =========================================
-- IMPORTANTE: Se ainda não criou o bucket de PDFs:
-- Storage → New bucket → Nome: "comprovantes" → Marcar "Public bucket"
-- =========================================
