import jsPDF from 'jspdf'
import { formatCurrency, STATUS_LABELS } from './cn'

// ── Brand colors ─────────────────────────────────────────────────
const ORANGE   = [249, 115, 22]  as [number, number, number]  // #F97316
const DARK     = [17,  24,  39]  as [number, number, number]  // #111827
const WHITE    = [255, 255, 255] as [number, number, number]
const GRAY_100 = [243, 244, 246] as [number, number, number]  // bg section
const GRAY_400 = [156, 163, 175] as [number, number, number]  // label text
const GRAY_900 = [17,  24,  39]  as [number, number, number]  // body text
const DIVIDER  = [229, 231, 235] as [number, number, number]  // lines

const PAGE_W  = 210
const PAGE_H  = 297
const MARGIN  = 18
const CONTENT = PAGE_W - MARGIN * 2

interface ClientePDF {
  nome: string
  cpf_cnpj?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
}

interface ServicoPDF {
  tipo_servico: string
  descricao?: string | null
  data_inicio: string
  data_conclusao?: string | null
  status: string
  valor?: number | null
  conta_nome?: string | null
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

// Desenha um retângulo com canto arredondado (simulado com rect normal no jsPDF básico)
function drawSection(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  fillColor: [number, number, number]
) {
  doc.setFillColor(...fillColor)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')
}

// Linha de dado: label à esquerda (cinza) + valor à direita (escuro)
function drawField(
  doc: jsPDF,
  x: number, y: number, label: string, value: string,
  labelWidth = 42
) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GRAY_400)
  doc.text(label, x, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY_900)
  const lines = doc.splitTextToSize(value, CONTENT - labelWidth - 4)
  doc.text(lines, x + labelWidth, y)

  return lines.length > 1 ? lines.length * 4.5 : 6
}

