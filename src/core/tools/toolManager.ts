import { App, TFile, TFolder, normalizePath } from 'obsidian'

import {
  ToolCallResponse,
  ToolCallResponseStatus,
} from '../../types/tool-call.types'

type Tool = {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<
      string,
      {
        type: string
        description: string
        items?: { type: string }
      }
    >
    required?: string[]
  }
}

const BUILTIN_TOOLS: Tool[] = [
  {
    name: 'read_vault_file',
    description:
      "Read the full content of a file from the user's Obsidian vault. Use this to look up the content of any file you need to reference or understand when helping the user. Use only when necessary — reading large files may incur high token costs. The path should be relative to the vault root (e.g., \"folder/note.md\").",
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'The file path relative to the vault root (e.g., "Projects/My Note.md")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'edit_vault_file',
    description:
      "Make an exact string replacement in a vault file. Requires user approval before execution. You must have read the file content first (via read_vault_file, the user's @ mention, or current file context). Provide the exact text to replace (old_string) and the new text (new_string). If old_string is not unique in the file, the replacement will fail — provide more surrounding context to make it unique.",
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'The file path relative to the vault root (e.g., "Projects/My Note.md")',
        },
        old_string: {
          type: 'string',
          description:
            'The exact text to find and replace. Must match exactly including whitespace and indentation. If not unique, provide more surrounding context.',
        },
        new_string: {
          type: 'string',
          description:
            'The replacement text. Use an empty string to delete the matched text.',
        },
      },
      required: ['path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'search_vault',
    description:
      'Search all files in the vault for a specific word or phrase. Use this when you need to find which files mention something across the entire vault. Returns matching files with line numbers. For searching within specific known files, use search_files instead.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The word or phrase to search for across all files in the vault.',
        },
        caseSensitive: {
          type: 'boolean',
          description:
            'Whether to perform a case-sensitive search. Defaults to false (case-insensitive).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_files',
    description:
      'Search for a word or phrase within one or more specific files. Use this when you already know which files to look in or when you only want to search a subset of files. For broad vault-wide searches, use search_vault instead.',
    inputSchema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description:
            'List of file paths relative to the vault root to search within.',
        },
        query: {
          type: 'string',
          description:
            'The word or phrase to search for within the specified files.',
        },
        caseSensitive: {
          type: 'boolean',
          description:
            'Whether to perform a case-sensitive search. Defaults to false (case-insensitive).',
        },
      },
      required: ['paths', 'query'],
    },
  },
  {
    name: 'create_file',
    description:
      'Create a new file in the vault. Supports .md, .canvas, and .base (Base) files. If you have not received the vault structure and are unsure about the directory layout, place the file at the vault root (just the filename, no directory path). This tool requires user approval before execution.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'File path relative to the vault root including filename and extension (e.g., "Notes/My Note.md" or "canvas/board.canvas"). Use just the filename (no directory) if unsure about directory layout.',
        },
        content: {
          type: 'string',
          description:
            'The initial content of the file. For .canvas files, provide valid JSON canvas data. For .md files, provide markdown content.',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'delete_file',
    description:
      'Delete a file from the vault. This tool requires user approval before execution. Use with caution — deletion is permanent and cannot be undone.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'File path relative to the vault root of the file to delete.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'create_folder',
    description:
      'Create a new folder/directory in the vault. This tool requires user approval before execution. Parent directories will be created as needed.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Folder path relative to the vault root (e.g., "Projects/New Folder" or "Notes/Subfolder").',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'delete_folder',
    description:
      'Delete a folder/directory from the vault. This tool requires user approval before execution. The folder must be empty (no files or subfolders).',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Folder path relative to the vault root of the folder to delete.',
        },
      },
      required: ['path'],
    },
  },
]

export class ToolManager {
  private app: App
  private enabledTools: string[]
  private activeToolCalls: Map<string, AbortController> = new Map()

  constructor(app: App, enabledTools?: string[]) {
    this.app = app
    this.enabledTools = enabledTools ?? BUILTIN_TOOLS.map((t) => t.name)
  }

  getBuiltinTools(): Tool[] {
    return BUILTIN_TOOLS
  }

