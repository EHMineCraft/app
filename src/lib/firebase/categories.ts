import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'
import type { Category, CategoryInput } from '../../types/category'
import { db } from './config'

interface CategoryDoc {
  name: string
  color: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

function categoriesCollection(uid: string, worldId: string) {
  return collection(db, 'users', uid, 'maps', worldId, 'categories')
}

function categoryDocRef(uid: string, worldId: string, categoryId: string) {
  return doc(db, 'users', uid, 'maps', worldId, 'categories', categoryId)
}

function toCategory(worldId: string, id: string, data: CategoryDoc): Category {
  return {
    id,
    worldId,
    name: data.name,
    color: data.color,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    updatedAt: data.updatedAt?.toMillis() ?? Date.now(),
  }
}

export async function fetchCategories(
  uid: string,
  worldId: string,
): Promise<Category[]> {
  const snapshot = await getDocs(categoriesCollection(uid, worldId))
  return snapshot.docs.map((d) => toCategory(worldId, d.id, d.data() as CategoryDoc))
}

export async function createCategory(
  uid: string,
  worldId: string,
  input: CategoryInput,
): Promise<Category> {
  const ref = await addDoc(categoriesCollection(uid, worldId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const now = Date.now()
  return { id: ref.id, worldId, createdAt: now, updatedAt: now, ...input }
}

export async function updateCategoryDoc(
  uid: string,
  worldId: string,
  categoryId: string,
  input: CategoryInput,
): Promise<void> {
  await updateDoc(categoryDocRef(uid, worldId, categoryId), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCategoryDoc(
  uid: string,
  worldId: string,
  categoryId: string,
): Promise<void> {
  await deleteDoc(categoryDocRef(uid, worldId, categoryId))
}
