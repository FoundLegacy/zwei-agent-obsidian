import clsx from 'clsx'
import { Eye, EyeOff, Wrench } from 'lucide-react'
import { useCallback, useMemo } from 'react'

import { useSettings } from '../../../contexts/settings-context'
import { ToolManager } from '../../../core/tools/toolManager'
import { useApp } from '../../../contexts/app-context'

export default function ToolBadge() {
  const { settings, setSettings } = useSettings()
  const app = useApp()

  const allToolNames = useMemo(() => {
    const tm = new ToolManager(app)
    return tm.getBuiltinTools().map((t) => t.name)
  }, [app])

  const toolsEnabled = settings.enabledTools.length > 0
  const toolCount = settings.enabledTools.length

  const handleToolToggle = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      void setSettings({
        ...settings,
        enabledTools: toolsEnabled ? [] : [...allToolNames],
      })
    },
    [settings, setSettings, toolsEnabled, allToolNames],
  )

  return (
    <div
      className="za-chat-user-input-file-badge"
    >
      <div className="za-chat-user-input-file-badge-name">
        <Wrench
          size={12}
          className="za-chat-user-input-file-badge-name-icon"
        />
        <span
          className={clsx(
            !toolsEnabled && 'za-excluded-content',
          )}
        >
          Tools ({toolCount})
        </span>
      </div>
      <div
        className="za-chat-user-input-file-badge-eye"
        onClick={handleToolToggle}
      >
        {toolsEnabled ? (
          <Eye size={12} />
        ) : (
          <EyeOff size={12} />
        )}
      </div>
    </div>
  )
}
