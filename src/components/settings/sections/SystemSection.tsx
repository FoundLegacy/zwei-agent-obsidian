import { useEffect, useMemo, useState } from 'react'
import { TFile, TFolder } from 'obsidian'

import { useSettings } from '../../../contexts/settings-context'
import { usePlugin } from '../../../contexts/plugin-context'
import { tokenCount } from '../../../utils/llm/token'
import { readTFileContent } from '../../../utils/obsidian'
import { ObsidianSetting } from '../../common/ObsidianSetting'
import { ObsidianToggle } from '../../common/ObsidianToggle'
import { ObsidianFileSelector } from '../../common/ObsidianFileSelector'

const DEFAULT_FILE_EXTENSIONS = new Set(['md', 'canvas', 'base'])

export function SystemSection() {
  const { settings, setSettings } = useSettings()
  const plugin = usePlugin()

  const [vaultTokenEstimate, setVaultTokenEstimate] = useState<number | null>(null)
  const [systemPromptTokenEstimate, setSystemPromptTokenEstimate] = useState<number | null>(null)

  const vaultStructureFolders: string[] = settings.chatOptions?.vaultStructureFolders ?? []
  const includeAllFileTypes: boolean = settings.chatOptions?.includeAllVaultFileTypes ?? false
  const includeVaultRootFiles: boolean = settings.chatOptions?.includeVaultRootFiles ?? true

  const relevantExtensions = useMemo(() => {
    if (includeAllFileTypes) return null
    return DEFAULT_FILE_EXTENSIONS
  }, [includeAllFileTypes])

  useEffect(() => {
    let cancelled = false
    async function computeVaultTokens() {
      const rootFolder = plugin.app.vault.getRoot()
      const paths: string[] = []
      if (vaultStructureFolders.length === 0) {
        collectFilePaths(rootFolder, '', paths, relevantExtensions)
      } else {
        if (includeVaultRootFiles) {
          collectRootFiles(rootFolder, paths, relevantExtensions)
        }
        for (const folderPath of vaultStructureFolders) {
          const folder = plugin.app.vault.getAbstractFileByPath(folderPath)
          if (folder instanceof TFolder) {
            collectFilePaths(folder, folderPath, paths, relevantExtensions)
          }
        }
      }
      const vaultTree = paths.join('\n')
      const tokens = await tokenCount(vaultTree)
      if (!cancelled) setVaultTokenEstimate(tokens)
    }
    computeVaultTokens()
    return () => { cancelled = true }
  }, [plugin, vaultStructureFolders, relevantExtensions, includeVaultRootFiles])

  useEffect(() => {
    let cancelled = false
    async function computeSystemPromptTokens() {
      if (!settings.systemPromptFilePath) {
        setSystemPromptTokenEstimate(null)
        return
      }
      const file = plugin.app.vault.getFileByPath(settings.systemPromptFilePath)
      if (!file) {
        setSystemPromptTokenEstimate(null)
        return
      }
      try {
        const content = await readTFileContent(file, plugin.app.vault)
        if (!cancelled) {
          setSystemPromptTokenEstimate(await tokenCount(content))
        }
      } catch {
        if (!cancelled) setSystemPromptTokenEstimate(null)
      }
    }
    computeSystemPromptTokens()
    return () => { cancelled = true }
  }, [plugin, settings.systemPromptFilePath])

  const allFolders = useMemo(() => getAllFolders(plugin.app.vault.getRoot(), ''), [plugin])

  const descendantPaths = useMemo(() => {
    const set = new Set<string>()
    for (const fp of vaultStructureFolders) {
      allFolders.forEach((f) => {
        if (f.startsWith(fp + '/')) set.add(f)
      })
    }
    return set
  }, [vaultStructureFolders, allFolders])

  const visibleUnselectedFolders = useMemo(() =>
    allFolders.filter((f) =>
      !vaultStructureFolders.includes(f) && !descendantPaths.has(f)
    ),
    [allFolders, vaultStructureFolders, descendantPaths])

  const handleFolderToggle = async (folder: string, checked: boolean) => {
    const current = vaultStructureFolders

    let next: string[]
    if (checked) {
      next = current.filter((f) => !f.startsWith(folder + '/') && !folder.startsWith(f + '/'))
      next.push(folder)
    } else {
      next = current.filter((f) => f !== folder)
    }

    await setSettings({
      ...settings,
      chatOptions: {
        ...settings.chatOptions,
        vaultStructureFolders: next,
        maxAutoIterations: settings.chatOptions.maxAutoIterations,
      },
    })
  }

  return (
    <div className="za-settings-section">
      <div className="za-settings-header">System Configuration</div>

      <div className="za-settings-sub-header">System Prompt</div>

      <ObsidianSetting
        name="Enable system prompt"
        desc="When enabled, the content of the selected markdown file will be used as the system prompt for every chat. The file is read fresh at the start of each chat session."
      >
        <ObsidianToggle
          value={settings.systemPromptEnabled}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              systemPromptEnabled: value,
            })
          }}
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="System prompt file"
        desc="Select a markdown file from your vault whose content will be used as the system prompt."
      />

      <ObsidianFileSelector
        app={plugin.app}
        value={settings.systemPromptFilePath}
        placeholder="Search for a markdown file..."
        onChange={async (value: string) => {
          await setSettings({
            ...settings,
            systemPromptFilePath: value,
          })
        }}
      />

      {systemPromptTokenEstimate !== null && (
        <div className="za-token-info-box">
          <div className="za-token-info-box-icon">S</div>
          <div className="za-token-info-box-content">
            <div className="za-token-info-box-label">System Prompt Tokens</div>
            <div className="za-token-info-box-value">
              ~{systemPromptTokenEstimate.toLocaleString()} tokens
            </div>
          </div>
        </div>
      )}

      <div className="za-settings-sub-header">Context</div>

      <ObsidianSetting
        name="Include current file"
        desc="Automatically include the content of your current file in chats."
      >
        <ObsidianToggle
          value={settings.chatOptions.includeCurrentFileContent}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              chatOptions: {
                ...settings.chatOptions,
                includeCurrentFileContent: value,
                vaultStructureFolders: settings.chatOptions.vaultStructureFolders ?? [],
              },
            })
          }}
        />
      </ObsidianSetting>

      <div className="za-settings-separator" />
      <div className="za-settings-sub-header">Vault Structure</div>

      <ObsidianSetting
        name="Include vault structure"
        desc={`Send your vault structure to the AI so it understands your vault's organization, this improves the agents context awareness and improves tool calling efficiency.${vaultStructureFolders.length === 0 ? ' Warning: The entire vault will be sent. This may use many tokens in large vaults.' : ''}`}
      >
        <ObsidianToggle
          value={settings.chatOptions.includeVaultStructure}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              chatOptions: {
                ...settings.chatOptions,
                includeVaultStructure: value,
                vaultStructureFolders: settings.chatOptions.vaultStructureFolders ?? [],
              },
            })
          }}
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="Include root files"
        desc="Include files at the vault root level (not inside any folder) in vault structure. Enabled by default — root files would otherwise be excluded when folders are selected."
      >
        <ObsidianToggle
          value={includeVaultRootFiles}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              chatOptions: {
                ...settings.chatOptions,
                includeVaultRootFiles: value,
                vaultStructureFolders: settings.chatOptions.vaultStructureFolders ?? [],
              },
            })
          }}
        />
      </ObsidianSetting>

      {vaultTokenEstimate !== null && (
        <div className="za-token-info-box">
          <div className="za-token-info-box-icon">V</div>
          <div className="za-token-info-box-content">
            <div className="za-token-info-box-label">Vault Structure Tokens</div>
            <div className="za-token-info-box-value">
              ~{vaultTokenEstimate.toLocaleString()} tokens
            </div>
          </div>
        </div>
      )}

      <ObsidianSetting
        name="Include all file types"
        desc="When enabled, all file types (PDFs, images, etc.) are listed in the vault structure. By default only .md, .canvas and .base files are included."
      >
        <ObsidianToggle
          value={includeAllFileTypes}
          onChange={async (value) => {
            await setSettings({
              ...settings,
              chatOptions: {
                ...settings.chatOptions,
                includeAllVaultFileTypes: value,
                vaultStructureFolders: settings.chatOptions.vaultStructureFolders ?? [],
              },
            })
          }}
        />
      </ObsidianSetting>

      <ObsidianSetting
        name="Vault structure folders"
        desc="Select folders to include in the vault structure context. Selected folders appear at the top. When a folder is selected, everything beneath it is also selected and hidden from the list. Leave empty to send the entire vault."
      />

      <div className="za-folder-selector">
        {vaultStructureFolders.map((folder) => (
          <label key={folder} className="za-folder-selector-item za-folder-selector-item--selected">
            <input
              type="checkbox"
              checked={true}
              onChange={() => handleFolderToggle(folder, false)}
            />
            <span>{folder}</span>
          </label>
        ))}
        {vaultStructureFolders.length > 0 && visibleUnselectedFolders.length > 0 && (
          <div className="za-folder-selector-divider" />
        )}
        {visibleUnselectedFolders.length === 0 && vaultStructureFolders.length === 0 && (
          <div className="za-folder-selector-empty">Select folders above to narrow the vault structure, or leave empty for the entire vault.</div>
        )}
        {visibleUnselectedFolders.map((folder) => (
          <label key={folder} className="za-folder-selector-item">
            <input
              type="checkbox"
              checked={false}
              onChange={(e) => handleFolderToggle(folder, e.target.checked)}
            />
            <span>{folder}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function getAllFolders(folder: TFolder, parentPath: string): string[] {
  const results: string[] = []
  const children = folder.children
    .filter((child): child is TFolder => child instanceof TFolder)
    .sort((a, b) => a.name.localeCompare(b.name))
  for (const child of children) {
    const fullPath = parentPath ? `${parentPath}/${child.name}` : child.name
    results.push(fullPath)
    results.push(...getAllFolders(child, fullPath))
  }
  return results
}

function collectFilePaths(
  folder: TFolder,
  parentPath: string,
  paths: string[],
  allowedExtensions: Set<string> | null = null,
): void {
  const children = folder.children
    .filter(
      (child): child is TFolder | TFile =>
        child instanceof TFolder || child instanceof TFile,
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  for (const child of children) {
    const fullPath = parentPath ? `${parentPath}/${child.name}` : child.name
    if (child instanceof TFolder) {
      collectFilePaths(child, fullPath, paths, allowedExtensions)
    } else if (child instanceof TFile) {
      if (allowedExtensions === null || allowedExtensions.has(child.extension)) {
        paths.push(fullPath)
      }
    }
  }
}

function collectRootFiles(
  root: TFolder,
  paths: string[],
  allowedExtensions: Set<string> | null = null,
): void {
  const children = root.children.sort((a, b) => a.name.localeCompare(b.name))
  for (const child of children) {
    if (child instanceof TFile) {
      if (allowedExtensions === null || allowedExtensions.has(child.extension)) {
        paths.push(child.name)
      }
    }
  }
}
