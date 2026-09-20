import type { Dimension } from '../../../types/dimension'

interface DimensionToggleProps {
  dimension: Dimension
  onChange: (dimension: Dimension) => void
}

export function DimensionToggle({ dimension, onChange }: DimensionToggleProps) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-neutral-700 text-sm">
      <button
        type="button"
        aria-pressed={dimension === 'overworld'}
        onClick={() => onChange('overworld')}
        className={
          dimension === 'overworld'
            ? 'bg-emerald-600 px-3 py-2 font-medium text-white'
            : 'bg-neutral-800 px-3 py-2 text-neutral-300 hover:bg-neutral-700'
        }
      >
        🌍 오버월드
      </button>
      <button
        type="button"
        aria-pressed={dimension === 'nether'}
        onClick={() => onChange('nether')}
        className={
          dimension === 'nether'
            ? 'bg-red-600 px-3 py-2 font-medium text-white'
            : 'bg-neutral-800 px-3 py-2 text-neutral-300 hover:bg-neutral-700'
        }
      >
        🔥 네더
      </button>
    </div>
  )
}
