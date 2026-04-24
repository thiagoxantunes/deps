-- =========================================================
-- MIGRATION 13: Row Level Security (RLS) em todas as tabelas
-- Execute no Supabase SQL Editor
-- =========================================================
-- Regra geral: apenas usuários autenticados acessam os dados.
-- A landing_config é exceção: leitura pública, escrita autenticada.
-- =========================================================

-- ─────────────────────────────────────────────────────────
-- 1. CLIENTES
-- ─────────────────────────────────────────────────────────
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access clientes" ON clientes;
CREATE POLICY "Authenticated full access clientes"
  ON clientes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 2. VEÍCULOS
-- ─────────────────────────────────────────────────────────
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access veiculos" ON veiculos;
CREATE POLICY "Authenticated full access veiculos"
  ON veiculos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 3. SERVIÇOS
-- ─────────────────────────────────────────────────────────
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access servicos" ON servicos;
CREATE POLICY "Authenticated full access servicos"
  ON servicos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 4. SERVIÇOS RECORRENTES
-- ─────────────────────────────────────────────────────────
ALTER TABLE servicos_recorrentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access servicos_recorrentes" ON servicos_recorrentes;
CREATE POLICY "Authenticated full access servicos_recorrentes"
  ON servicos_recorrentes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 5. SAÍDAS
-- ─────────────────────────────────────────────────────────
ALTER TABLE saidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access saidas" ON saidas;
CREATE POLICY "Authenticated full access saidas"
  ON saidas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 6. CONTAS DE RECEBIMENTO
-- ─────────────────────────────────────────────────────────
ALTER TABLE contas_recebimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access contas_recebimento" ON contas_recebimento;
CREATE POLICY "Authenticated full access contas_recebimento"
  ON contas_recebimento FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 7. TEMPLATES DE MENSAGEM
-- ─────────────────────────────────────────────────────────
ALTER TABLE mensagens_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access mensagens_templates" ON mensagens_templates;
CREATE POLICY "Authenticated full access mensagens_templates"
  ON mensagens_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 8. MENSAGENS ENVIADAS
-- ─────────────────────────────────────────────────────────
ALTER TABLE mensagens_enviadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access mensagens_enviadas" ON mensagens_enviadas;
CREATE POLICY "Authenticated full access mensagens_enviadas"
  ON mensagens_enviadas FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 9. DOCUMENTOS
-- ─────────────────────────────────────────────────────────
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access documentos" ON documentos;
CREATE POLICY "Authenticated full access documentos"
  ON documentos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 10. LANDING CONFIG (já criada, ajusta políticas)
-- ─────────────────────────────────────────────────────────
-- Leitura pública (a landing page é pública)
DROP POLICY IF EXISTS "Public read landing config" ON landing_config;
CREATE POLICY "Public read landing config"
  ON landing_config FOR SELECT
  TO public
  USING (true);

-- Escrita APENAS para usuários autenticados (remove permissão anon)
DROP POLICY IF EXISTS "Anon can update landing config" ON landing_config;
DROP POLICY IF EXISTS "Auth can update landing config" ON landing_config;
CREATE POLICY "Authenticated write landing config"
  ON landing_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 11. STORAGE: Buckets de documentos/anexos
-- ─────────────────────────────────────────────────────────
-- Garante que apenas autenticados acessam os arquivos privados
-- (rode apenas se o bucket existir)

DO $$
BEGIN
  -- Bucket: documentos
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documentos') THEN
    UPDATE storage.buckets SET public = false WHERE id = 'documentos';

    DROP POLICY IF EXISTS "Auth can upload documentos" ON storage.objects;
    CREATE POLICY "Auth can upload documentos"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'documentos');

    DROP POLICY IF EXISTS "Auth can read documentos" ON storage.objects;
    CREATE POLICY "Auth can read documentos"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'documentos');

    DROP POLICY IF EXISTS "Auth can delete documentos" ON storage.objects;
    CREATE POLICY "Auth can delete documentos"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'documentos');
  END IF;

  -- Bucket: anexos (PDFs de serviços)
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'anexos') THEN
    UPDATE storage.buckets SET public = false WHERE id = 'anexos';

    DROP POLICY IF EXISTS "Auth can upload anexos" ON storage.objects;
    CREATE POLICY "Auth can upload anexos"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'anexos');

    DROP POLICY IF EXISTS "Auth can read anexos" ON storage.objects;
    CREATE POLICY "Auth can read anexos"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'anexos');

    DROP POLICY IF EXISTS "Auth can delete anexos" ON storage.objects;
    CREATE POLICY "Auth can delete anexos"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'anexos');
  END IF;
END $$;
