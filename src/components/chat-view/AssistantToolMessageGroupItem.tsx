import {
  AssistantToolMessageGroup,
  ChatMessage,
  ChatToolMessage,
} from '../../types/chat'

import AssistantMessageAnnotations from './AssistantMessageAnnotations'
import AssistantMessageContent from './AssistantMessageContent'
import AssistantMessageReasoning from './AssistantMessageReasoning'
import AssistantToolMessageGroupActions from './AssistantToolMessageGroupActions'
import ToolMessage from './ToolMessage'
import { ToolManager } from '../../core/tools/toolManager'

export type AssistantToolMessageGroupItemProps = {
  messages: AssistantToolMessageGroup
  contextMessages: ChatMessage[]
  conversationId: string
  onToolMessageUpdate: (message: ChatToolMessage) => void
  toolManager: ToolManager
}

export default function AssistantToolMessageGroupItem({
  messages,
  contextMessages,
  onToolMessageUpdate,
  toolManager,
}: AssistantToolMessageGroupItemProps) {
  return (
    <div className="za-assistant-tool-message-group">
      {messages.map((message) =>
        message.role === 'assistant' ? (
          message.reasoning || message.annotations || message.content ? (
            <div key={message.id} className="za-chat-messages-assistant">
              {message.reasoning && (
                <AssistantMessageReasoning reasoning={message.reasoning} />
              )}
              {message.annotations && (
                <AssistantMessageAnnotations
                  annotations={message.annotations}
                />
              )}
              <AssistantMessageContent
                content={message.content}
              />
            </div>
          ) : null
        ) : (
          <div key={message.id}>
            <ToolMessage
              message={message}
              toolManager={toolManager}
              onMessageUpdate={onToolMessageUpdate}
            />
          </div>
        ),
      )}
      {messages.length > 0 && (
        <AssistantToolMessageGroupActions messages={messages} />
      )}
    </div>
  )
}
