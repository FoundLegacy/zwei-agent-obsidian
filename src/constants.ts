import { ChatModel } from './types/chat-model.types'
import { LLMProvider, LLMProviderType } from './types/provider.types'

export const CHAT_VIEW_TYPE = 'za-chat-view'

export const DEFAULT_CHAT_MODEL_ID = 'deepseek-v4-pro'

export const PROVIDER_TYPES_INFO = {
  openai: {
    label: 'OpenAI',
    defaultProviderId: 'openai',
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [],
  },
  deepseek: {
    label: 'DeepSeek',
    defaultProviderId: 'deepseek',
    requireApiKey: true,
    requireBaseUrl: false,
    additionalSettings: [],
  },
} as const satisfies Record<
  LLMProviderType,
  {
    label: string
    defaultProviderId: string | null
    requireApiKey: boolean
    requireBaseUrl: boolean
    additionalSettings: {
      label: string
      key: string
      type: 'text' | 'toggle'
      placeholder?: string
      description?: string
      required?: boolean
    }[]
  }
>

export const DEFAULT_PROVIDERS: readonly LLMProvider[] = [
  {
    type: 'openai',
    id: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
  },
  {
    type: 'openai',
    id: 'openai',
    baseUrl: 'https://api.openai.com/v1',
  },
  {
    type: 'openai',
    id: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1/',
  },
  {
    type: 'openai',
    id: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  },
  {
    type: 'openai',
    id: 'perplexity',
    baseUrl: 'https://api.perplexity.ai',
  },
  {
    type: 'openai',
    id: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    type: 'openai',
    id: 'xai',
    baseUrl: 'https://api.x.ai/v1',
  },
  {
    type: 'openai',
    id: 'mistral',
    baseUrl: 'https://api.mistral.ai/v1',
  },
  {
    type: 'openai',
    id: 'kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
  },
  {
    type: 'openai',
    id: 'Z.ai',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    type: 'openai',
    id: 'minimax',
    baseUrl: 'https://api.minimax.chat/v1',
  },
]

export const DEFAULT_CHAT_MODELS: readonly ChatModel[] = [
  {
    providerType: 'deepseek',
    providerId: 'deepseek',
    id: 'deepseek-v4-pro',
    model: 'deepseek-v4-pro',
    temperature: 0.6,
    pricing: { inputCached: 0.14, inputCacheMiss: 0.28, output: 0.42 },
  },
  {
    providerType: 'deepseek',
    providerId: 'deepseek',
    id: 'deepseek-v4-flash',
    model: 'deepseek-v4-flash',
    temperature: 0.6,
    pricing: { inputCached: 0.07, inputCacheMiss: 0.14, output: 0.28 },
  },
]

type ModelPricing = {
  input: number
  output: number
}

export const OPENAI_PRICES: Record<string, ModelPricing> = {
  'gpt-rc-latest': { input: 1.75, output: 14 },
  'gpt-re-latest': { input: 1.75, output: 14 },
  'gpt-5.2': { input: 1.75, output: 14 },
  'gpt-5.1': { input: 1.25, output: 10 },
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  o3: { input: 10, output: 40 },
  o1: { input: 15, output: 60 },
  'o4-mini': { input: 1.1, output: 4.4 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'o1-mini': { input: 1.1, output: 4.4 },
}

export const DEEPSEEK_PRICES: Record<string, ModelPricing> = {
  'deepseek-v4-pro': { input: 0.28, output: 0.42 },
  'deepseek-v4-flash': { input: 0.14, output: 0.28 },
}
