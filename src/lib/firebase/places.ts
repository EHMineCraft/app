import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import type { GamePoint } from '../../types/map'
import type { Place, PlaceInput } from '../../types/place'
import { db } from './config'

interface PlaceDoc {
  name: string
  /** Older docs may still have a singular categoryId — toPlace() migrates those on read. */
  categoryIds?: string[]
  categoryId?: string | null
  overworld: GamePoint | null
  nether: GamePoint | null
  y: number | null
  description: string
  isBaseCamp: boolean
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

function placesCollection(uid: string, worldId: string) {
  return collection(db, 'users', uid, 'maps', worldId, 'places')
}

function placeDocRef(uid: string, worldId: string, placeId: string) {
  return doc(db, 'users', uid, 'maps', worldId, 'places', placeId)
}

function toPlace(worldId: string, id: string, data: PlaceDoc): Place {
  return {
    id,
    worldId,
    name: data.name,
    categoryIds:
      data.categoryIds ?? (data.categoryId ? [data.categoryId] : []),
    overworld: data.overworld,
    nether: data.nether,
    y: data.y,
    description: data.description,
    isBaseCamp: data.isBaseCamp,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    updatedAt: data.updatedAt?.toMillis() ?? Date.now(),
  }
}

export async function fetchPlaces(uid: string, worldId: string): Promise<Place[]> {
  const snapshot = await getDocs(placesCollection(uid, worldId))
  return snapshot.docs.map((d) => toPlace(worldId, d.id, d.data() as PlaceDoc))
}

export async function createPlace(
  uid: string,
  worldId: string,
  input: PlaceInput,
  isBaseCamp: boolean,
): Promise<Place> {
  const ref = await addDoc(placesCollection(uid, worldId), {
    ...input,
    isBaseCamp,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // serverTimestamp() only resolves after a round trip; approximate with the
  // local clock so the new place can render immediately.
  const now = Date.now()
  return { id: ref.id, worldId, isBaseCamp, createdAt: now, updatedAt: now, ...input }
}

export async function updatePlaceDoc(
  uid: string,
  worldId: string,
  placeId: string,
  input: PlaceInput,
): Promise<void> {
  await updateDoc(placeDocRef(uid, worldId, placeId), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePlaceDoc(
  uid: string,
  worldId: string,
  placeId: string,
): Promise<void> {
  await deleteDoc(placeDocRef(uid, worldId, placeId))
}

/** Flips isBaseCamp across every place in one atomic batch, so Firestore never briefly holds two (or zero). */
export async function setBaseCampDoc(
  uid: string,
  worldId: string,
  placeId: string,
  allPlaceIds: string[],
): Promise<void> {
  const batch = writeBatch(db)
  for (const id of allPlaceIds) {
    batch.update(placeDocRef(uid, worldId, id), {
      isBaseCamp: id === placeId,
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}
