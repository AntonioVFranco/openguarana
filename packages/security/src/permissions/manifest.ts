import { parse } from 'yaml'
import { z }     from 'zod'

const PermissionManifestSchema = z.object({
  permissions: z.object({
    fs: z.object({
      read:  z.array(z.string()).default([]),
      write: z.array(z.string()).default([]),
    }).default({}),
    network: z.object({
      allow: z.array(z.string()).default([]),
    }).default({}),
    env: z.array(z.string()).default([]),
  }).default({}),
}).default({})

export type PermissionManifest = {
  fs:      { read: string[]; write: string[] }
  network: { allow: string[] }
  env:     string[]
}

export function parsePermissionManifest(yamlContent: string): PermissionManifest {
  const raw  = yamlContent ? (parse(yamlContent) as unknown) : {}
  const data = PermissionManifestSchema.parse(raw)

  if (data.permissions.network.allow.includes('*')) {
    throw new Error('wildcard network allow is not permitted')
  }

  return data.permissions as PermissionManifest
}