  async listAvailableTools(): Promise<Tool[]> {
    return BUILTIN_TOOLS.filter((t) => this.enabledTools.includes(t.name))
  }

  isToolExecutionAllowed(toolName: string): boolean {
    if (toolName === 'edit_vault_file') return false
    if (toolName === 'create_file') return false
    if (toolName === 'delete_file') return false
    if (toolName === 'create_folder') return false
    if (toolName === 'delete_folder') return false
    return true
  }

  async callTool({
    name,
    args,
    id,
    signal,
  }: {
    name: string
    args?: Record<string, unknown> | string | undefined
    id?: string
    signal?: AbortSignal
  }): Promise<
    Extract<
      ToolCallResponse,
      {
        status:
          | ToolCallResponseStatus.Success
          | ToolCallResponseStatus.Error
          | ToolCallResponseStatus.Aborted
      }
    >
  > {
    if (!this.isBuiltinTool(name)) {
      return {
        status: ToolCallResponseStatus.Error,
        error: `Unknown tool: ${name}`,
      }
    }

    return this.executeBuiltinTool({ name, args, id, signal })
  }

  abortToolCall(id: string): boolean {
    const toolAbortController = this.activeToolCalls.get(id)
    if (toolAbortController) {
      toolAbortController.abort()
      this.activeToolCalls.delete(id)
      return true
    }
    return false
  }

  private isBuiltinTool(name: string): boolean {
    return BUILTIN_TOOLS.some((t) => t.name === name)
  }

