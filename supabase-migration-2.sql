-- =========================================
-- MIGRATION 2: status_veiculo + ajustes
-- Execute no Supabase SQL Editor
-- =========================================

-- 1. Adicionar status ao veículo
ALTER TABLE veiculos
ADD COLUMN IF NOT EXISTS status_veiculo TEXT
  NOT NULL DEFAULT 'ativo'
  CHECK (status_veiculo IN ('ativo', 'antigo', 'transferido'));

ALTER TABLE veiculos
ADD COLUMN IF NOT EXISTS data_alteracao_status DATE;

ALTER TABLE veiculos
ADD COLUMN IF NOT EXISTS obs_status TEXT;

-- 2. Remover constraint unique de placa para permitir
--    o mesmo veículo ser cadastrado por clientes diferentes
--    (ex: carro vendido e comprado por outro cliente)
-- Se existir, remova:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'veiculos_placa_key' AND contype = 'u'
  ) THEN
    ALTER TABLE veiculos DROP CONSTRAINT veiculos_placa_key;
  END IF;
END $$;

-- 3. Tornar cpf_cnpj NOT NULL opcionalmente (ajusta default)
--    Permite clientes sem CPF/CNPJ (armazenado como string vazia)
ALTER TABLE clientes
ALTER COLUMN cpf_cnpj SET DEFAULT '';

-- Atualizar constraint de unique para ignorar strings vazias
-- (dois clientes sem CPF não conflitam)
DO $$
BEGIN
  -- Remove constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clientes_cpf_cnpj_key' AND contype = 'u'
  ) THEN
    ALTER TABLE clientes DROP CONSTRAINT clientes_cpf_cnpj_key;
  END IF;
END $$;

-- Cria índice unique parcial: só aplica unique quando cpf_cnpj não é vazio
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj_unique
  ON clientes(cpf_cnpj)
  WHERE cpf_cnpj != '' AND cpf_cnpj IS NOT NULL;
