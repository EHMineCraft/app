import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { Category } from '../../../types/category'
import type { Place, PlaceInput } from '../../../types/place'
import {
  coordinatesDivergeFromConversion,
  netherToOverworldCoordinate,
  overworldToNetherCoordinate,
} from '../../../utils/dimensionConversion'
import {
  tryParseCoordinatePoint,
  validatePlaceForm,
  type PlaceFormErrors,
  type PlaceFormValues,
} from '../../../utils/placeValidation'
import { useEscapeKey } from '../../../hooks/useEscapeKey'

interface PlaceFormProps {
  initial: Place | null
  categories: Category[]
  /** True when this world currently has no places, so this new place will auto-become the base camp. */
  willBecomeBaseCamp: boolean
  onCancel: () => void
  /** Resolves to whether the save succeeded — the form stays open with an error on failure, so input isn't lost and nothing gets double-submitted. */
  onSubmit: (input: PlaceInput) => Promise<boolean>
}

type CoordinateKey = 'overworldX' | 'overworldZ' | 'netherX' | 'netherZ'

interface CoordinateField {
  value: string
  /** true if this field's value was last set by cross-dimension auto-calculation, not typed by the user. */
  auto: boolean
}

interface FieldsState {
  name: string
  description: string
  y: string
  categoryId: string | null
  overworldX: CoordinateField
  overworldZ: CoordinateField
  netherX: CoordinateField
  netherZ: CoordinateField
}

const COUNTERPART: Record<CoordinateKey, CoordinateKey> = {
  overworldX: 'netherX',
  overworldZ: 'netherZ',
  netherX: 'overworldX',
  netherZ: 'overworldZ',
}

const CONVERT: Record<CoordinateKey, (n: number) => number> = {
  overworldX: overworldToNetherCoordinate,
  overworldZ: overworldToNetherCoordinate,
  netherX: netherToOverworldCoordinate,
  netherZ: netherToOverworldCoordinate,
}

function buildInitialFields(place: Place | null): FieldsState {
  return {
    name: place?.name ?? '',
    description: place?.description ?? '',
    y: place?.y != null ? String(place.y) : '',
    categoryId: place?.categoryId ?? null,
    overworldX: { value: place?.overworld ? String(place.overworld.x) : '', auto: false },
    overworldZ: { value: place?.overworld ? String(place.overworld.z) : '', auto: false },
    netherX: { value: place?.nether ? String(place.nether.x) : '', auto: false },
    netherZ: { value: place?.nether ? String(place.nether.z) : '', auto: false },
  }
}

const inputClass =
  'mt-1 w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none'

