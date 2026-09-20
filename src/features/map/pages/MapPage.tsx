import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../auth/store/useAuthStore'
import { CategoryFilterBar } from '../../categories/components/CategoryFilterBar'
import { CategoryManagerModal } from '../../categories/components/CategoryManagerModal'
import { useCategoriesForWorld, useCategoriesStore } from '../../categories/store/useCategoriesStore'
import { PlaceDetailPanel } from '../../places/components/PlaceDetailPanel'
import { PlaceForm } from '../../places/components/PlaceForm'
import { PlaceListModal } from '../../places/components/PlaceListModal'
import { ReassignBaseCampDialog } from '../../places/components/ReassignBaseCampDialog'
import {
  usePlacesForWorld,
  usePlacesStore,
} from '../../places/store/usePlacesStore'
import { useWorldsStore } from '../../worlds/store/useWorldsStore'
import type { Place, PlaceInput } from '../../../types/place'
import type { MapMarker } from '../../../types/map'
import type { Dimension } from '../../../types/dimension'
import {
  netherToOverworldPoint,
  overworldToNetherPoint,
} from '../../../utils/dimensionConversion'
import { DimensionToggle } from '../components/DimensionToggle'
import { MapCanvas } from '../components/MapCanvas'
import { useMapViewportStore } from '../store/useMapViewportStore'

type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; place: Place }
  | { mode: 'create-for-basecamp'; oldBaseCampId: string }

const DEFAULT_MARKER_COLOR = '#38bdf8'

