import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'
import type { World, WorldInput } from '../../types/world'
import { db } from './config'

interface WorldDoc {
  name: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

function worldsCollection(uid: string) {
  return collection(db, 'users', uid, 'maps')
}

function toWorld(id: string, data: WorldDoc): World {
  return {
    id,
    name: data.name,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    updatedAt: data.updatedAt?.toMillis() ?? Date.now(),
  }
}

export async function fetchWorlds(uid: string): Promise<World[]> {
  const snapshot = await getDocs(
    query(worldsCollection(uid), orderBy('updatedAt', 'desc')),
  )
  return snapshot.docs.map((d) => toWorld(d.id, d.data() as WorldDoc))
}

export async function createWorld(
  uid: string,
  input: WorldInput,
): Promise<World> {
  const ref = await addDoc(worldsCollection(uid), {
    name: input.name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // serverTimestamp() only resolves after a round trip; approximate with the
  // local clock so the new world can render immediately.
  const now = Date.now()
  return { id: ref.id, name: input.name, createdAt: now, updatedAt: now }
}

export async function renameWorld(
  uid: string,
  worldId: string,
  name: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'maps', worldId), {
    name,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteWorld(uid: string, worldId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'maps', worldId))
}
