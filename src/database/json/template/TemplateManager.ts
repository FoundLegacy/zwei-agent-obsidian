import { App } from 'obsidian'
import { v4 as uuidv4 } from 'uuid'

import { BaseJsonManager } from '../base'

import { Template, TemplateContent, TemplateMetadata } from './types'

export class TemplateManager extends BaseJsonManager {
  private getTemplates: () => Template[]
  private saveTemplates: (templates: Template[]) => Promise<void>

  constructor(
    app: App,
    dataAccess: {
      getTemplates: () => Template[]
      saveTemplates: (templates: Template[]) => Promise<void>
    },
  ) {
    super(app)
    this.getTemplates = dataAccess.getTemplates
    this.saveTemplates = dataAccess.saveTemplates
  }

  async createTemplate(data: {
    name: string
    content: { nodes: unknown[] }
  }): Promise<Template> {
    const templates = this.getTemplates()
    const existing = templates.find((t) => t.name === data.name)
    if (existing) {
      throw new Error('A template with this name already exists')
    }
    const template: Template = {
      id: uuidv4(),
      name: data.name,
      content: data.content as TemplateContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    templates.push(template)
    await this.saveTemplates(templates)
    return template
  }

  async findById(id: string): Promise<Template | null> {
    const templates = this.getTemplates()
    return templates.find((t) => t.id === id) ?? null
  }

  async findByName(name: string): Promise<Template | null> {
    const templates = this.getTemplates()
    return templates.find((t) => t.name === name) ?? null
  }

  async updateTemplate(
    id: string,
    data: {
      name: string
      content: { nodes: unknown[] }
    },
  ): Promise<void> {
    const templates = this.getTemplates()
    const index = templates.findIndex((t) => t.id === id)
    if (index === -1) throw new Error(`Template ${id} not found`)
    templates[index] = {
      ...templates[index],
      name: data.name,
      content: data.content as TemplateContent,
      updatedAt: Date.now(),
    }
    await this.saveTemplates(templates)
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = this.getTemplates()
    const updated = templates.filter((t) => t.id !== id)
    await this.saveTemplates(updated)
  }

  async searchTemplates(query: string): Promise<Template[]> {
    const templates = this.getTemplates()
    const lowerQuery = query.toLowerCase()
    return templates.filter((t) =>
      t.name.toLowerCase().includes(lowerQuery),
    )
  }

  async listMetadata(): Promise<TemplateMetadata[]> {
    const templates = this.getTemplates()
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))
  }
}
