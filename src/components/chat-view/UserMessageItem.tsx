import { SerializedEditorState } from 'lexical'

import { ChatUserMessage } from '../../types/chat'
import { Mentionable } from '../../types/mentionable'

import ChatUserInput, { ChatUserInputRef } from './chat-input/ChatUserInput'

export type UserMessageItemProps = {
  message: ChatUserMessage
  chatUserInputRef: (ref: ChatUserInputRef | null) => void
  onInputChange: (content: SerializedEditorState) => void
  onSubmit: (content: SerializedEditorState) => void
  onFocus: () => void
  onMentionablesChange: (mentionables: Mentionable[]) => void
}

export default function UserMessageItem({
  message,
  chatUserInputRef,
  onInputChange,
  onSubmit,
  onFocus,
  onMentionablesChange,
}: UserMessageItemProps) {
  return (
    <div className="za-chat-messages-user">
      <ChatUserInput
        ref={chatUserInputRef}
        initialSerializedEditorState={message.content}
        onChange={onInputChange}
        onSubmit={onSubmit}
        onFocus={onFocus}
        mentionables={message.mentionables}
        setMentionables={onMentionablesChange}
      />
    </div>
  )
}
