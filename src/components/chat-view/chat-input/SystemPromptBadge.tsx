import clsx from 'clsx'
import { Eye, EyeOff, FileText } from 'lucide-react'
import { useCallback } from 'react'

import { useSettings } from '../../../contexts/settings-context'

export default function SystemPromptBadge() {
  const { settings, setSettings } = useSettings()

  const handleToggle = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      void setSettings({
        ...settings,
        systemPromptEnabled: !settings.systemPromptEnabled,
      })
    },
    [settings, setSettings],
  )

  return (
    <div className="za-chat-user-input-file-badge">
      <div className="za-chat-user-input-file-badge-name">
        <FileText
          size={12}
          className="za-chat-user-input-file-badge-name-icon"
        />
        <span
          className={clsx(
            !settings.systemPromptEnabled && 'za-excluded-content',
          )}
        >
          System
        </span>
      </div>
      <div
        className="za-chat-user-input-file-badge-eye"
        onClick={handleToggle}
      >
        {settings.systemPromptEnabled ? (
          <Eye size={12} />
        ) : (
          <EyeOff size={12} />
        )}
      </div>
    </div>
  )
}
