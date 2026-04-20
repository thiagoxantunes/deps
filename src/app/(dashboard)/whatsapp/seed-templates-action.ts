'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TEMPLATES = [
  // ── GERAL ──────────────────────────────────────────────────────────
  {
    nome: 'Boas-vindas',
    categoria: 'geral',
    conteudo: `Olá, *{{nome}}*! 👋

Seja bem-vindo(a) ao nosso escritório!

Ficamos felizes em tê-lo(a) como cliente. Estamos aqui para cuidar de toda a documentação do seu veículo com agilidade e segurança.

Qualquer dúvida ou necessidade, é só chamar aqui pelo WhatsApp! 😊

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Primeiro Contato',
    categoria: 'geral',
    conteudo: `Olá, *{{nome}}*! Tudo bem? 😊

Entrei em contato para apresentar nossos serviços de despachante documentalista.

Cuidamos de:
🔹 Licenciamento e IPVA
🔹 Transferência de veículos
🔹 CNH (1ª habilitação, renovação, adição de categoria)
🔹 Emplacamento
🔹 E muito mais!

Quando puder, me avise para conversarmos sem compromisso. 🙂

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Agendamento de Atendimento',
    categoria: 'geral',
    conteudo: `Olá, *{{nome}}*! 👋

Gostaríamos de agendar um atendimento para tratar sobre os seus serviços de documentação.

📅 Por favor, nos informe sua disponibilidade ou entre em contato para marcarmos um horário conveniente.

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },

  // ── SERVIÇO ────────────────────────────────────────────────────────
  {
    nome: 'Serviço Iniciado',
    categoria: 'servico',
    conteudo: `Olá, *{{nome}}*! 👋

Confirmamos o início do seu processo de *{{servico}}* hoje, {{data}}. ⚙️

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}

Assim que houver atualizações, entraremos em contato. Qualquer dúvida, é só chamar!

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Atualização de Processo',
    categoria: 'servico',
    conteudo: `Olá, *{{nome}}*! 👋

Passando para dar uma atualização sobre o seu processo de *{{servico}}*. 📋

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}

_(complete aqui com as informações atuais do andamento)_

Qualquer dúvida, estamos à disposição!

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Serviço Concluído',
    categoria: 'servico',
    conteudo: `Olá, *{{nome}}*! ✅

Ótima notícia! O seu serviço de *{{servico}}* foi *concluído* com sucesso!

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}
{{#valor}}💰 Valor: *{{valor}}*{{/valor}}

Os documentos já estão disponíveis. Entre em contato para combinar a retirada ou entrega.

Obrigado pela confiança! 🙏

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Aguardando Documentos do Cliente',
    categoria: 'servico',
    conteudo: `Olá, *{{nome}}*! 👋

Para darmos continuidade ao processo de *{{servico}}*, precisamos dos seguintes documentos:

📄 CNH (original e cópia)
📄 CRV / DUT do veículo
📄 Comprovante de residência atualizado
📄 CPF e RG (original e cópia)

Por favor, providencie assim que possível para não atrasar o processo.

Qualquer dúvida, é só chamar! 😊

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },

  // ── PAGAMENTO ──────────────────────────────────────────────────────
  {
    nome: 'Lembrete de Pagamento',
    categoria: 'pagamento',
    conteudo: `Olá, *{{nome}}*! 😊

Passando para lembrá-lo(a) que há um pagamento em aberto referente ao serviço de *{{servico}}*.

{{#valor}}💰 Valor: *{{valor}}*{{/valor}}

Quando puder, efetue o pagamento. Em caso de dúvidas, estamos à disposição!

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Cobrança — 2ª Notificação',
    categoria: 'pagamento',
    conteudo: `Olá, *{{nome}}*! 👋

Gostaríamos de entrar em contato novamente sobre o pagamento pendente do serviço de *{{servico}}*.

{{#valor}}💰 Valor em aberto: *{{valor}}*{{/valor}}
📅 Data de hoje: {{data}}

Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Se preferir, podemos combinar a melhor forma de pagamento para você. É só nos avisar! 😊

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Cobrança — Urgente',
    categoria: 'pagamento',
    conteudo: `Olá, *{{nome}}*.

Verificamos que o pagamento referente ao serviço de *{{servico}}* ainda não foi regularizado.

{{#valor}}⚠️ Valor em aberto: *{{valor}}*{{/valor}}

Pedimos que entre em contato *com urgência* para resolvermos esta situação.

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Pagamento Confirmado',
    categoria: 'pagamento',
    conteudo: `Olá, *{{nome}}*! ✅

Confirmamos o recebimento do seu pagamento referente ao serviço de *{{servico}}*.

{{#valor}}💰 Valor recebido: *{{valor}}*{{/valor}}
📅 Data: {{data}}

Muito obrigado pela pontualidade! 🙏

Estamos sempre à disposição para novos serviços.

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Envio de PIX / Dados Bancários',
    categoria: 'pagamento',
    conteudo: `Olá, *{{nome}}*! 😊

Seguem os dados para pagamento referente ao serviço de *{{servico}}*:

{{#valor}}💰 Valor: *{{valor}}*{{/valor}}

💠 *PIX:* _(insira sua chave)_
🏦 *Banco:* _(insira o banco)_
👤 *Nome:* Thiago Antunes

Após o pagamento, envie o comprovante por aqui. Obrigado! 🙏

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },

  // ── DOCUMENTO ──────────────────────────────────────────────────────
  {
    nome: 'Documentos Prontos para Retirada',
    categoria: 'documento',
    conteudo: `Olá, *{{nome}}*! 📄

Seus documentos referentes ao serviço de *{{servico}}* já estão *prontos para retirada*! ✅

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}

📍 Nosso endereço: _(insira o endereço)_
🕐 Horário: _(insira o horário)_

Caso prefira, podemos combinar a entrega. Entre em contato! 😊

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'Renovação Próxima do Vencimento',
    categoria: 'documento',
    conteudo: `Olá, *{{nome}}*! ⚠️

Passando para avisar que o *{{servico}}* do seu veículo está próximo do vencimento.

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}
📅 Data de hoje: {{data}}

Recomendamos providenciar com antecedência para evitar multas e restrições na documentação.

Entre em contato para agendarmos! 😊

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
  {
    nome: 'IPVA / Licenciamento Vencendo',
    categoria: 'documento',
    conteudo: `Olá, *{{nome}}*! 🚨

Lembrete importante: o *IPVA / Licenciamento* do seu veículo vence em breve!

{{#placa}}🚗 Veículo: *{{placa}}*{{/placa}}
📅 Hoje é {{data}}

Veículos com documentação vencida estão sujeitos a multa e apreensão.

Podemos cuidar de tudo para você com agilidade. Entre em contato! 😊

Atenciosamente,
*Thiago Antunes — Assessoria de Trânsito* 🚗`,
  },
]

export async function seedTemplates() {
  const supabase = await createClient()

  // Busca todos os IDs existentes
  const { data: existentes } = await supabase
    .from('mensagens_templates')
    .select('id')

  // Deleta um por um para não depender de condições complexas
  if (existentes && existentes.length > 0) {
    for (const t of existentes) {
      await supabase.from('mensagens_templates').delete().eq('id', t.id)
    }
  }

  // Re-insere com encoding correto via JS/TypeScript (UTF-8 garantido pelo runtime Node.js)
  const { error } = await supabase.from('mensagens_templates').insert(
    TEMPLATES.map(t => ({ ...t, ativo: true }))
  )

  if (error) throw new Error(error.message)

  revalidatePath('/whatsapp')
  return { ok: true, total: TEMPLATES.length }
}
