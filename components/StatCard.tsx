interface StatCardProps {
  label:     string
  value:     string
  sub?:      string
  highlight?: boolean
  icon?:     React.ReactNode
}

export default function StatCard({ label, value, sub, highlight = false, icon }: StatCardProps) {
  return (
    <div className={`card flex flex-col gap-1 ${highlight ? 'border-[#006341]/30 bg-[#f7fcfa]' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold tracking-tight ${highlight ? 'text-[#006341]' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}
