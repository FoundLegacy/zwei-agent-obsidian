import {
  ZweiAgentSettings,
  zweiAgentSettingsSchema,
} from './setting.types'

export function parseZweiAgentSettings(
  data: unknown,
): ZweiAgentSettings {
  try {
    return zweiAgentSettingsSchema.parse(data)
  } catch (error) {
    console.warn('Invalid settings provided, using defaults:', error)
    return zweiAgentSettingsSchema.parse({})
  }
}
