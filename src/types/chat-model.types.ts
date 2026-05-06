import { z } from 'zod'

import { PromptLevel } from './prompt-level.types'

const baseChatModelSchema = z.object({
  providerId: z
    .string({
      required_error: 'provider ID is required',
    })
    .min(1, 'provider ID is required'),
  id: z
    .string({
      required_error: 'id is required',
    })
    .min(1, 'id is required'),
  model: z
    .string({
      required_error: 'model is required',
    })
    .min(1, 'model is required'),
  promptLevel: z
    .nativeEnum(PromptLevel)
    .default(PromptLevel.Default)
    .optional(),
  enable: z.boolean().default(true).optional(),
  temperature: z.number().min(0).max(2).default(0.7).optional(),
  pricing: z
    .object({
      inputCached: z.number().min(0),
      inputCacheMiss: z.number().min(0),
      output: z.number().min(0),
    })
    .optional(),
})

export const chatModelSchema = z.discriminatedUnion('providerType', [
  z.object({
    providerType: z.literal('openai'),
    ...baseChatModelSchema.shape,
    reasoning: z
      .object({
        enabled: z.boolean(),
        reasoning_effort: z
          .enum(['minimal', 'low', 'medium', 'high'])
          .optional(),
      })
      .optional(),
  }),
  z.object({
    providerType: z.literal('deepseek'),
    ...baseChatModelSchema.shape,
    thinking: z
      .object({
        enabled: z.boolean(),
        thinking_effort: z.enum(['low', 'medium', 'high']).optional(),
      })
      .optional(),
  }),
])

export type ChatModel = z.infer<typeof chatModelSchema>
