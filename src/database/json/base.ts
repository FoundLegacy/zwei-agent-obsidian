import { App, normalizePath } from 'obsidian'

export abstract class BaseJsonManager {
  protected app: App

  constructor(app: App) {
    this.app = app
  }

  protected async ensureDir(dir: string): Promise<void> {
    const dirPath = normalizePath(dir)
    if (!(await this.app.vault.adapter.exists(dirPath))) {
      await this.app.vault.createFolder(dirPath)
    }
  }

  protected async readJson<T>(path: string): Promise<T> {
    const content = await this.app.vault.adapter.read(normalizePath(path))
    return JSON.parse(content) as T
  }

  protected async writeJson(path: string, data: unknown): Promise<void> {
    await this.app.vault.adapter.write(
      normalizePath(path),
      JSON.stringify(data, null, 2),
    )
  }

  protected async exists(path: string): Promise<boolean> {
    return this.app.vault.adapter.exists(normalizePath(path))
  }

  protected async remove(path: string): Promise<void> {
    await this.app.vault.adapter.remove(normalizePath(path))
  }
}
