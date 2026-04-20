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

  // Add "Área Administrativa" button in navbar
  body = body.replace(
    'Fale Conosco\n      </a>\n    </div>',
    'Fale Conosco\n      </a>\n      <a href="/auth/login" class="btn btn-outline" style="margin-left:.5rem;font-size:.8rem;padding:.55rem 1.1rem;">🔐 Área Adm</a>\n    </div>'
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
        /* Reset Next.js body styles for landing page */
        body { background: #0A0A0A !important; color: #fff !important; min-height: unset !important; }
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
