import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { Category } from '../../../types/category'
import type { Place, PlaceInput } from '../../../types/place'
import {
  coordinatesDivergeFromConversion,
  netherToOverworldPoint,
  overworldToNetherPoint,
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

type DimensionScope = 'both' | 'overworld' | 'nether'

interface FieldsState {
  name: string
  description: string
  y: string
  categoryIds: string[]
  overworldX: string
  overworldZ: string
  netherX: string
  netherZ: string
}

function buildInitialFields(place: Place | null): FieldsState {
  return {
    name: place?.name ?? '',
    description: place?.description ?? '',
    y: place?.y != null ? String(place.y) : '',
    categoryIds: place?.categoryIds ?? [],
    overworldX: place?.overworld ? String(place.overworld.x) : '',
    overworldZ: place?.overworld ? String(place.overworld.z) : '',
    netherX: place?.nether ? String(place.nether.x) : '',
    netherZ: place?.nether ? String(place.nether.z) : '',
  }
}

function buildInitialDimensionScope(place: Place | null): DimensionScope {
  if (place?.overworld && !place.nether) return 'overworld'
  if (place?.nether && !place.overworld) return 'nether'
  return 'both'
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
  const [dimensionScope, setDimensionScope] = useState<DimensionScope>(() =>
    buildInitialDimensionScope(initial),
  )
  const [errors, setErrors] = useState<PlaceFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  useEscapeKey(onCancel)

  const updateField =
    (key: keyof FieldsState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))

  const toggleCategory = (categoryId: string) => {
    setFields((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(categoryId)
        ? f.categoryIds.filter((id) => id !== categoryId)
        : [...f.categoryIds, categoryId],
    }))
  }

  const overworldPoint = tryParseCoordinatePoint(
    fields.overworldX,
    fields.overworldZ,
  )
  const netherPoint = tryParseCoordinatePoint(fields.netherX, fields.netherZ)

  const calculateNetherFromOverworld = () => {
    if (!overworldPoint) return
    const nether = overworldToNetherPoint(overworldPoint)
    setFields((f) => ({
      ...f,
      netherX: String(nether.x),
      netherZ: String(nether.z),
    }))
  }

  const calculateOverworldFromNether = () => {
    if (!netherPoint) return
    const overworld = netherToOverworldPoint(netherPoint)
    setFields((f) => ({
      ...f,
      overworldX: String(overworld.x),
      overworldZ: String(overworld.z),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const values: PlaceFormValues = {
      name: fields.name,
      // A dimension-exclusive place ignores whatever sits in the other
      // side's fields — only the chosen dimension's coordinates are saved.
      overworldX: dimensionScope === 'nether' ? '' : fields.overworldX,
      overworldZ: dimensionScope === 'nether' ? '' : fields.overworldZ,
      netherX: dimensionScope === 'overworld' ? '' : fields.netherX,
      netherZ: dimensionScope === 'overworld' ? '' : fields.netherZ,
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
    const success = await onSubmit({
      ...result.data,
      categoryIds: fields.categoryIds,
    })
    setSubmitting(false)
    if (!success) {
      setSubmitError('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const showMismatchNotice =
    dimensionScope === 'both' &&
    overworldPoint !== null &&
    netherPoint !== null &&
    coordinatesDivergeFromConversion(overworldPoint, netherPoint)

  const showOverworldFields = dimensionScope !== 'nether'
  const showNetherFields = dimensionScope !== 'overworld'

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
            onChange={updateField('name')}
            className={inputClass}
            autoFocus
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name}</p>
          )}
        </label>

        <div className="mb-3">
          <span className="block text-sm">카테고리 (여러 개 선택 가능)</span>
          {categories.length === 0 ? (
            <p className="mt-1 text-xs text-neutral-500">
              아직 카테고리가 없습니다. 지도 상단의 "카테고리 관리"에서
              먼저 만들어주세요.
            </p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {categories.map((category) => {
                const checked = fields.categoryIds.includes(category.id)
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs ${
                      checked
                        ? 'border-transparent text-white'
                        : 'border-neutral-700 text-neutral-400'
                    }`}
                    style={checked ? { backgroundColor: category.color } : undefined}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {willBecomeBaseCamp && (
          <p className="mb-3 text-xs text-emerald-400">
            🏠 이 월드의 첫 장소이므로 자동으로 베이스캠프가 됩니다.
          </p>
        )}

        <div className="mb-3">
          <span className="block text-sm">표시 범위</span>
          <div className="mt-1 inline-flex overflow-hidden rounded border border-neutral-700 text-xs">
            {(
              [
                { value: 'both', label: '양쪽' },
                { value: 'overworld', label: '🌍 오버월드 전용' },
                { value: 'nether', label: '🔥 네더 전용' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={dimensionScope === option.value}
                onClick={() => setDimensionScope(option.value)}
                className={
                  dimensionScope === option.value
                    ? 'bg-blue-600 px-2.5 py-1.5 font-medium text-white'
                    : 'bg-neutral-800 px-2.5 py-1.5 text-neutral-300 hover:bg-neutral-700'
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          {dimensionScope !== 'both' && (
            <p className="mt-1 text-xs text-neutral-500">
              {dimensionScope === 'overworld' ? '네더' : '오버월드'} 지도에는
              표시되지 않습니다.
            </p>
          )}
        </div>

        {showOverworldFields && (
          <>
            <div className="mb-1 grid grid-cols-2 gap-2">
              <label className="text-sm">
                오버월드 X
                <input
                  value={fields.overworldX}
                  onChange={updateField('overworldX')}
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                오버월드 Z
                <input
                  value={fields.overworldZ}
                  onChange={updateField('overworldZ')}
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
            </div>
            {errors.overworld && (
              <p className="mb-1 mt-1 text-xs text-red-400">
                {errors.overworld}
              </p>
            )}
          </>
        )}

        {dimensionScope === 'both' && (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={calculateNetherFromOverworld}
              disabled={!overworldPoint}
              className="rounded border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
            >
              ↓ 이 오버월드 좌표로 네더 좌표 계산 (÷8)
            </button>
          </div>
        )}

        {showNetherFields && (
          <>
            <div className="mb-1 grid grid-cols-2 gap-2">
              <label className="text-sm">
                네더 X
                <input
                  value={fields.netherX}
                  onChange={updateField('netherX')}
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                네더 Z
                <input
                  value={fields.netherZ}
                  onChange={updateField('netherZ')}
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
            </div>
            {errors.nether && (
              <p className="mb-1 mt-1 text-xs text-red-400">{errors.nether}</p>
            )}
          </>
        )}

        {dimensionScope === 'both' && (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={calculateOverworldFromNether}
              disabled={!netherPoint}
              className="rounded border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
            >
              ↑ 이 네더 좌표로 오버월드 좌표 계산 (×8)
            </button>
          </div>
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
            onChange={updateField('y')}
            inputMode="numeric"
            className={inputClass}
          />
          {errors.y && <p className="mt-1 text-xs text-red-400">{errors.y}</p>}
        </label>

        <label className="mb-4 block text-sm">
          설명
          <textarea
            value={fields.description}
            onChange={updateField('description')}
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
