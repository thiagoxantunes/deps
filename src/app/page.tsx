import { createClient } from '@/lib/supabase/server'
import Script from 'next/script'
import fs from 'fs'
import path from 'path'

export default async function LandingPage() {
  const htmlFile = fs.readFileSync(path.join(process.cwd(), 'landing.html'), 'utf-8')

  // Extract CSS from <style> tag
  const cssMatch = htmlFile.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  const css = cssMatch ? cssMatch[1] : ''

  // Extract body content
  const bodyMatch = htmlFile.match(/<body[^>]*>([\s\S]*)<\/body>/)
  let body = bodyMatch ? bodyMatch[1] : ''

  // Remove all script tags from body (they won't execute via dangerouslySetInnerHTML)
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '')

  // Injeta botão discreto de acesso ao sistema no rodapé (no lugar do ⚙ antigo)
  body = body.replace(
    '&copy; 2026 Thiago Antunes Assessoria de Trânsito. Todos os direitos reservados.',
    '&copy; 2026 Thiago Antunes Assessoria de Trânsito. Todos os direitos reservados. <a id="system-access-btn" href="/auth/login">⚙</a>'
  )


  // Extract all <script> blocks and get the last one (the main app script)
  const scripts = [...htmlFile.matchAll(/<script>([\s\S]*?)<\/script>/gi)]
  const mainScript = scripts.length > 0 ? scripts[scripts.length - 1][1] : ''

  // Fetch Supabase landing config
  let serverData: unknown = null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('landing_config')
      .select('data')
      .maybeSingle()
    serverData = data?.data ?? null
  } catch {
    // No config yet or no auth context — use defaults
  }

  const overrideScript = `
(function() {
  var sd = ${serverData ? JSON.stringify(serverData) : 'null'};
  if (sd) { DATA = sd; applyData(DATA); }

  var _orig = saveAll;
  saveAll = function() {
    _orig();
    fetch('/api/landing', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(DATA)
    }).catch(function(){});
  };

  var _origReset = resetToDefaults;
  resetToDefaults = function() {
    _origReset();
    fetch('/api/landing', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(DATA)
    }).catch(function(){});
  };
})();
`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #0A0A0A !important; color: #fff !important; min-height: unset !important; }
        /* Oculta painel admin antigo — edição feita dentro do sistema */
        #admin-overlay { display: none !important; }
        #admin-trigger { display: none !important; }
        /* Botão discreto de acesso ao sistema */
        #system-access-btn {
          font-size: .72rem;
          color: rgba(255,255,255,.15);
          text-decoration: none;
          cursor: pointer;
          user-select: none;
          transition: color .2s;
          margin-left: .5rem;
        }
        #system-access-btn:hover { color: rgba(255,255,255,.4); }
        ${css}
      `}} />
      <div dangerouslySetInnerHTML={{ __html: body }} />
      <Script id="landing-main" strategy="afterInteractive">
        {mainScript}
      </Script>
      <Script id="landing-override" strategy="afterInteractive">
        {overrideScript}
      </Script>
    </>
  )
}
