-- =========================================
-- MIGRATION 6: CPF/CNPJ não obrigatório
-- Execute no Supabase SQL Editor
-- =========================================

-- Remove a constraint UNIQUE que impedia múltiplos registros sem CPF
-- O nome exato pode variar — tente os dois
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cpf_cnpj_key;
DROP INDEX IF EXISTS clientes_cpf_cnpj_key;

-- Cria índice único parcial: só aplica para CPF/CNPJ que realmente foram preenchidos
CREATE UNIQUE INDEX IF NOT EXISTS clientes_cpf_cnpj_unique
  ON clientes (cpf_cnpj)
  WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '';
