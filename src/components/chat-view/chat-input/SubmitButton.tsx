import { ArrowUp } from 'lucide-react'

export function SubmitButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="za-chat-user-input-submit-button" onClick={onClick}>
      <div className="za-chat-user-input-submit-button-icons">
        <ArrowUp size={12} />
      </div>
      <div>Send</div>
    </div>
  )
}
