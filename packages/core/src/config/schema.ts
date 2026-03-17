import { z } from 'zod'

export const GatewayConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).default(18789),
})

export const MemoryConfigSchema = z.object({
  diary:            z.boolean().default(true),
  graph:            z.boolean().default(false),
  extract_entities: z.boolean().default(true),
})

export const ProfessionalConfigSchema = z.object({
  enabled:   z.boolean().default(false),
  workspace: z.string().optional(),
}).default({})

export const GuaranaConfigSchema = z.object({
  gateway:      GatewayConfigSchema.default({}),
  memory:       MemoryConfigSchema.default({}),
  professional: ProfessionalConfigSchema,
  channels:     z.record(z.unknown()).default({}),
})

export type GuaranaConfig = z.infer<typeof GuaranaConfigSchema>
