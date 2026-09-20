import type { Category } from '../../../types/category'
import type { Dimension } from '../../../types/dimension'
import type { Place } from '../../../types/place'
import { useEscapeKey } from '../../../hooks/useEscapeKey'

interface PlaceListModalProps {
  places: Place[]
  categories: Category[]
  dimension: Dimension
  onSelectPlace: (place: Place) => void
  onClose: () => void
}

export function PlaceListModal({
  places,
  categories,
  dimension,
  onSelectPlace,
  onClose,
}: PlaceListModalProps) {
  useEscapeKey(onClose)

  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const sortedPlaces = [...places].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-list-heading"
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-neutral-900 p-5 text-neutral-100 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="place-list-heading" className="text-lg font-semibold">
            장소 목록 ({places.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-neutral-400 hover:text-neutral-100"
          >
            ×
          </button>
        </div>

        {sortedPlaces.length === 0 ? (
          <p className="text-sm text-neutral-500">아직 등록된 장소가 없습니다.</p>
        ) : (
          <ul className="-mx-1 space-y-1 overflow-y-auto">
            {sortedPlaces.map((place) => {
              const inCurrentDimension = place[dimension] !== null
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPlace(place)}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-neutral-800"
                  >
                    {place.isBaseCamp && <span title="베이스캠프">🏠</span>}
                    <span className="min-w-0 flex-1 truncate">
                      {place.name}
                    </span>
                    {place.categoryIds.map((id) => {
                      const category = categoryMap.get(id)
                      if (!category) return null
                      return (
                        <span
                          key={id}
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )
                    })}
                    {!inCurrentDimension && (
                      <span className="shrink-0 text-xs text-neutral-500">
                        {dimension === 'overworld' ? '🔥 네더만' : '🌍 오버월드만'}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
