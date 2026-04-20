-- =========================================
-- MIGRATION 10: Tabela de saídas (despesas do escritório)
-- Execute no Supabase SQL Editor
-- =========================================

CREATE TABLE IF NOT EXISTS saidas (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  data        DATE        NOT NULL DEFAULT CURRENT_DATE,
  descricao   TEXT        NOT NULL,
  valor       NUMERIC(10,2) NOT NULL,
  conta_id    UUID        REFERENCES contas_recebimento(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE saidas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='saidas' AND policyname='authenticated full access on saidas'
  ) THEN
    CREATE POLICY "authenticated full access on saidas"
      ON saidas FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_saidas_data    ON saidas(data);
CREATE INDEX IF NOT EXISTS idx_saidas_conta   ON saidas(conta_id);
