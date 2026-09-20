import type { Category } from '../../../types/category'

interface CategoryFilterBarProps {
  categories: Category[]
  /** Categories (by id, or null for "uncategorized") currently hidden from the map. Empty = show everything. */
  hiddenKeys: Set<string | null>
  onToggle: (categoryId: string | null) => void
}

export function CategoryFilterBar({
  categories,
  hiddenKeys,
  onToggle,
}: CategoryFilterBarProps) {
  if (categories.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {categories.map((category) => {
        const active = !hiddenKeys.has(category.id)
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(category.id)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs ${
              active
                ? 'border-transparent text-white'
                : 'border-neutral-700 text-neutral-500'
            }`}
            style={active ? { backgroundColor: category.color } : undefined}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </button>
        )
      })}
      <button
        type="button"
        aria-pressed={!hiddenKeys.has(null)}
        onClick={() => onToggle(null)}
        className={`rounded-full border px-2.5 py-1.5 text-xs ${
          !hiddenKeys.has(null)
            ? 'border-neutral-500 bg-neutral-700 text-white'
            : 'border-neutral-700 text-neutral-500'
        }`}
      >
        미분류
      </button>
    </div>
  )
}
