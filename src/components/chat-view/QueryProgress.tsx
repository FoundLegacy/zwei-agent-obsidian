import DotLoader from '../common/DotLoader'

export type QueryProgressState =
  | {
      type: 'reading-mentionables'
    }
  | {
      type: 'idle'
    }

export type IndexProgress = {
  completedChunks: number
  totalChunks: number
  totalFiles: number
  waitingForRateLimit?: boolean
}

export default function QueryProgress({
  state,
}: {
  state: QueryProgressState
}) {
  switch (state.type) {
    case 'idle':
      return null
    case 'reading-mentionables':
      return (
        <div className="za-query-progress">
          <p>
            Reading mentioned files
            <DotLoader />
          </p>
        </div>
      )
  }
}
