export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Título */}
      <div className="space-y-2">
        <div className="h-7 w-52 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 w-80 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>

      {/* Tabela / lista */}
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  )
}
