-- =========================================
-- MIGRATION 4: WhatsApp — Templates e Histórico
-- Execute no Supabase SQL Editor
-- =========================================

-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS mensagens_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'geral'
    CHECK (categoria IN ('servico', 'pagamento', 'documento', 'geral')),
  conteudo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mensagens_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access on mensagens_templates"
  ON mensagens_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Tabela de histórico de mensagens enviadas
CREATE TABLE IF NOT EXISTS mensagens_enviadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  template_id UUID REFERENCES mensagens_templates(id) ON DELETE SET NULL,
  mensagem TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mensagens_enviadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access on mensagens_enviadas"
  ON mensagens_enviadas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Index para busca por cliente
CREATE INDEX IF NOT EXISTS idx_mensagens_enviadas_cliente
  ON mensagens_enviadas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_enviadas_created
  ON mensagens_enviadas(created_at DESC);

-- ── Templates padrão ──────────────────────────────────────────
INSERT INTO mensagens_templates (nome, categoria, conteudo) VALUES

('Serviço Concluído', 'servico',
'Olá, *{{nome}}*! 👋

Informamos que o seu serviço de *{{servico}}* foi concluído com sucesso! ✅

{{#valor}}Valor: *{{valor}}*{{/valor}}

Por favor, entre em contato para combinar a retirada dos documentos.

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Serviço em Andamento', 'servico',
'Olá, *{{nome}}*! 👋

Gostaríamos de informar que o seu processo de *{{servico}}* está em andamento. ⚙️

Assim que houver novidades, entraremos em contato.

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Lembrete de Pagamento', 'pagamento',
'Olá, *{{nome}}*! 👋

Passando para lembrar que há um pagamento pendente referente ao serviço de *{{servico}}*.
{{#valor}}
💰 Valor: *{{valor}}*{{/valor}}

Por favor, entre em contato para regularizar.

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Documentos Necessários', 'documento',
'Olá, *{{nome}}*! 👋

Para darmos continuidade ao processo de *{{servico}}*, precisamos dos seguintes documentos:

📄 • CNH (original)
📄 • CRV do veículo
📄 • Comprovante de residência

Por favor, traga os documentos ou entre em contato para combinarmos.

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Agendamento de Atendimento', 'geral',
'Olá, *{{nome}}*! 👋

Gostaríamos de agendar um atendimento para tratar sobre *{{servico}}*.

📅 Por favor, nos informe sua disponibilidade ou entre em contato pelo nosso escritório.

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Boas-vindas ao Cliente', 'geral',
'Olá, *{{nome}}*! 👋

Seja bem-vindo(a)! 🎉

Ficamos felizes em tê-lo(a) como cliente. Estamos à disposição para ajudá-lo(a) com todos os serviços de despachante.

Em caso de dúvidas, pode nos chamar aqui mesmo pelo WhatsApp.

Atenciosamente,
*Despachante Documentalista* 🚗')

ON CONFLICT DO NOTHING;
