import { App } from 'obsidian'

import { BaseJsonManager } from '../base'

import { ChatConversation, ChatConversationMetadata } from './types'

export class ChatManager extends BaseJsonManager {
  private getChatHistories: () => ChatConversation[]
  private saveChatHistories: (histories: ChatConversation[]) => Promise<void>

  constructor(
    app: App,
    dataAccess: {
      getChatHistories: () => ChatConversation[]
      saveChatHistories: (histories: ChatConversation[]) => Promise<void>
    },
  ) {
    super(app)
    this.getChatHistories = dataAccess.getChatHistories
    this.saveChatHistories = dataAccess.saveChatHistories
  }

  async createChat(data: {
    id: string
    title: string
    messages: unknown[]
  }): Promise<ChatConversation> {
    const conversation: ChatConversation = {
      id: data.id,
      title: data.title,
      messages: data.messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const histories = this.getChatHistories()
    const existingIndex = histories.findIndex((c) => c.id === data.id)
    if (existingIndex !== -1) {
      histories[existingIndex] = conversation
    } else {
      histories.push(conversation)
    }
    histories.sort((a, b) => b.updatedAt - a.updatedAt)
    await this.saveChatHistories(histories)
    return conversation
  }

  async findById(id: string): Promise<ChatConversation | null> {
    const histories = this.getChatHistories()
    return histories.find((c) => c.id === id) ?? null
  }

  async updateChat(
    id: string,
    data: Partial<{
      title: string
      messages: unknown[]
    }>,
  ): Promise<void> {
    const histories = this.getChatHistories()
    const index = histories.findIndex((c) => c.id === id)
    if (index === -1) throw new Error(`Chat ${id} not found`)
    histories[index] = {
      ...histories[index],
      ...data,
      updatedAt: Date.now(),
    }
    histories.sort((a, b) => b.updatedAt - a.updatedAt)
    await this.saveChatHistories(histories)
  }

  async deleteChat(id: string): Promise<void> {
    const histories = this.getChatHistories()
    const updated = histories.filter((c) => c.id !== id)
    await this.saveChatHistories(updated)
  }

  async listChats(): Promise<ChatConversationMetadata[]> {
    const histories = this.getChatHistories()
    return histories.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  }
}
