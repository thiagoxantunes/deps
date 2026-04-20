'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, RefreshCw, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Service {
  icon: string
  title: string
  desc: string
}

interface LandingData {
  wa: {
    primary: string
    primaryDisplay: string
    secondary: string
    secondaryDisplay: string
  }
  stats: {
    clients: number
    experience: number
    services: number
  }
  hero: {
    badge: string
    line1: string
    line2: string
    highlight: string
    desc: string
  }
  cta: {
    title: string
    sub: string
  }
  services: Service[]
}

const DEFAULTS: LandingData = {
  wa: {
    primary: '5522999020699',
    primaryDisplay: '(22) 99902-0699',
    secondary: '5522992917421',
    secondaryDisplay: '(22) 99291-7421',
  },
  stats: { clients: 500, experience: 10, services: 12 },
  hero: {
    badge: 'Atendimento disponível agora',
    line1: 'Sua documentação',
    line2: 'resolvida com',
    highlight: 'um clique',
    desc: 'Transferência, recurso de multas, licenciamento e muito mais. Sem filas, sem burocracia — tudo pelo WhatsApp com quem entende de trânsito.',
  },
  cta: {
    title: 'Comprou ou vendeu seu veículo?\nA transferência é urgente.',
    sub: 'Não corra risco de ser multado. Resolva hoje mesmo com a Antunes Assessoria.',
  },
  services: [
    { icon: '🔄', title: 'Transferência de Propriedade', desc: 'Comprou ou vendeu? Fazemos a transferência com toda a segurança.' },
    { icon: '📋', title: 'Licenciamento Anual', desc: 'Mantenha seu veículo regularizado com o licenciamento em dia.' },
    { icon: '⚖️', title: 'Recurso de Multas', desc: 'Recebeu uma multa? Fazemos o recurso administrativo por você.' },
    { icon: '📄', title: '2ª Via CRV / CRLV', desc: 'Perdeu ou danificou o documento? Emitimos a segunda via rapidamente.' },
    { icon: '🏙️', title: 'Transferência de Jurisdição', desc: 'Mudou de estado? Transferimos o registro com toda a documentação.' },
    { icon: '🏘️', title: 'Troca de Município', desc: 'Atualização do município de registro sem complicação.' },
    { icon: '📢', title: 'Comunicação de Venda', desc: 'Proteja-se após vender. Notificação oficial ao DETRAN.' },
    { icon: '🔧', title: 'Alteração de Características', desc: 'Modificou o veículo? Regularize as alterações na documentação.' },
    { icon: '🆕', title: '1ª Licença', desc: 'Veículo novo? Fazemos o primeiro emplacamento e licenciamento.' },
    { icon: '🔍', title: 'Vistoria Veicular', desc: 'Toda a documentação necessária para vistoria do seu veículo.' },
    { icon: '💰', title: 'IPVA', desc: 'Consulta, parcelamento e orientação sobre o pagamento do IPVA.' },
    { icon: '🚗', title: 'Outros Serviços', desc: 'Tem outra pendência? Entre em contato — resolvemos tudo.' },
  ],
}

type Tab = 'contato' | 'hero' | 'servicos' | 'stats'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'contato', label: 'WhatsApp', icon: '📞' },
  { id: 'hero', label: 'Textos', icon: '✏️' },
  { id: 'servicos', label: 'Serviços', icon: '🔧' },
  { id: 'stats', label: 'Estatísticas', icon: '📊' },
]

