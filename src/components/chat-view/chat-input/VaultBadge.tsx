import clsx from 'clsx'
import { Eye, EyeOff, FolderTree } from 'lucide-react'
import { useCallback } from 'react'

import { useSettings } from '../../../contexts/settings-context'

export default function VaultBadge() {
  const { settings, setSettings } = useSettings()

  const handleToggle = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      void setSettings({
        ...settings,
        chatOptions: {
          ...settings.chatOptions,
          includeVaultStructure: !settings.chatOptions.includeVaultStructure,
        },
      })
    },
    [settings, setSettings],
  )

  return (
    <div className="za-chat-user-input-file-badge">
      <div className="za-chat-user-input-file-badge-name">
        <FolderTree
          size={12}
          className="za-chat-user-input-file-badge-name-icon"
        />
        <span
          className={clsx(
            !settings.chatOptions.includeVaultStructure &&
              'za-excluded-content',
          )}
        >
          Vault
        </span>
      </div>
      <div
        className="za-chat-user-input-file-badge-eye"
        onClick={handleToggle}
      >
        {settings.chatOptions.includeVaultStructure ? (
          <Eye size={12} />
        ) : (
          <EyeOff size={12} />
        )}
      </div>
    </div>
  )
}
