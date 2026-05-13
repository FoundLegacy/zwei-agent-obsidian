import { useEffect, useMemo, useState } from 'react'

import { usePlugin } from '../../../contexts/plugin-context'
import { useSettings } from '../../../contexts/settings-context'
import { tokenCount } from '../../../utils/llm/token'
import { ObsidianSetting } from '../../common/ObsidianSetting'
import { ObsidianTextInput } from '../../common/ObsidianTextInput'

const builtinTools = [
  // Searching
  {
    name: 'search_vault',
    label: 'Search Vault',
    description: 'Search all files in the vault for a word or phrase. Use for broad vault-wide searches.',
    tab: 'searching',
    parameters: [
      { name: 'query', type: 'string', required: true, desc: 'The word or phrase to search for' },
      { name: 'caseSensitive', type: 'boolean', required: false, desc: 'Case-sensitive search. Defaults to false' },
    ],
  },
  {
    name: 'search_files',
    label: 'Search Files',
    description: 'Search for a word or phrase within one or more specific files. Use when you know which files to look in.',
    tab: 'searching',
    parameters: [
      { name: 'paths', type: 'string[]', required: true, desc: 'List of file paths to search within' },
      { name: 'query', type: 'string', required: true, desc: 'The word or phrase to search for' },
      { name: 'caseSensitive', type: 'boolean', required: false, desc: 'Case-sensitive search. Defaults to false' },
    ],
  },
  {
    name: 'read_vault_file',
    label: 'Read File',
    description: 'Read the full content of a file from the vault.',
    tab: 'searching',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'File path relative to vault root (e.g. "folder/note.md")' },
    ],
  },
  // File Modifications
  {
    name: 'edit_vault_file',
    label: 'Edit File',
    description: 'Replace text in a vault file. Requires user approval. old_string must be unique — include surrounding lines if ambiguous.',
    tab: 'file-modifications',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'File path relative to vault root' },
      { name: 'old_string', type: 'string', required: true, desc: 'Exact text to find and replace. Must match whitespace exactly. Provide enough context to be unique.' },
      { name: 'new_string', type: 'string', required: true, desc: 'Replacement text. Use empty string to delete.' },
    ],
  },
  {
    name: 'file_operation',
    label: 'File Create/Delete',
    description: 'Create or delete a file in the vault. Set action to "create" or "delete". Requires user approval.',
    tab: 'file-modifications',
    parameters: [
      { name: 'action', type: '"create" | "delete"', required: true, desc: 'Operation to perform on the file' },
      { name: 'path', type: 'string', required: true, desc: 'File path relative to vault root including extension' },
      { name: 'content', type: 'string', required: false, desc: 'Required for "create". Initial content of the file' },
    ],
  },
  {
    name: 'rename_file',
    label: 'Rename File',
    description: 'Rename or move a file within the vault. Requires user approval.',
    tab: 'file-modifications',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'Current file path relative to vault root' },
      { name: 'new_path', type: 'string', required: true, desc: 'New file path relative to vault root' },
    ],
  },
  // Folder Modifications
  {
    name: 'folder_operation',
    label: 'Folder Create/Delete',
    description: 'Create or delete a folder in the vault. Set action to "create" or "delete". Requires user approval.',
    tab: 'folder-modifications',
    parameters: [
      { name: 'action', type: '"create" | "delete"', required: true, desc: 'Operation to perform on the folder' },
      { name: 'path', type: 'string', required: true, desc: 'Folder path relative to vault root (e.g. "Projects/New Folder")' },
    ],
  },
  {
    name: 'rename_folder',
    label: 'Rename Folder',
    description: 'Rename or move a folder within the vault. All contents are moved. Requires user approval.',
    tab: 'folder-modifications',
    parameters: [
      { name: 'path', type: 'string', required: true, desc: 'Current folder path relative to vault root' },
      { name: 'new_path', type: 'string', required: true, desc: 'New folder path relative to vault root' },
    ],
  },
  // CSS Snippet Actions
  {
    name: 'list_css_snippets',
    label: 'List CSS Snippets',
    description: 'List all CSS snippets available in the vault.',
    tab: 'css-snippets',
    parameters: [],
  },
  {
    name: 'read_css_snippet',
    label: 'Read CSS Snippet',
    description: 'Read the content of a specific CSS snippet.',
    tab: 'css-snippets',
    parameters: [
      { name: 'filename', type: 'string', required: true, desc: 'Filename of the CSS snippet (e.g. "my-theme.css")' },
    ],
  },
  {
    name: 'edit_css_snippet',
    label: 'Edit CSS Snippet',
    description: 'Edit a CSS snippet by making an exact string replacement. Requires user approval and prior reading of the snippet.',
    tab: 'css-snippets',
    parameters: [
      { name: 'filename', type: 'string', required: true, desc: 'Filename of the CSS snippet to edit' },
      { name: 'old_string', type: 'string', required: true, desc: 'Exact text to find and replace' },
      { name: 'new_string', type: 'string', required: true, desc: 'Replacement text' },
    ],
  },
  {
    name: 'css_snippet_operation',
    label: 'CSS Snippet Create/Delete',
    description: 'Create or delete a CSS snippet. Set action to "create" or "delete". Requires user approval.',
    tab: 'css-snippets',
    parameters: [
      { name: 'action', type: '"create" | "delete"', required: true, desc: 'Operation to perform on the snippet' },
      { name: 'filename', type: 'string', required: true, desc: 'Filename ending with .css (e.g. "my-theme.css")' },
      { name: 'content', type: 'string', required: false, desc: 'Required for "create". CSS content for the snippet' },
    ],
  },
]

const TOOL_TABS = [
  { id: 'searching', label: 'Searching' },
  { id: 'file-modifications', label: 'File Modifications' },
  { id: 'folder-modifications', label: 'Folder Modifications' },
  { id: 'css-snippets', label: 'CSS Snippet Actions' },
] as const

type ToolTabId = (typeof TOOL_TABS)[number]['id']

export function ToolsSection() {
  const plugin = usePlugin()
  const { settings, setSettings } = useSettings()
  const [toolsTokenEstimate, setToolsTokenEstimate] = useState<number | null>(null)
  const [activeToolTab, setActiveToolTab] = useState<ToolTabId>('searching')

  const enabledTools = settings.enabledTools || []

  const tabTools = useMemo(
    () => builtinTools.filter((t) => t.tab === activeToolTab),
    [activeToolTab],
  )

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
    void computeToolsTokens()
    return () => { cancelled = true }
  }, [plugin, enabledTools])

  const validToolNames = useMemo(() => new Set(builtinTools.map((t) => t.name)), [])

  useEffect(() => {
    const filtered = enabledTools.filter((n) => validToolNames.has(n))
    if (filtered.length !== enabledTools.length) {
      void setSettings({ ...settings, enabledTools: filtered })
    }
  }, [])

  const handleToolToggle = (toolName: string, enabled: boolean) => {
    let newEnabledTools = enabled
      ? [...enabledTools, toolName]
      : enabledTools.filter((n) => n !== toolName)
    newEnabledTools = newEnabledTools.filter((n) => validToolNames.has(n))
    void setSettings({
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
          onChange={(value) => {
            const parsedValue = parseInt(value)
            if (isNaN(parsedValue) || parsedValue < 1) return
            void setSettings({
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

      <div className="za-tools-tab-bar">
        {TOOL_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`za-tools-tab ${activeToolTab === tab.id ? 'za-tools-tab--active' : ''}`}
            onClick={() => setActiveToolTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="za-tools-grid">
        {tabTools.map((tool) => {
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
              {tool.parameters.length > 0 && (
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
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
