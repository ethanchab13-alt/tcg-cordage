import type { OrderStatus } from '@/types/database'

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending:     { label: 'En attente',   className: 'badge badge-pending' },
  in_progress: { label: 'En cours',     className: 'badge badge-in_progress' },
  ready:       { label: '✓ Prête !',    className: 'badge badge-ready' },
  delivered:   { label: 'Récupérée',    className: 'badge badge-delivered' },
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status]
  return <span className={config.className}>{config.label}</span>
}
