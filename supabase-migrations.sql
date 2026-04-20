-- =========================================
-- MIGRATION: Novas funcionalidades
-- Execute no Supabase SQL Editor
-- =========================================

-- 1. Adicionar coluna pagamento_status na tabela servicos
ALTER TABLE servicos
ADD COLUMN IF NOT EXISTS pagamento_status TEXT
  NOT NULL DEFAULT 'pendente'
  CHECK (pagamento_status IN ('pago', 'a_receber', 'pendente'));

-- Atualizar registros existentes que têm valor e estão concluídos
UPDATE servicos
SET pagamento_status = 'pago'
WHERE status = 'concluido' AND valor IS NOT NULL AND valor > 0;

-- 2. Criar tabela de documentos (para clientes e veículos)
CREATE TABLE IF NOT EXISTS documentos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id UUID REFERENCES veiculos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outro',
  url TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_vinculo CHECK (cliente_id IS NOT NULL OR veiculo_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_documentos_cliente_id ON documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_veiculo_id ON documentos(veiculo_id);

-- RLS para documentos
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can do everything on documentos"
  ON documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Storage bucket para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documentos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can read documentos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can delete documentos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos');
