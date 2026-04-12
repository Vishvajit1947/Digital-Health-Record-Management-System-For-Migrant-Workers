import { getHealthScoreColor } from '../../lib/helpers'

export default function HealthScoreMeter({ score = 0, size = 120 }) {
  const radius = (size - 20) / 2
  const circumference = Math.PI * radius  // half circle
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = getHealthScoreColor(score)

  const cx = size / 2
  const cy = size / 2 + 10

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* Background arc */}
        <path
          d={`M 10,${cy} A ${radius},${radius} 0 0 1 ${size - 10},${cy}`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
          strokeLinecap="round"
          className="dark:stroke-slate-700"
        />
        {/* Score arc */}
        <path
          d={`M 10,${cy} A ${radius},${radius} 0 0 1 ${size - 10},${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="600" fill={color}>
          {score}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#94A3B8">
          Health Score
        </text>
      </svg>
    </div>
  )
}
