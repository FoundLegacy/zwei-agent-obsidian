import { useEffect, useState } from 'react'

import { usePlugin } from '../../../contexts/plugin-context'
import { useSettings } from '../../../contexts/settings-context'
import { tokenCount } from '../../../utils/llm/token'
import { ObsidianSetting } from '../../common/ObsidianSetting'
import { ObsidianTextInput } from '../../common/ObsidianTextInput'

const builtinTools = [
  {
    name: 'read_vault_file',
    label: 'Read File',
    description: 'Read the full content of a file from the vault.',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'File path relative to vault root (e.g. "folder/note.md")' },
    ],
  },
  {
    name: 'edit_vault_file',
    label: 'Edit File',
    description: 'Make an exact string replacement in a vault file. Requires user approval. Requires the file content to be in context first.',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'File path relative to vault root' },
      { name: 'old_string', type: 'string', required: true, desc: 'Exact text to find and replace. Must match whitespace exactly. Provide enough context to be unique.' },
      { name: 'new_string', type: 'string', required: true, desc: 'Replacement text. Use empty string to delete.' },
    ],
  },
  {
    name: 'search_vault',
    label: 'Search Vault',
    description: 'Search all files in the vault for a word or phrase. Use for broad vault-wide searches.',
    parameters: [
      { name: 'query', type: 'string', required: true, desc: 'The word or phrase to search for' },
      { name: 'caseSensitive', type: 'boolean', required: false, desc: 'Case-sensitive search. Defaults to false' },
    ],
  },
  {
    name: 'search_files',
    label: 'Search Files',
    description: 'Search for a word or phrase within one or more specific files. Use when you know which files to look in.',
    parameters: [
      { name: 'paths', type: 'string[]', required: true, desc: 'List of file paths to search within' },
      { name: 'query', type: 'string', required: true, desc: 'The word or phrase to search for' },
      { name: 'caseSensitive', type: 'boolean', required: false, desc: 'Case-sensitive search. Defaults to false' },
    ],
  },
  {
    name: 'create_file',
    label: 'Create File',
    description: 'Create a new file in the vault (.md, .canvas, .base). Requires user approval.',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'File path relative to vault root including extension' },
      { name: 'content', type: 'string', required: true, desc: 'Initial content of the file' },
    ],
  },
  {
    name: 'delete_file',
    label: 'Delete File',
    description: 'Delete a file from the vault. Requires user approval.',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'File path relative to vault root' },
    ],
  },
  {
    name: 'create_folder',
    label: 'Create Folder',
    description: 'Create a new folder/directory in the vault. Requires user approval.',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'Folder path relative to vault root (e.g. "Projects/New Folder")' },
    ],
  },
  {
    name: 'delete_folder',
    label: 'Delete Folder',
    description: 'Delete a folder from the vault. Only empty folders can be deleted. Requires user approval.',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'Folder path relative to vault root' },
    ],
  },
]

export function ToolsSection() {
  const plugin = usePlugin()
  const { settings, setSettings } = useSettings()
  const [toolsTokenEstimate, setToolsTokenEstimate] = useState<number | null>(null)

  const enabledTools = settings.enabledTools || []

  useEffect(() => {
    let cancelled = false
    async function computeToolsTokens() {
      const enabledToolDefs = builtinTools.filter((t) =>
        enabledTools.includes(t.name),
      )
      const toolDescriptions = JSON.stringify(enabledToolDefs.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })))
      const tokens = await tokenCount(toolDescriptions)
      if (!cancelled) setToolsTokenEstimate(tokens)
    }
    computeToolsTokens()
    return () => { cancelled = true }
  }, [plugin, enabledTools])

  const handleToolToggle = async (toolName: string, enabled: boolean) => {
    const newEnabledTools = enabled
      ? [...enabledTools, toolName]
      : enabledTools.filter((n) => n !== toolName)
    await setSettings({
      ...settings,
      enabledTools: newEnabledTools,
    })
  }

  return (
    <div className="za-settings-section">
      <ObsidianSetting
        name="Max auto tool iterations"
        desc="Maximum number of consecutive tool calls before requiring user confirmation. Higher values can increase cost."
      >
        <ObsidianTextInput
          value={settings.chatOptions.maxAutoIterations.toString()}
          onChange={async (value) => {
            const parsedValue = parseInt(value)
            if (isNaN(parsedValue) || parsedValue < 1) return
            await setSettings({
              ...settings,
              chatOptions: {
                ...settings.chatOptions,
                maxAutoIterations: parsedValue,
              },
            })
          }}
        />
      </ObsidianSetting>

      <div className="za-settings-separator" />

      <div className="za-settings-header">Available Tools</div>
      <div className="za-settings-desc">
        Select which tools to activate. Token usage changes based on enabled tools.
        {toolsTokenEstimate !== null && (
          <span className="za-settings-token-badge">
            ~{toolsTokenEstimate.toLocaleString()} tokens
          </span>
        )}
      </div>

      <div className="za-tools-grid">
        {builtinTools.map((tool) => {
          const isEnabled = enabledTools.includes(tool.name)
          return (
            <div key={tool.name} className="za-tool-card">
              <div className="za-tool-card-header">
                <div className="za-tool-card-header-left">
                  <code className="za-tool-card-name">{tool.name}</code>
                  <span className="za-tool-card-label">{tool.label}</span>
                </div>
                <label className="za-tool-card-checkbox">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleToolToggle(tool.name, e.target.checked)}
                  />
                </label>
              </div>
              <div className="za-tool-card-desc">{tool.description}</div>
              <div className="za-tool-card-params">
                {tool.parameters.map((p) => (
                  <div key={p.name} className="za-tool-param">
                    <code className="za-tool-param-name">{p.name}</code>
                    <span className="za-tool-param-type">{p.type}</span>
                    {p.required && <span className="za-tool-param-required">required</span>}
                    <span className="za-tool-param-desc">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