export function PlaceForm({
  initial,
  categories,
  willBecomeBaseCamp,
  onCancel,
  onSubmit,
}: PlaceFormProps) {
  const [fields, setFields] = useState<FieldsState>(() =>
    buildInitialFields(initial),
  )
  const [errors, setErrors] = useState<PlaceFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  useEscapeKey(onCancel)

  const updateText =
    (key: 'name' | 'description' | 'y') =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))

  const handleCoordinateChange = (field: CoordinateKey, rawText: string) => {
    setFields((prev) => {
      const counterpart = COUNTERPART[field]
      const counterpartField = prev[counterpart]
      let nextCounterpart = counterpartField

      // Only auto-fill the counterpart if the user hasn't manually set it themselves.
      if (counterpartField.auto || counterpartField.value === '') {
        const trimmed = rawText.trim()
        if (trimmed === '') {
          nextCounterpart = { value: '', auto: true }
        } else {
          const num = Number(trimmed)
          if (Number.isFinite(num)) {
            nextCounterpart = { value: String(CONVERT[field](num)), auto: true }
          }
        }
      }

      return {
        ...prev,
        [field]: { value: rawText, auto: false },
        [counterpart]: nextCounterpart,
      }
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const values: PlaceFormValues = {
      name: fields.name,
      overworldX: fields.overworldX.value,
      overworldZ: fields.overworldZ.value,
      netherX: fields.netherX.value,
      netherZ: fields.netherZ.value,
      y: fields.y,
      description: fields.description,
    }
    const result = validatePlaceForm(values)
    if (!result.valid || !result.data) {
      setErrors(result.errors)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const success = await onSubmit({ ...result.data, categoryId: fields.categoryId })
    setSubmitting(false)
    if (!success) {
      setSubmitError('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const overworldPoint = tryParseCoordinatePoint(
    fields.overworldX.value,
    fields.overworldZ.value,
  )
  const netherPoint = tryParseCoordinatePoint(
    fields.netherX.value,
    fields.netherZ.value,
  )
  const showMismatchNotice =
    overworldPoint !== null &&
    netherPoint !== null &&
    coordinatesDivergeFromConversion(overworldPoint, netherPoint)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-form-heading"
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-neutral-900 p-5 text-neutral-100 shadow-xl"
      >
        <h2 id="place-form-heading" className="mb-4 text-lg font-semibold">
          {initial ? '장소 수정' : '장소 추가'}
        </h2>

        <label className="mb-3 block text-sm">
          이름
          <input
            value={fields.name}
            onChange={updateText('name')}
            className={inputClass}
            autoFocus
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name}</p>
          )}
        </label>

        <label className="mb-3 block text-sm">
          카테고리
          <select
            value={fields.categoryId ?? ''}
            onChange={(e) =>
              setFields((f) => ({
                ...f,
                categoryId: e.target.value === '' ? null : e.target.value,
              }))
            }
            className={inputClass}
          >
            <option value="">미분류</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        {willBecomeBaseCamp && (
          <p className="mb-3 text-xs text-emerald-400">
            🏠 이 월드의 첫 장소이므로 자동으로 베이스캠프가 됩니다.
          </p>
        )}

        <p className="mb-2 text-xs text-neutral-400">
          오버월드와 네더 중 한쪽만 입력하면 반대쪽 좌표가 8배 환산으로 자동
          채워집니다. 자동 계산 값은 추천 좌표이며, 실제 포탈 연결 위치와
          다를 수 있습니다.
        </p>

        <div className="mb-1 grid grid-cols-2 gap-2">
          <label className="text-sm">
            오버월드 X{' '}
            {fields.overworldX.auto && (
              <span className="text-neutral-500">(자동)</span>
            )}
            <input
              value={fields.overworldX.value}
              onChange={(e) =>
                handleCoordinateChange('overworldX', e.target.value)
              }
              inputMode="numeric"
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            오버월드 Z{' '}
            {fields.overworldZ.auto && (
              <span className="text-neutral-500">(자동)</span>
            )}
            <input
              value={fields.overworldZ.value}
              onChange={(e) =>
                handleCoordinateChange('overworldZ', e.target.value)
              }
              inputMode="numeric"
              className={inputClass}
            />
          </label>
        </div>
        {errors.overworld && (
          <p className="mb-2 mt-1 text-xs text-red-400">{errors.overworld}</p>
        )}

        <div className="mb-1 grid grid-cols-2 gap-2">
          <label className="text-sm">
            네더 X{' '}
            {fields.netherX.auto && (
              <span className="text-neutral-500">(자동)</span>
            )}
            <input
              value={fields.netherX.value}
              onChange={(e) =>
                handleCoordinateChange('netherX', e.target.value)
              }
              inputMode="numeric"
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            네더 Z{' '}
            {fields.netherZ.auto && (
              <span className="text-neutral-500">(자동)</span>
            )}
            <input
              value={fields.netherZ.value}
              onChange={(e) =>
                handleCoordinateChange('netherZ', e.target.value)
              }
              inputMode="numeric"
              className={inputClass}
            />
          </label>
        </div>
        {errors.nether && (
          <p className="mb-2 mt-1 text-xs text-red-400">{errors.nether}</p>
        )}
        {errors.coordinates && (
          <p className="mb-2 text-xs text-red-400">{errors.coordinates}</p>
        )}
        {showMismatchNotice && (
          <p className="mb-2 text-xs text-amber-400">
            입력하신 오버월드/네더 좌표가 8배 환산 규칙과 다릅니다. 실제
            포탈 연결 위치가 자동 계산 값과 다를 수 있어요 — 입력하신 값
            그대로 저장됩니다.
          </p>
        )}

        <label className="mb-3 block text-sm">
          Y 좌표 (선택)
          <input
            value={fields.y}
            onChange={updateText('y')}
            inputMode="numeric"
            className={inputClass}
          />
          {errors.y && <p className="mt-1 text-xs text-red-400">{errors.y}</p>}
        </label>

        <label className="mb-4 block text-sm">
          설명
          <textarea
            value={fields.description}
            onChange={updateText('description')}
            rows={3}
            className={inputClass}
          />
        </label>

        {submitError && (
          <p className="mb-2 text-xs text-red-400">{submitError}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
