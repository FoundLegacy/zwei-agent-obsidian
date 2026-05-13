import { useSettings } from '../../../contexts/settings-context'
import { ObsidianDropdown } from '../../common/ObsidianDropdown'
import { ObsidianSetting } from '../../common/ObsidianSetting'

export function ChatSection() {
  const { settings, setSettings } = useSettings()

  return (
    <div className="za-settings-section">
      <div className="za-settings-header">Default Chat Model</div>

      <ObsidianSetting
        name="Default chat model"
        desc="Choose the model you want to use for chat by default."
      >
        <ObsidianDropdown
          value={settings.chatModelId}
          options={Object.fromEntries(
            settings.chatModels
              .filter(({ enable }) => enable ?? true)
              .map((chatModel) => [
                chatModel.id,
                chatModel.id,
              ]),
          )}
          onChange={(value) => {
            void setSettings({
              ...settings,
              chatModelId: value,
            })
          }}
        />
      </ObsidianSetting>
    </div>
  )
}
