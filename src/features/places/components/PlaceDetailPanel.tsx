import { useState } from 'react'
import type { Category } from '../../../types/category'
import type { Place } from '../../../types/place'
import { DIMENSION_LABEL, type Dimension } from '../../../types/dimension'

interface PlaceDetailPanelProps {
  place: Place
  category: Category | null
  currentDimension: Dimension
  onEdit: () => void
  onDelete: () => void
  onRequestDeleteBaseCamp: () => void
  onSetBaseCamp: () => void
  onClose: () => void
  onJumpToOtherDimension: () => void
}

export function PlaceDetailPanel({
  place,
  category,
  currentDimension,
  onEdit,
  onDelete,
  onRequestDeleteBaseCamp,
  onSetBaseCamp,
  onClose,
  onJumpToOtherDimension,
}: PlaceDetailPanelProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const otherDimension: Dimension =
    currentDimension === 'overworld' ? 'nether' : 'overworld'
  const canJumpToOtherDimension =
    otherDimension === 'nether' ? place.nether !== null : place.overworld !== null

  return (
    <div className="absolute right-3 top-3 z-10 w-72 rounded-lg bg-neutral-900/95 p-4 text-neutral-100 shadow-xl">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-base font-semibold">
          {place.isBaseCamp && <span title="베이스캠프">🏠</span>}
          {place.name}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-neutral-400 hover:text-neutral-100"
        >
          ×
        </button>
      </div>

      {category && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-neutral-300">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          {category.name}
        </div>
      )}

      <dl className="mb-3 space-y-1 font-mono text-xs text-neutral-300">
        {place.overworld && (
          <div>
            오버월드: X {place.overworld.x}, Z {place.overworld.z}
          </div>
        )}
        {place.nether && (
          <div>
            네더: X {place.nether.x}, Z {place.nether.z}
          </div>
        )}
        {place.y != null && <div>Y: {place.y}</div>}
      </dl>

      {place.description && (
        <p className="mb-3 whitespace-pre-wrap text-sm text-neutral-200">
          {place.description}
        </p>
      )}

      {canJumpToOtherDimension && (
        <button
          type="button"
          onClick={onJumpToOtherDimension}
          className="mb-2 w-full rounded bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
        >
          ↔ {DIMENSION_LABEL[otherDimension]}에서 보기
        </button>
      )}

      {!place.isBaseCamp && (
        <button
          type="button"
          onClick={onSetBaseCamp}
          className="mb-3 w-full rounded bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
        >
          🏠 베이스캠프로 지정
        </button>
      )}

      {!confirmingDelete ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() =>
              place.isBaseCamp
                ? onRequestDeleteBaseCamp()
                : setConfirmingDelete(true)
            }
            className="rounded bg-red-900/60 px-3 py-1.5 text-sm text-red-200 hover:bg-red-900"
          >
            삭제
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <span>정말 삭제할까요?</span>
          <button
            type="button"
            onClick={onDelete}
            className="rounded bg-red-600 px-2 py-1 text-xs font-medium hover:bg-red-500"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
