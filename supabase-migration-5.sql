-- =========================================
-- MIGRATION 5: Templates WhatsApp aprimorados
-- Execute no Supabase SQL Editor
-- =========================================

-- Remove os templates do seed anterior para substituir pelos novos
DELETE FROM mensagens_templates WHERE nome IN (
  'Serviço Concluído',
  'Serviço em Andamento',
  'Lembrete de Pagamento',
  'Documentos Necessários',
  'Agendamento de Atendimento',
  'Boas-vindas ao Cliente'
);

-- ── GERAL ───────────────────────────────────────────────────────
INSERT INTO mensagens_templates (nome, categoria, conteudo) VALUES

('Boas-vindas', 'geral',
'Olá, *{{nome}}*! 👋

Seja bem-vindo(a) ao nosso escritório!

Ficamos felizes em tê-lo(a) como cliente. Estamos aqui para cuidar de toda a documentação do seu veículo com agilidade e segurança.

Qualquer dúvida ou necessidade, é só chamar aqui pelo WhatsApp! 😊

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Primeiro Contato', 'geral',
'Olá, *{{nome}}*! Tudo bem? 😊

Entrei em contato para apresentar nossos serviços de despachante documentalista.

Cuidamos de:
🔹 Licenciamento e IPVA
🔹 Transferência de veículos
🔹 CNH (1ª habilitação, renovação, adição de categoria)
🔹 Emplacamento
🔹 E muito mais!

Quando puder, me avise para conversarmos sem compromisso. 🙂

Atenciosamente,
*Despachante Documentalista* 🚗'),

-- ── SERVIÇO ─────────────────────────────────────────────────────

('Serviço Iniciado', 'servico',
'Olá, *{{nome}}*! 👋

Confirmamos o início do seu processo de *{{servico}}* hoje, {{data}}. ⚙️

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}

Assim que houver atualizações, entraremos em contato. Qualquer dúvida, é só chamar!

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Atualização de Processo', 'servico',
'Olá, *{{nome}}*! 👋

Passando para dar uma atualização sobre o seu processo de *{{servico}}*. 📋

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}

_(complete aqui com as informações atuais do andamento)_

Qualquer dúvida, estamos à disposição!

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Serviço Concluído', 'servico',
'Olá, *{{nome}}*! ✅

Ótima notícia! O seu serviço de *{{servico}}* foi *concluído* com sucesso!

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}
{{#valor}}💰 Valor: *{{valor}}*{{/valor}}

Os documentos já estão disponíveis. Entre em contato para combinar a retirada ou entrega.

Obrigado pela confiança! 🙏

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Aguardando Documentos do Cliente', 'servico',
'Olá, *{{nome}}*! 👋

Para darmos continuidade ao processo de *{{servico}}*, precisamos dos seguintes documentos:

📄 • CNH (original e cópia)
📄 • CRV / DUT do veículo
📄 • Comprovante de residência atualizado
📄 • CPF e RG (original e cópia)

Por favor, providencie assim que possível para não atrasar o processo.

Qualquer dúvida, é só chamar! 😊

Atenciosamente,
*Despachante Documentalista* 🚗'),

-- ── PAGAMENTO ───────────────────────────────────────────────────

('Lembrete de Pagamento', 'pagamento',
'Olá, *{{nome}}*! 😊

Passando para lembrá-lo(a) que há um pagamento em aberto referente ao serviço de *{{servico}}*.

{{#valor}}💰 Valor: *{{valor}}*{{/valor}}

Formas de pagamento aceitas:
💠 PIX: _(insira sua chave PIX)_
💳 Cartão (débito/crédito)
💵 Dinheiro

Quando puder, efetue o pagamento. Em caso de dúvidas, estamos à disposição!

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Cobrança — 2ª Notificação', 'pagamento',
'Olá, *{{nome}}*! 👋

Gostaríamos de entrar em contato novamente sobre o pagamento pendente do serviço de *{{servico}}*.

{{#valor}}💰 Valor em aberto: *{{valor}}*{{/valor}}
📅 Data de hoje: {{data}}

Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Se preferir, podemos combinar a melhor forma de pagamento para você. É só nos avisar! 😊

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Cobrança — Urgente', 'pagamento',
'Olá, *{{nome}}*.

Verificamos que o pagamento referente ao serviço de *{{servico}}* ainda não foi regularizado.

{{#valor}}⚠️ Valor em aberto: *{{valor}}*{{/valor}}

Pedimos que entre em contato *com urgência* para resolvermos esta situação e evitar maiores transtornos.

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Pagamento Confirmado', 'pagamento',
'Olá, *{{nome}}*! ✅

Confirmamos o recebimento do seu pagamento referente ao serviço de *{{servico}}*.

{{#valor}}💰 Valor recebido: *{{valor}}*{{/valor}}
📅 Data: {{data}}

Muito obrigado pela pontualidade! 🙏

Estamos sempre à disposição para novos serviços.

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Envio de PIX / Dados Bancários', 'pagamento',
'Olá, *{{nome}}*! 😊

Seguem os dados para pagamento referente ao serviço de *{{servico}}*:

{{#valor}}💰 Valor: *{{valor}}*{{/valor}}

💠 *PIX:* _(insira sua chave)_
🏦 *Banco:* _(insira o banco)_
👤 *Nome:* _(insira o nome do titular)_

Após o pagamento, envie o comprovante por aqui. Obrigado! 🙏

Atenciosamente,
*Despachante Documentalista* 🚗'),

-- ── DOCUMENTO ───────────────────────────────────────────────────

('Documentos Prontos para Retirada', 'documento',
'Olá, *{{nome}}*! 📄

Seus documentos referentes ao serviço de *{{servico}}* já estão *prontos para retirada*! ✅

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}

📍 Nosso endereço: _(insira o endereço)_
🕐 Horário: _(insira o horário)_

Caso prefira, podemos combinar a entrega. Entre em contato! 😊

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Renovação Próxima do Vencimento', 'documento',
'Olá, *{{nome}}*! ⚠️

Passando para avisar que o *{{servico}}* do seu veículo está próximo do vencimento.

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}
📅 Data de hoje: {{data}}

Recomendamos providenciar com antecedência para evitar multas e restrições na documentação.

Entre em contato para agendarmos! 😊

Atenciosamente,
*Despachante Documentalista* 🚗'),

('IPVA / Licenciamento Vencendo', 'documento',
'Olá, *{{nome}}*! 🚨

Lembrete importante: o *IPVA / Licenciamento* do seu veículo vence em breve!

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}
📅 Hoje é {{data}}

Veículos com documentação vencida estão sujeitos a multa e apreensão.

Podemos cuidar de tudo para você com agilidade. Entre em contato! 😊

Atenciosamente,
*Despachante Documentalista* 🚗'),

('Agendamento de Atendimento', 'geral',
'Olá, *{{nome}}*! 👋

Gostaríamos de agendar um atendimento para tratar sobre os seus serviços de documentação.

📅 Por favor, nos informe sua disponibilidade ou entre em contato para marcarmos um horário conveniente.

Atenciosamente,
*Despachante Documentalista* 🚗')

ON CONFLICT DO NOTHING;
