-- Adiciona coluna de horário na tabela saidas
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS horario text DEFAULT NULL;
