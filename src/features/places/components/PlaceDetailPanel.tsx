import { useState } from 'react'
import type { Category } from '../../../types/category'
import type { Place } from '../../../types/place'
import { DIMENSION_LABEL, type Dimension } from '../../../types/dimension'
import { useEscapeKey } from '../../../hooks/useEscapeKey'

interface PlaceDetailPanelProps {
  place: Place
  categories: Category[]
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
  categories,
  currentDimension,
  onEdit,
  onDelete,
  onRequestDeleteBaseCamp,
  onSetBaseCamp,
  onClose,
  onJumpToOtherDimension,
}: PlaceDetailPanelProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  useEscapeKey(onClose)

  const otherDimension: Dimension =
    currentDimension === 'overworld' ? 'nether' : 'overworld'
  const canJumpToOtherDimension =
    otherDimension === 'nether' ? place.nether !== null : place.overworld !== null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-detail-heading"
      className="fixed inset-x-0 bottom-0 z-10 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-neutral-900/95 p-4 text-neutral-100 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-3 sm:max-h-none sm:w-72 sm:rounded-lg"
    >
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-700 sm:hidden" />
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3
          id="place-detail-heading"
          className="flex items-center gap-1.5 text-base font-semibold"
        >
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

      {categories.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <span
              key={category.id}
              className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </span>
          ))}
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
