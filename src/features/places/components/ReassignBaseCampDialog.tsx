import type { Place } from '../../../types/place'
import { useEscapeKey } from '../../../hooks/useEscapeKey'

interface ReassignBaseCampDialogProps {
  currentBaseCamp: Place
  otherPlaces: Place[]
  onAssignExisting: (placeId: string) => void
  onCreateNew: () => void
  onCancel: () => void
}

export function ReassignBaseCampDialog({
  currentBaseCamp,
  otherPlaces,
  onAssignExisting,
  onCreateNew,
  onCancel,
}: ReassignBaseCampDialogProps) {
  useEscapeKey(onCancel)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reassign-basecamp-heading"
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-neutral-900 p-5 text-neutral-100 shadow-xl">
        <h2 id="reassign-basecamp-heading" className="mb-2 text-lg font-semibold">
          베이스캠프 재지정 필요
        </h2>
        <p className="mb-4 text-sm text-neutral-300">
          {currentBaseCamp.name}은(는) 이 월드의 베이스캠프입니다. 삭제하려면
          먼저 다른 장소를 베이스캠프로 지정해야 합니다.
        </p>

        {otherPlaces.length > 0 ? (
          <ul className="mb-4 max-h-48 space-y-1 overflow-y-auto">
            {otherPlaces.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => onAssignExisting(place.id)}
                  className="w-full rounded bg-neutral-800 px-3 py-2 text-left text-sm hover:bg-neutral-700"
                >
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-amber-400">
            다른 장소가 없습니다. 새 장소를 만들어야 베이스캠프를 옮기고
            삭제할 수 있습니다.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500"
          >
            + 새 장소를 베이스캠프로
          </button>
        </div>
      </div>
    </div>
  )
}
