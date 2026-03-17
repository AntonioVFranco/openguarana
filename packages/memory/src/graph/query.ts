import type { Entity, GraphStore } from './store.js'

export function findRelated(
  store: GraphStore,
  entityId: number,
  depth: number,
): Entity[] {
  const visited = new Set<number>([entityId])
  const result:   Entity[] = []
  let frontier: number[] = [entityId]

  for (let d = 0; d < depth; d++) {
    const nextFrontier: number[] = []
    for (const id of frontier) {
      const relations = store.getRelations(id)
      for (const rel of relations) {
        const neighbor = rel.from_id === id ? rel.to_id : rel.from_id
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          nextFrontier.push(neighbor)
          const entity = store.findEntityById(neighbor)
          if (entity) result.push(entity)
        }
      }
    }
    frontier = nextFrontier
  }

  return result
}