export function gerarComprovanteServico(servico: ServicoPDF, cliente: ClientePDF) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0

  // ── 1. HEADER ESCURO ────────────────────────────────────────────
  const headerH = 48
  doc.setFillColor(...DARK)
  doc.rect(0, 0, PAGE_W, headerH, 'F')

  // Barra laranja lateral esquerda
  doc.setFillColor(...ORANGE)
  doc.rect(0, 0, 5, headerH, 'F')

  // Nome da empresa
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('THIAGO ANTUNES', 14, 19)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...ORANGE)
  doc.text('ASSESSORIA DE TRÂNSITO', 14, 26)

  // Linha separadora vertical
  doc.setDrawColor(...GRAY_400)
  doc.setLineWidth(0.3)
  doc.line(115, 10, 115, 38)

  // Info do lado direito do header
  doc.setTextColor(180, 186, 194)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('COMPROVANTE DE SERVIÇO', PAGE_W - MARGIN, 14, { align: 'right' })

  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  const now = new Date()
  doc.text(`Emitido em: ${now.toLocaleDateString('pt-BR')}`, PAGE_W - MARGIN, 21, { align: 'right' })
  doc.text(`Horário: ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, PAGE_W - MARGIN, 27, { align: 'right' })

  // Linha laranja decorativa na base do header
  doc.setFillColor(...ORANGE)
  doc.rect(0, headerH, PAGE_W, 1.5, 'F')

  y = headerH + 1.5

  // ── 2. TÍTULO DA SEÇÃO ──────────────────────────────────────────
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...DARK)
  doc.text(servico.tipo_servico.toUpperCase(), MARGIN, y)

  // Status badge
  const statusLabel = STATUS_LABELS[servico.status] || servico.status
  const statusColor: [number, number, number] =
    servico.status === 'concluido' ? [22, 163, 74]
    : servico.status === 'em_andamento' ? [234, 88, 12]
    : [107, 114, 128]
  doc.setFillColor(...statusColor)
  const statusW = doc.getTextWidth(statusLabel) + 6
  doc.roundedRect(PAGE_W - MARGIN - statusW, y - 5, statusW, 6, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...WHITE)
  doc.text(statusLabel, PAGE_W - MARGIN - statusW / 2, y - 0.5, { align: 'center' })

  y += 7

  // ── 3. BLOCO DADOS DO CLIENTE ───────────────────────────────────
  const sectionHeaderH = 8
  const clienteFields: [string, string][] = [
    ['Nome', cliente.nome],
    ...(cliente.telefone ? [['Telefone', cliente.telefone] as [string, string]] : []),
    ...(cliente.email ? [['E-mail', cliente.email] as [string, string]] : []),
    ...(cliente.endereco ? [['Endereço', cliente.endereco] as [string, string]] : []),
  ]
  const clienteH = sectionHeaderH + clienteFields.length * 6 + 8
  drawSection(doc, MARGIN, y, CONTENT, clienteH, GRAY_100)

  // Header da seção
  doc.setFillColor(...ORANGE)
  doc.roundedRect(MARGIN, y, CONTENT, sectionHeaderH, 2, 2, 'F')
  doc.rect(MARGIN, y + sectionHeaderH / 2, CONTENT, sectionHeaderH / 2, 'F') // tira arredondamento de baixo
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...WHITE)
  doc.text('DADOS DO CLIENTE', MARGIN + 4, y + 5.5)

  y += sectionHeaderH + 5
  clienteFields.forEach(([label, value]) => {
    drawField(doc, MARGIN + 4, y, label, value)
    y += 6
  })
  y += 4

  // ── 4. BLOCO DADOS DO SERVIÇO ───────────────────────────────────
  y += 4
  const servicoFields: [string, string][] = [
    ['Tipo de Serviço', servico.tipo_servico],
    ['Data de Início', formatDate(servico.data_inicio)],
    ...(servico.data_conclusao
      ? [['Data de Conclusão', formatDate(servico.data_conclusao)] as [string, string]]
      : []),
    ...(servico.conta_nome
      ? [['Forma de Recebimento', servico.conta_nome] as [string, string]]
      : []),
  ]
  const servicoH = sectionHeaderH + servicoFields.length * 6 + 8
  drawSection(doc, MARGIN, y, CONTENT, servicoH, GRAY_100)

  doc.setFillColor(...DARK)
  doc.roundedRect(MARGIN, y, CONTENT, sectionHeaderH, 2, 2, 'F')
  doc.rect(MARGIN, y + sectionHeaderH / 2, CONTENT, sectionHeaderH / 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...WHITE)
  doc.text('DADOS DO SERVIÇO', MARGIN + 4, y + 5.5)

  y += sectionHeaderH + 5
  servicoFields.forEach(([label, value]) => {
    drawField(doc, MARGIN + 4, y, label, value)
    y += 6
  })
  y += 4

  // ── 5. BLOCO VALOR (destaque laranja) ──────────────────────────
  if (servico.valor) {
    y += 4
    const valorH = 22
    drawSection(doc, MARGIN, y, CONTENT, valorH, [255, 247, 237]) // orange-50

    doc.setDrawColor(...ORANGE)
    doc.setLineWidth(0.6)
    doc.line(MARGIN, y, MARGIN, y + valorH)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...ORANGE)
    doc.text('VALOR DO SERVIÇO', MARGIN + 5, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...DARK)
    doc.text(formatCurrency(servico.valor), MARGIN + 5, y + 17)

    if (servico.conta_nome) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...GRAY_400)
      doc.text(servico.conta_nome, PAGE_W - MARGIN - 4, y + 17, { align: 'right' })
    }
    y += valorH
  }

  // ── 6. DESCRIÇÃO ────────────────────────────────────────────────
  if (servico.descricao) {
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_400)
    doc.text('OBSERVAÇÕES', MARGIN, y)
    y += 5

    doc.setDrawColor(...DIVIDER)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_900)
    const lines = doc.splitTextToSize(servico.descricao, CONTENT)
    doc.text(lines, MARGIN, y)
    y += lines.length * 5
  }

  // ── 7. LINHA DE ASSINATURA ──────────────────────────────────────
  const sigY = Math.max(y + 20, PAGE_H - 55)
  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.4)
  const sigW = (CONTENT - 16) / 2
  doc.line(MARGIN, sigY, MARGIN + sigW, sigY)
  doc.line(PAGE_W - MARGIN - sigW, sigY, PAGE_W - MARGIN, sigY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY_400)
  doc.text('Assinatura do Responsável', MARGIN + sigW / 2, sigY + 4, { align: 'center' })
  doc.text('Assinatura do Cliente', PAGE_W - MARGIN - sigW / 2, sigY + 4, { align: 'center' })

  // ── 8. RODAPÉ ───────────────────────────────────────────────────
  // Faixa laranja
  doc.setFillColor(...ORANGE)
  doc.rect(0, PAGE_H - 16, PAGE_W, 16, 'F')

  // Barra escura fina acima
  doc.setFillColor(...DARK)
  doc.rect(0, PAGE_H - 17, PAGE_W, 1, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...WHITE)
  doc.text('THIAGO ANTUNES — Assessoria de Trânsito', MARGIN, PAGE_H - 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(255, 237, 213)
  doc.text(
    `Documento gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' }
  )

  return doc
}
