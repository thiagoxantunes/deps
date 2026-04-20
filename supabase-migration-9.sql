-- =========================================
-- MIGRATION 9: Criar bucket de PDFs no Storage
-- Execute no Supabase SQL Editor
-- =========================================

-- Cria o bucket "comprovantes" como público (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  true,
  10485760,  -- 10 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política: usuários autenticados podem fazer upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Authenticated upload comprovantes'
  ) THEN
    CREATE POLICY "Authenticated upload comprovantes"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'comprovantes');
  END IF;
END$$;

-- Política: leitura pública
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Public read comprovantes'
  ) THEN
    CREATE POLICY "Public read comprovantes"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'comprovantes');
  END IF;
END$$;

-- Política: autenticados podem atualizar (upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Authenticated update comprovantes'
  ) THEN
    CREATE POLICY "Authenticated update comprovantes"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'comprovantes');
  END IF;
END$$;
