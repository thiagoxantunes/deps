-- =========================================
-- MIGRATION 15: Adiciona data_pagamento em servicos
-- Objetivo: separar a data de conclusão da data de recebimento do pagamento,
-- garantindo que a receita mensal reflita quando o dinheiro entrou, não quando
-- o serviço foi concluído.
-- =========================================

ALTER TABLE servicos
  ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Retroativo: preenche data_pagamento com data_conclusao para serviços já pagos
UPDATE servicos
  SET data_pagamento = data_conclusao
  WHERE pagamento_status = 'pago'
    AND data_pagamento IS NULL
    AND data_conclusao IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_servicos_data_pagamento ON servicos(data_pagamento);
