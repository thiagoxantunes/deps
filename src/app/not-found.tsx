import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-blue-600">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">Página não encontrada</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">
          A página que você procura não existe ou foi movida.
        </p>
        <Link href="/dashboard">
          <Button>
            <Home className="w-4 h-4" />
            Ir para o Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
