const CACHE_NAME = 'despachante-v1'

// Arquivos estáticos que ficam em cache offline
const STATIC_ASSETS = [
  '/offline.html',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  // Ignora requests não-GET e extensões do Chrome
  if (event.request.method !== 'GET') return
  if (event.request.url.startsWith('chrome-extension')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cacheia respostas bem-sucedidas de assets estáticos
        if (response.ok && event.request.url.includes('/_next/static')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Se offline, tenta o cache; senão mostra página offline
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html')
          }
        })
      })
  )
})