export function MapPage() {
  const { worldId } = useParams<{ worldId: string }>()
  const uid = useAuthStore((s) => s.user?.uid)

  const places = usePlacesForWorld(worldId ?? '')
  const placesLoading = usePlacesStore((s) =>
    worldId ? (s.loadingByWorld[worldId] ?? false) : false,
  )
  const placesError = usePlacesStore((s) =>
    worldId ? s.errorByWorld[worldId] : null,
  )
  const loadPlaces = usePlacesStore((s) => s.loadPlaces)
  const addPlace = usePlacesStore((s) => s.addPlace)
  const updatePlace = usePlacesStore((s) => s.updatePlace)
  const removePlace = usePlacesStore((s) => s.removePlace)
  const setBaseCamp = usePlacesStore((s) => s.setBaseCamp)

  const categories = useCategoriesForWorld(worldId ?? '')
  const categoriesError = useCategoriesStore((s) =>
    worldId ? s.errorByWorld[worldId] : null,
  )
  const loadCategories = useCategoriesStore((s) => s.loadCategories)
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const viewport = useMapViewportStore((s) => s.viewport)
  const setCenter = useMapViewportStore((s) => s.setCenter)

  const rememberSelectedWorld = useWorldsStore((s) => s.selectWorld)
  useEffect(() => {
    if (uid && worldId) rememberSelectedWorld(uid, worldId)
  }, [uid, worldId, rememberSelectedWorld])

  // Fetch this world's places/categories from Firestore fresh on every
  // entry — the store then acts as the local cache for the rest of the visit.
  useEffect(() => {
    if (uid && worldId) {
      void loadPlaces(uid, worldId)
      void loadCategories(uid, worldId)
    }
  }, [uid, worldId, loadPlaces, loadCategories])

  // The initial dimension follows wherever the base camp actually has a
  // coordinate, so map entry always lands the user on solid ground.
  const [dimension, setDimension] = useState<Dimension>(() => {
    const baseCamp = places.find((p) => p.isBaseCamp)
    return baseCamp && !baseCamp.overworld && baseCamp.nether
      ? 'nether'
      : 'overworld'
  })
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [reassigningBaseCamp, setReassigningBaseCamp] = useState<Place | null>(
    null,
  )
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showPlaceList, setShowPlaceList] = useState(false)
  const [hiddenCategoryKeys, setHiddenCategoryKeys] = useState<
    Set<string | null>
  >(new Set())

  // Focus the viewport on the base camp once, when it first becomes
  // available — covers both "just selected this world" and "reloaded
  // straight into its map" entry paths.
  const hasCenteredOnBaseCamp = useRef(false)
  useEffect(() => {
    if (hasCenteredOnBaseCamp.current) return
    const baseCamp = places.find((p) => p.isBaseCamp)
    const point = baseCamp?.[dimension]
    if (!point) return
    hasCenteredOnBaseCamp.current = true
    setCenter(point)
  }, [places, dimension, setCenter])

  const markers = useMemo<MapMarker[]>(
    () =>
      places
        .filter((p) => p[dimension] !== null)
        // Visible if any one of its categories is visible (or it's
        // uncategorized and "미분류" is visible) — OR semantics, not AND.
        .filter((p) =>
          p.categoryIds.length === 0
            ? !hiddenCategoryKeys.has(null)
            : p.categoryIds.some((id) => !hiddenCategoryKeys.has(id)),
        )
        .map((p) => ({
          id: p.id,
          name: p.name,
          x: p[dimension]!.x,
          z: p[dimension]!.z,
          color:
            (p.categoryIds[0] && categoryMap.get(p.categoryIds[0])?.color) ??
            DEFAULT_MARKER_COLOR,
          isBaseCamp: p.isBaseCamp,
        })),
    [places, dimension, hiddenCategoryKeys, categoryMap],
  )

  if (!worldId || !uid) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        잘못된 접근입니다.
      </div>
    )
  }

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null
  const selectedCategories = (selectedPlace?.categoryIds ?? [])
    .map((id) => categoryMap.get(id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  const toggleCategoryVisibility = (key: string | null) => {
    setHiddenCategoryKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleDimensionChange = (next: Dimension) => {
    if (next === dimension) return
    // Keep the same real-world spot in view across the toggle, translated by the 8x rule.
    const center = { x: viewport.centerX, z: viewport.centerZ }
    const converted =
      next === 'nether'
        ? overworldToNetherPoint(center)
        : netherToOverworldPoint(center)
    setCenter(converted)
    setDimension(next)
  }

  const handleJumpToOtherDimension = () => {
    if (!selectedPlace) return
    const target: Dimension = dimension === 'overworld' ? 'nether' : 'overworld'
    const point = selectedPlace[target]
    if (!point) return
    setDimension(target)
    setCenter(point)
  }

  const handleSelectFromList = (place: Place) => {
    setSelectedPlaceId(place.id)
    setShowPlaceList(false)
    const point = place[dimension] ?? place.overworld ?? place.nether
    if (!point) return
    if (!place[dimension]) {
      setDimension(place.overworld ? 'overworld' : 'nether')
    }
    setCenter(point)
  }

  const handleSubmit = async (input: PlaceInput): Promise<boolean> => {
    if (formState?.mode === 'edit') {
      const ok = await updatePlace(uid, worldId, formState.place.id, input)
      if (ok) setFormState(null)
      return ok
    }
    if (formState?.mode === 'create-for-basecamp') {
      const created = await addPlace(uid, worldId, input)
      if (!created) return false
      await setBaseCamp(uid, worldId, created.id)
      await removePlace(uid, worldId, formState.oldBaseCampId)
      setSelectedPlaceId(created.id)
      setFormState(null)
      return true
    }
    const created = await addPlace(uid, worldId, input)
    if (!created) return false
    setSelectedPlaceId(created.id)
    setFormState(null)
    return true
  }

  const handleAssignExistingAndDelete = async (newBaseCampId: string) => {
    if (!reassigningBaseCamp) return
    await setBaseCamp(uid, worldId, newBaseCampId)
    await removePlace(uid, worldId, reassigningBaseCamp.id)
    setReassigningBaseCamp(null)
    setSelectedPlaceId(null)
  }

  const handleCreateNewForBaseCamp = () => {
    if (!reassigningBaseCamp) return
    setFormState({
      mode: 'create-for-basecamp',
      oldBaseCampId: reassigningBaseCamp.id,
    })
    setReassigningBaseCamp(null)
  }

  const displayedError = placesError ?? categoriesError

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-2">
        <DimensionToggle dimension={dimension} onChange={handleDimensionChange} />
        <CategoryFilterBar
          categories={categories}
          hiddenKeys={hiddenCategoryKeys}
          onToggle={toggleCategoryVisibility}
        />
        <button
          type="button"
          onClick={() => setShowPlaceList(true)}
          className="ml-auto rounded border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          장소 목록
        </button>
        <button
          type="button"
          onClick={() => setShowCategoryManager(true)}
          className="rounded border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          카테고리 관리
        </button>
      </div>

      {displayedError && (
        <div className="bg-red-900/60 px-4 py-1.5 text-sm text-red-100">
          {displayedError}
        </div>
      )}

      <div className="relative flex flex-1">
        <MapCanvas
          markers={markers}
          selectedId={selectedPlaceId}
          onSelect={setSelectedPlaceId}
          dimension={dimension}
          isLoading={placesLoading}
        />

        <button
          type="button"
          onClick={() => setFormState({ mode: 'create' })}
          className="absolute bottom-3 left-3 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-500"
        >
          + 장소 추가
        </button>

        {selectedPlace && !formState && !reassigningBaseCamp && (
          <PlaceDetailPanel
            place={selectedPlace}
            categories={selectedCategories}
            currentDimension={dimension}
            onEdit={() => setFormState({ mode: 'edit', place: selectedPlace })}
            onDelete={() => {
              void removePlace(uid, worldId, selectedPlace.id)
              setSelectedPlaceId(null)
            }}
            onRequestDeleteBaseCamp={() => setReassigningBaseCamp(selectedPlace)}
            onSetBaseCamp={() => void setBaseCamp(uid, worldId, selectedPlace.id)}
            onClose={() => setSelectedPlaceId(null)}
            onJumpToOtherDimension={handleJumpToOtherDimension}
          />
        )}

        {formState && (
          <PlaceForm
            initial={formState.mode === 'edit' ? formState.place : null}
            categories={categories}
            willBecomeBaseCamp={formState.mode === 'create' && places.length === 0}
            onCancel={() => setFormState(null)}
            onSubmit={handleSubmit}
          />
        )}

        {reassigningBaseCamp && (
          <ReassignBaseCampDialog
            currentBaseCamp={reassigningBaseCamp}
            otherPlaces={places.filter((p) => p.id !== reassigningBaseCamp.id)}
            onAssignExisting={(id) => void handleAssignExistingAndDelete(id)}
            onCreateNew={handleCreateNewForBaseCamp}
            onCancel={() => setReassigningBaseCamp(null)}
          />
        )}

        {showCategoryManager && (
          <CategoryManagerModal
            uid={uid}
            worldId={worldId}
            onClose={() => setShowCategoryManager(false)}
          />
        )}

        {showPlaceList && (
          <PlaceListModal
            places={places}
            categories={categories}
            dimension={dimension}
            onSelectPlace={handleSelectFromList}
            onClose={() => setShowPlaceList(false)}
          />
        )}
      </div>
    </div>
  )
}
