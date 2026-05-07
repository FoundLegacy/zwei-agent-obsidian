import {
  DEEPSEEK_PRICES,
  OPENAI_PRICES,
} from '../../constants'
import { ChatModel } from '../../types/chat-model.types'
import { ResponseUsage } from '../../types/llm/response'

// Returns the cost in dollars. Returns null if the model is not supported.
export const calculateLLMCost = ({
  model,
  usage,
}: {
  model: ChatModel
  usage: ResponseUsage
}): number | null => {
  if (model.pricing) {
    const cachedTokens = usage.prompt_cache_hit_tokens
      ?? usage.prompt_tokens_details?.cached_tokens
      ?? 0
    const missTokens = usage.prompt_cache_miss_tokens
      ?? (usage.prompt_tokens_details?.cached_tokens !== undefined
        ? usage.prompt_tokens - (usage.prompt_tokens_details.cached_tokens ?? 0)
        : usage.prompt_tokens)
    return (
      (cachedTokens * model.pricing.inputCached +
        missTokens * model.pricing.inputCacheMiss +
        usage.completion_tokens * model.pricing.output) /
      1_000_000
    )
  }

  switch (model.providerType) {
    case 'openai': {
      const openAiPricing = OPENAI_PRICES[model.model]
      if (!openAiPricing) {
        const deepseekPricing = DEEPSEEK_PRICES[model.model]
        if (!deepseekPricing) return null
        return (
          (usage.prompt_tokens * deepseekPricing.input +
            usage.completion_tokens * deepseekPricing.output) /
          1_000_000
        )
      }
      return (
        (usage.prompt_tokens * openAiPricing.input +
          usage.completion_tokens * openAiPricing.output) /
        1_000_000
      )
    }
    case 'local':
      return 0
    default:
      return null
  }
}
