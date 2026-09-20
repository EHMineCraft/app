export interface Category {
  id: string
  worldId: string
  name: string
  color: string
  createdAt: number
  updatedAt: number
}

export interface CategoryInput {
  name: string
  color: string
}