  private async executeBuiltinTool({
    name,
    args,
    id,
    signal,
  }: {
    name: string
    args?: Record<string, unknown> | string | undefined
    id?: string
    signal?: AbortSignal
  }): Promise<
    Extract<
      ToolCallResponse,
      {
        status:
          | ToolCallResponseStatus.Success
          | ToolCallResponseStatus.Error
          | ToolCallResponseStatus.Aborted
      }
    >
  > {
    const toolAbortController = new AbortController()
    if (id !== undefined) {
      const existing = this.activeToolCalls.get(id)
      if (existing) existing.abort()
      this.activeToolCalls.set(id, toolAbortController)
    }
    const compositeSignal = toolAbortController.signal
    if (signal) {
      signal.addEventListener('abort', () => toolAbortController.abort())
    }

    try {
      if (compositeSignal.aborted) {
        return { status: ToolCallResponseStatus.Aborted }
      }

      const parsedArgs: Record<string, unknown> =
        typeof args === 'string'
          ? args === ''
            ? {}
            : JSON.parse(args)
          : (args ?? {})

      if (name === 'read_vault_file') {
        const path = parsedArgs['path']
        if (typeof path !== 'string' || !path) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "path" parameter. Provide the file path relative to the vault root.',
          }
        }

        const normalizedPath = normalizePath(path)
        const file = this.app.vault.getAbstractFileByPath(normalizedPath)

        if (!file) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `File not found at path: ${path}`,
          }
        }

        if (!(file instanceof TFile)) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `Path "${path}" is not a file.`,
          }
        }

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        const content = await this.app.vault.cachedRead(file)

        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: `## ${path}\n\n\`\`\`\n${content}\n\`\`\``,
          },
        }
      }

      if (name === 'edit_vault_file') {
        const path = parsedArgs['path']
        const oldString = parsedArgs['old_string']
        const newString = parsedArgs['new_string']

        if (typeof path !== 'string' || !path) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "path" parameter.',
          }
        }
        if (typeof oldString !== 'string') {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "old_string" parameter.',
          }
        }
        if (typeof newString !== 'string') {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "new_string" parameter.',
          }
        }

        const normalizedPath = normalizePath(path)
        const file = this.app.vault.getAbstractFileByPath(normalizedPath)

        if (!file) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `File not found at path: ${path}`,
          }
        }

        if (!(file instanceof TFile)) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `Path "${path}" is not a file.`,
          }
        }

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        const content = await this.app.vault.read(file)

        const occurrences = countOccurrences(content, oldString)
        if (occurrences === 0) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              `The text to replace was not found in the file. The file content is:\n\n\`\`\`\n${content}\n\`\`\``,
          }
        }
        if (occurrences > 1) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              `The text to replace appears ${occurrences} times in the file. Provide more surrounding context to make it unique.`,
          }
        }

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        const newContent = content.replace(oldString, newString)
        await this.app.vault.modify(file, newContent)

        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: `File edited successfully: ${path}`,
          },
        }
      }

      if (name === 'search_vault') {
        const query = parsedArgs['query']
        if (typeof query !== 'string' || !query) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "query" parameter. Provide the word or phrase to search for.',
          }
        }

        const caseSensitive = parsedArgs['caseSensitive'] === true
        const searchQuery = caseSensitive ? query : query.toLowerCase()

        const files = this.app.vault.getFiles()

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        const results = await Promise.all(
          files.map(async (file) => {
            if (compositeSignal.aborted) return null
            try {
              const content = await this.app.vault.cachedRead(file)
              const contentForSearch = caseSensitive
                ? content
                : content.toLowerCase()
              if (!contentForSearch.includes(searchQuery)) return null

              const lines = content.split('\n')
              const matchingLines: string[] = []
              for (let i = 0; i < lines.length; i++) {
                const line = caseSensitive
                  ? lines[i]
                  : lines[i].toLowerCase()
                if (line.includes(searchQuery)) {
                  matchingLines.push(`${i + 1}: ${lines[i].trim()}`)
                }
              }
              return { path: file.path, matches: matchingLines }
            } catch {
              return null
            }
          }),
        )

        const matchedFiles = results.filter(
          (r): r is { path: string; matches: string[] } => r !== null,
        )

        if (matchedFiles.length === 0) {
          return {
            status: ToolCallResponseStatus.Success,
            data: {
              type: 'text',
              text: `No files found matching "${query}".`,
            },
          }
        }

        const output = matchedFiles
          .map(
            ({ path, matches }) =>
              `## ${path}\n${matches.map((m) => `  ${m}`).join('\n')}`,
          )
          .join('\n\n')

        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: `Found ${matchedFiles.length} file(s) matching "${query}":\n\n${output}`,
          },
        }
      }

      if (name === 'search_files') {
        const paths = parsedArgs['paths']
        const query = parsedArgs['query']

        if (!Array.isArray(paths) || paths.length === 0) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "paths" parameter. Provide an array of file paths to search.',
          }
        }
        if (typeof query !== 'string' || !query) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "query" parameter. Provide the word or phrase to search for.',
          }
        }

        const caseSensitive = parsedArgs['caseSensitive'] === true
        const searchQuery = caseSensitive ? query : query.toLowerCase()

        const resolvedFiles: { file: TFile; path: string }[] = []
        for (const p of paths) {
          if (typeof p !== 'string' || !p) continue
          const normalizedPath = normalizePath(p)
          const abstractFile =
            this.app.vault.getAbstractFileByPath(normalizedPath)
          if (abstractFile && abstractFile instanceof TFile) {
            resolvedFiles.push({ file: abstractFile, path: p })
          }
        }

        if (resolvedFiles.length === 0) {
          return {
            status: ToolCallResponseStatus.Error,
            error: 'None of the specified paths were found in the vault.',
          }
        }

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        const results = await Promise.all(
          resolvedFiles.map(async ({ file, path }) => {
            if (compositeSignal.aborted) return null
            try {
              const content = await this.app.vault.cachedRead(file)
              const contentForSearch = caseSensitive
                ? content
                : content.toLowerCase()
              if (!contentForSearch.includes(searchQuery)) return null

              const lines = content.split('\n')
              const matchingLines: string[] = []
              for (let i = 0; i < lines.length; i++) {
                const line = caseSensitive
                  ? lines[i]
                  : lines[i].toLowerCase()
                if (line.includes(searchQuery)) {
                  matchingLines.push(`${i + 1}: ${lines[i].trim()}`)
                }
              }
              return { path, matches: matchingLines }
            } catch {
              return null
            }
          }),
        )

        const matchedFiles = results.filter(
          (r): r is { path: string; matches: string[] } => r !== null,
        )

        if (matchedFiles.length === 0) {
          return {
            status: ToolCallResponseStatus.Success,
            data: {
              type: 'text',
              text: `No matches found for "${query}" in the specified files.`,
            },
          }
        }

        const output = matchedFiles
          .map(
            ({ path, matches }) =>
              `## ${path}\n${matches.map((m) => `  ${m}`).join('\n')}`,
          )
          .join('\n\n')

        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: `Found matches for "${query}" in ${matchedFiles.length} file(s):\n\n${output}`,
          },
        }
      }

      if (name === 'create_file') {
        const path = parsedArgs['path']
        const content = parsedArgs['content']

        if (typeof path !== 'string' || !path) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "path" parameter. Provide the file path relative to the vault root.',
          }
        }
        if (typeof content !== 'string') {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "content" parameter. Provide the file content.',
          }
        }

        const normalizedPath = normalizePath(path)
        const existing = this.app.vault.getAbstractFileByPath(normalizedPath)
        if (existing) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `A file or folder already exists at path: ${path}`,
          }
        }

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        // Ensure parent directories exist
        const parentPath = normalizedPath.split('/').slice(0, -1).join('/')
        if (parentPath) {
          const parentFolder = this.app.vault.getAbstractFileByPath(parentPath)
          if (!parentFolder) {
            await this.app.vault.createFolder(parentPath)
          }
        }

        await this.app.vault.create(normalizedPath, content)

        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: `File created successfully: ${path}`,
          },
        }
      }

      if (name === 'delete_file') {
        const path = parsedArgs['path']

        if (typeof path !== 'string' || !path) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "path" parameter. Provide the file path relative to the vault root.',
          }
        }

        const normalizedPath = normalizePath(path)
        const file = this.app.vault.getAbstractFileByPath(normalizedPath)

        if (!file) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `File not found at path: ${path}`,
          }
        }

        if (!(file instanceof TFile)) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `Path "${path}" is not a file. Cannot delete folders through this tool.`,
          }
        }

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        await this.app.vault.trash(file, false)

        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: `File deleted: ${path}`,
          },
        }
      }

      if (name === 'create_folder') {
        const path = parsedArgs['path']

        if (typeof path !== 'string' || !path) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "path" parameter. Provide the folder path relative to the vault root.',
          }
        }

        const normalizedPath = normalizePath(path)
        const existing = this.app.vault.getAbstractFileByPath(normalizedPath)
        if (existing) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `A file or folder already exists at path: ${path}`,
          }
        }

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        await this.app.vault.createFolder(normalizedPath)

        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: `Folder created successfully: ${path}`,
          },
        }
      }

      if (name === 'delete_folder') {
        const path = parsedArgs['path']

        if (typeof path !== 'string' || !path) {
          return {
            status: ToolCallResponseStatus.Error,
            error:
              'Missing or invalid "path" parameter. Provide the folder path relative to the vault root.',
          }
        }

        const normalizedPath = normalizePath(path)
        const folder = this.app.vault.getAbstractFileByPath(normalizedPath)

        if (!folder) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `Folder not found at path: ${path}`,
          }
        }

        if (!(folder instanceof TFolder)) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `Path "${path}" is not a folder.`,
          }
        }

        if (folder.children.length > 0) {
          return {
            status: ToolCallResponseStatus.Error,
            error: `Folder "${path}" is not empty. It contains ${folder.children.length} item(s). Only empty folders can be deleted.`,
          }
        }

        if (compositeSignal.aborted) {
          return { status: ToolCallResponseStatus.Aborted }
        }

        await this.app.vault.trash(folder, false)

        return {
          status: ToolCallResponseStatus.Success,
          data: {
            type: 'text',
            text: `Folder deleted: ${path}`,
          },
        }
      }

      return {
        status: ToolCallResponseStatus.Error,
        error: `Unknown built-in tool: ${name}`,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { status: ToolCallResponseStatus.Aborted }
      }
      return {
        status: ToolCallResponseStatus.Error,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    } finally {
      if (id !== undefined) {
        this.activeToolCalls.delete(id)
      }
    }
  }
}

function countOccurrences(str: string, search: string): number {
  if (!search) return 0
  let count = 0
  let pos = 0
  while ((pos = str.indexOf(search, pos)) !== -1) {
    count++
    pos += search.length
  }
  return count
}
