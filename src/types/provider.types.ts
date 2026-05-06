import { z } from 'zod'

export const baseLlmProviderSchema = z.object({
  id: z.string().min(1, 'id is required'),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  additionalSettings: z.record(z.string(), z.string()).optional(),
})

export const llmProviderSchema = z.object({
  type: z.string().catch('openai'),
  ...baseLlmProviderSchema.shape,
})

export type LLMProvider = z.infer<typeof llmProviderSchema>
export type LLMProviderType = 'openai' | 'deepseek'
