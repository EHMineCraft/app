import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { Place, PlaceInput } from '../../../types/place'
import {
  validatePlaceForm,
  type PlaceFormErrors,
  type PlaceFormValues,
} from '../../../utils/placeValidation'

interface PlaceFormProps {
  initial: Place | null
  onCancel: () => void
  onSubmit: (input: PlaceInput) => void
}

function toFormValues(place: Place | null): PlaceFormValues {
  return {
    name: place?.name ?? '',
    overworldX: place?.overworld ? String(place.overworld.x) : '',
    overworldZ: place?.overworld ? String(place.overworld.z) : '',
    netherX: place?.nether ? String(place.nether.x) : '',
    netherZ: place?.nether ? String(place.nether.z) : '',
    y: place?.y != null ? String(place.y) : '',
    description: place?.description ?? '',
  }
}

const inputClass =
  'mt-1 w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none'

export function PlaceForm({ initial, onCancel, onSubmit }: PlaceFormProps) {
  const [values, setValues] = useState<PlaceFormValues>(() =>
    toFormValues(initial),
  )
  const [errors, setErrors] = useState<PlaceFormErrors>({})

  const update =
    (key: keyof PlaceFormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = validatePlaceForm(values)
    if (!result.valid || !result.data) {
      setErrors(result.errors)
      return
    }
    onSubmit(result.data)
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-neutral-900 p-5 text-neutral-100 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold">
          {initial ? '장소 수정' : '장소 추가'}
        </h2>

        <label className="mb-3 block text-sm">
          이름
          <input
            value={values.name}
            onChange={update('name')}
            className={inputClass}
            autoFocus
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-400">{errors.name}</p>
          )}
        </label>

        <div className="mb-1 grid grid-cols-2 gap-2">
          <label className="text-sm">
            오버월드 X
            <input
              value={values.overworldX}
              onChange={update('overworldX')}
              inputMode="numeric"
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            오버월드 Z
            <input
              value={values.overworldZ}
              onChange={update('overworldZ')}
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
            네더 X
            <input
              value={values.netherX}
              onChange={update('netherX')}
              inputMode="numeric"
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            네더 Z
            <input
              value={values.netherZ}
              onChange={update('netherZ')}
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

        <label className="mb-3 block text-sm">
          Y 좌표 (선택)
          <input
            value={values.y}
            onChange={update('y')}
            inputMode="numeric"
            className={inputClass}
          />
          {errors.y && <p className="mt-1 text-xs text-red-400">{errors.y}</p>}
        </label>

        <label className="mb-4 block text-sm">
          설명
          <textarea
            value={values.description}
            onChange={update('description')}
            rows={3}
            className={inputClass}
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            취소
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  )
}
