import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PlaceDetailPanel } from '../../places/components/PlaceDetailPanel'
import { PlaceForm } from '../../places/components/PlaceForm'
import {
  usePlacesForWorld,
  usePlacesStore,
} from '../../places/store/usePlacesStore'
import type { Place, PlaceInput } from '../../../types/place'
import type { MapMarker } from '../../../types/map'
import { MapCanvas } from '../components/MapCanvas'

type FormState = { mode: 'create' } | { mode: 'edit'; place: Place }

export function MapPage() {
  const { worldId } = useParams<{ worldId: string }>()
  const places = usePlacesForWorld(worldId ?? '')
  const addPlace = usePlacesStore((s) => s.addPlace)
  const updatePlace = usePlacesStore((s) => s.updatePlace)
  const removePlace = usePlacesStore((s) => s.removePlace)

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)

  const markers = useMemo<MapMarker[]>(
    () =>
      places
        .filter((p) => p.overworld !== null)
        .map((p) => ({
          id: p.id,
          name: p.name,
          x: p.overworld!.x,
          z: p.overworld!.z,
        })),
    [places],
  )

  if (!worldId) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        잘못된 접근입니다.
      </div>
    )
  }

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null

  const handleSubmit = (input: PlaceInput) => {
    if (formState?.mode === 'edit') {
      updatePlace(worldId, formState.place.id, input)
    } else {
      const created = addPlace(worldId, input)
      setSelectedPlaceId(created.id)
    }
    setFormState(null)
  }

  return (
    <div className="relative flex flex-1">
      <MapCanvas
        markers={markers}
        selectedId={selectedPlaceId}
        onSelect={setSelectedPlaceId}
      />

      <button
        type="button"
        onClick={() => setFormState({ mode: 'create' })}
        className="absolute bottom-3 left-3 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-500"
      >
        + 장소 추가
      </button>

      {selectedPlace && !formState && (
        <PlaceDetailPanel
          place={selectedPlace}
          onEdit={() => setFormState({ mode: 'edit', place: selectedPlace })}
          onDelete={() => {
            removePlace(worldId, selectedPlace.id)
            setSelectedPlaceId(null)
          }}
          onClose={() => setSelectedPlaceId(null)}
        />
      )}

      {formState && (
        <PlaceForm
          initial={formState.mode === 'edit' ? formState.place : null}
          onCancel={() => setFormState(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
