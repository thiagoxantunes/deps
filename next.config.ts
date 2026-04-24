import type { NextConfig } from "next";

const securityHeaders = [
  // Previne clickjacking — página só pode ser exibida em iframe do mesmo domínio
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Impede sniffing de Content-Type pelo browser
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Controla informações de referência enviadas com requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Desativa recursos sensíveis do browser que não são usados
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Força HTTPS por 1 ano (ativo apenas em produção via Vercel)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Desativa detecção automática de XSS do browser legado (substituído por CSP)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/': ['./landing.html'],
  },

  async headers() {
    return [
      {
        // Aplica headers de segurança em todas as rotas
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // CORS restrito para as rotas de API internas
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
};

export default nextConfig;
