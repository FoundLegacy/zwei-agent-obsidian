import { BaseSerializedNode } from '@lexical/clipboard/clipboard'

export type TemplateContent = {
  nodes: BaseSerializedNode[]
}

export type Template = {
  id: string
  name: string
  content: TemplateContent
  createdAt: number
  updatedAt: number
}

export type TemplateMetadata = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}