export default function LandingEditor() {
  const [data, setData] = useState<LandingData>(DEFAULTS)
  const [tab, setTab] = useState<Tab>('contato')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/landing')
      .then(r => r.json())
      .then(({ data: saved }) => {
        if (saved) setData(saved)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success('Landing page atualizada!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const resetDefaults = () => {
    if (!confirm('Restaurar todos os textos e serviços para o padrão original?')) return
    setData(DEFAULTS)
    toast.success('Padrões restaurados — clique em Salvar para aplicar.')
  }

  const setWa = (field: keyof LandingData['wa'], val: string) =>
    setData(d => ({ ...d, wa: { ...d.wa, [field]: val } }))

  const setStats = (field: keyof LandingData['stats'], val: number) =>
    setData(d => ({ ...d, stats: { ...d.stats, [field]: val } }))

  const setHero = (field: keyof LandingData['hero'], val: string) =>
    setData(d => ({ ...d, hero: { ...d.hero, [field]: val } }))

  const setCta = (field: keyof LandingData['cta'], val: string) =>
    setData(d => ({ ...d, cta: { ...d.cta, [field]: val } }))

  const setService = (i: number, field: keyof Service, val: string) =>
    setData(d => {
      const services = [...d.services]
      services[i] = { ...services[i], [field]: val }
      return { ...d, services }
    })

  const addService = () =>
    setData(d => ({ ...d, services: [...d.services, { icon: '⭐', title: 'Novo Serviço', desc: 'Descrição do serviço.' }] }))

  const removeService = (i: number) => {
    if (data.services.length <= 1) return
    setData(d => ({ ...d, services: d.services.filter((_, idx) => idx !== i) }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <div className="flex items-center gap-3">
          <button
            onClick={resetDefaults}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Restaurar padrão
          </button>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver site
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: WhatsApp */}
      {tab === 'contato' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="WhatsApp Principal (só números)" hint="Ex: 5522999020699">
              <input type="tel" value={data.wa.primary} onChange={e => setWa('primary', e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="Exibição WhatsApp Principal" hint="Ex: (22) 99902-0699">
              <input type="text" value={data.wa.primaryDisplay} onChange={e => setWa('primaryDisplay', e.target.value)} />
            </Field>
            <Field label="WhatsApp Secundário (só números)" hint="Ex: 5522992917421">
              <input type="tel" value={data.wa.secondary} onChange={e => setWa('secondary', e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="Exibição WhatsApp Secundário" hint="Ex: (22) 99291-7421">
              <input type="text" value={data.wa.secondaryDisplay} onChange={e => setWa('secondaryDisplay', e.target.value)} />
            </Field>
          </div>
        </div>
      )}

      {/* Tab: Textos */}
      {tab === 'hero' && (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Seção Hero (topo)</p>
            <div className="space-y-4">
              <Field label="Texto do badge (tag verde)">
                <input type="text" value={data.hero.badge} onChange={e => setHero('badge', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Título — linha 1">
                  <input type="text" value={data.hero.line1} onChange={e => setHero('line1', e.target.value)} />
                </Field>
                <Field label="Título — linha 2">
                  <input type="text" value={data.hero.line2} onChange={e => setHero('line2', e.target.value)} />
                </Field>
                <Field label="Palavra em destaque (amarela)">
                  <input type="text" value={data.hero.highlight} onChange={e => setHero('highlight', e.target.value)} />
                </Field>
              </div>
              <Field label="Descrição do hero">
                <textarea rows={3} value={data.hero.desc} onChange={e => setHero('desc', e.target.value)} />
              </Field>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Banner CTA (faixa amarela)</p>
            <div className="space-y-4">
              <Field label="Título do banner">
                <input type="text" value={data.cta.title} onChange={e => setCta('title', e.target.value)} />
              </Field>
              <Field label="Subtítulo do banner">
                <input type="text" value={data.cta.sub} onChange={e => setCta('sub', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Serviços */}
      {tab === 'servicos' && (
        <div className="space-y-3">
          {data.services.map((sv, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">#{String(i + 1).padStart(2, '0')}</span>
                <button
                  onClick={() => removeService(i)}
                  disabled={data.services.length <= 1}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover
                </button>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <Field label="Ícone">
                  <input type="text" value={sv.icon} onChange={e => setService(i, 'icon', e.target.value)} className="text-center text-xl" />
                </Field>
                <Field label="Título">
                  <input type="text" value={sv.title} onChange={e => setService(i, 'title', e.target.value)} />
                </Field>
              </div>
              <Field label="Descrição">
                <textarea rows={2} value={sv.desc} onChange={e => setService(i, 'desc', e.target.value)} />
              </Field>
            </div>
          ))}
          <button
            onClick={addService}
            className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar serviço
          </button>
        </div>
      )}

      {/* Tab: Estatísticas */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Clientes atendidos">
            <input type="number" min={0} value={data.stats.clients} onChange={e => setStats('clients', Number(e.target.value))} />
          </Field>
          <Field label="Anos de experiência">
            <input type="number" min={0} value={data.stats.experience} onChange={e => setStats('experience', Number(e.target.value))} />
          </Field>
          <Field label="Tipos de serviços">
            <input type="number" min={0} value={data.stats.services} onChange={e => setStats('services', Number(e.target.value))} />
          </Field>
        </div>
      )}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactElement }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="[&_input]:w-full [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:border [&_input]:border-gray-300 [&_input]:dark:border-gray-600 [&_input]:rounded-lg [&_input]:bg-white [&_input]:dark:bg-gray-800 [&_input]:text-gray-900 [&_input]:dark:text-gray-100 [&_input]:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-blue-500 [&_textarea]:w-full [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:border [&_textarea]:border-gray-300 [&_textarea]:dark:border-gray-600 [&_textarea]:rounded-lg [&_textarea]:bg-white [&_textarea]:dark:bg-gray-800 [&_textarea]:text-gray-900 [&_textarea]:dark:text-gray-100 [&_textarea]:outline-none [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-blue-500 [&_textarea]:resize-none">
        {children}
      </div>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  )
}
