'use client'

interface MonthData {
  month:   string   // "2025-04"
  revenue: number
  count:   number
}

interface Props {
  data: MonthData[]
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatMonth(key: string) {
  const [, m] = key.split('-')
  return MONTH_NAMES[parseInt(m, 10) - 1]
}

export default function RevenueBarChart({ data }: Props) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

  // Hauteur de la zone de barres en px
  const BAR_AREA_H = 120
  const BAR_WIDTH  = 28
  const GAP        = 8
  const TOTAL_W    = data.length * (BAR_WIDTH + GAP) - GAP

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenus mensuels (12 mois)</h3>

      <div className="overflow-x-auto">
        <svg
          width={Math.max(TOTAL_W + 40, 400)}
          height={BAR_AREA_H + 40}
          className="block"
          aria-label="Graphique des revenus mensuels"
        >
          {/* Lignes de grille horizontales */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = BAR_AREA_H - ratio * BAR_AREA_H
            return (
              <g key={ratio}>
                <line
                  x1={0}
                  y1={y}
                  x2={TOTAL_W + 40}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth={1}
                />
                {ratio > 0 && (
                  <text
                    x={0}
                    y={y - 2}
                    fontSize={9}
                    fill="#9ca3af"
                    textAnchor="start"
                  >
                    {Math.round(maxRevenue * ratio)}€
                  </text>
                )}
              </g>
            )
          })}

          {/* Barres */}
          {data.map((d, i) => {
            const barH = maxRevenue > 0 ? (d.revenue / maxRevenue) * BAR_AREA_H : 0
            const x    = i * (BAR_WIDTH + GAP) + 20   // 20px marge gauche pour les labels
            const y    = BAR_AREA_H - barH
            const isCurrentMonth = i === data.length - 1

            return (
              <g key={d.month}>
                {/* Barre */}
                <rect
                  x={x}
                  y={barH > 0 ? y : BAR_AREA_H - 2}
                  width={BAR_WIDTH}
                  height={barH > 0 ? barH : 2}
                  rx={3}
                  fill={isCurrentMonth ? '#006341' : '#a7d4be'}
                  className="transition-all duration-300"
                />

                {/* Valeur au-dessus si > 0 */}
                {d.revenue > 0 && (
                  <text
                    x={x + BAR_WIDTH / 2}
                    y={y - 4}
                    fontSize={9}
                    fill={isCurrentMonth ? '#006341' : '#6b7280'}
                    textAnchor="middle"
                    fontWeight={isCurrentMonth ? '700' : '400'}
                  >
                    {d.revenue.toFixed(0)}€
                  </text>
                )}

                {/* Mois */}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={BAR_AREA_H + 14}
                  fontSize={10}
                  fill={isCurrentMonth ? '#006341' : '#9ca3af'}
                  textAnchor="middle"
                  fontWeight={isCurrentMonth ? '600' : '400'}
                >
                  {formatMonth(d.month)}
                </text>

                {/* Nombre de cordages */}
                {d.count > 0 && (
                  <text
                    x={x + BAR_WIDTH / 2}
                    y={BAR_AREA_H + 26}
                    fontSize={9}
                    fill="#d1d5db"
                    textAnchor="middle"
                  >
                    ×{d.count}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-right">
        Barre foncée = mois en cours · ×n = nombre de cordages
      </p>
    </div>
  )
}
