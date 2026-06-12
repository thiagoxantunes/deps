-- =========================================
-- MIGRATION 17: Catálogo de Serviços
-- Lista editável de serviços com valores sugeridos, usada em orçamentos.
-- =========================================

CREATE TABLE IF NOT EXISTS catalogo_servicos (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  valor_padrao  DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  ordem         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(nome)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_ativo ON catalogo_servicos(ativo);
CREATE INDEX IF NOT EXISTS idx_catalogo_ordem ON catalogo_servicos(ordem);

CREATE TRIGGER update_catalogo_servicos_updated_at
  BEFORE UPDATE ON catalogo_servicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE catalogo_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything on catalogo_servicos"
  ON catalogo_servicos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed: tipos de serviço já existentes no sistema (valores zerados, usuário preenche depois)
INSERT INTO catalogo_servicos (nome, valor_padrao, ordem)
VALUES
  ('Transferência de Propriedade', 0, 1),
  ('Licenciamento', 0, 2),
  ('IPVA', 0, 3),
  ('Multa', 0, 4),
  ('Emplacamento', 0, 5),
  ('Transferência de Estado', 0, 6),
  ('Baixa de Veículo', 0, 7),
  ('Segunda Via de CRV', 0, 8),
  ('Segunda Via de CRLV', 0, 9),
  ('Renovação de CNH', 0, 10),
  ('Primeira Habilitação', 0, 11),
  ('Adição de Categoria', 0, 12),
  ('Recurso de Multa', 0, 13)
ON CONFLICT (nome) DO NOTHING;
