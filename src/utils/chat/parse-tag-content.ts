import { parseFragment } from 'parse5'

export type ParsedTagContent =
  | { type: 'string'; content: string }
  | {
      type: 'oa_block'
      content: string
      language?: string
      filename?: string
      startLine?: number
      endLine?: number
    }
  | {
      type: 'think'
      content: string
    }

const THINK_PLACEHOLDER = '\u0000THINK\u0000'

/**
 * Parses text containing <oa_block> and <think> tags into structured content.
 *
 * <think> blocks are extracted first using regex (streaming-safe — partial
 * tags are left in the string content and only complete <think>...</think>
 * pairs are extracted). <oa_block> tags are parsed using parse5 from the
 * remaining text after think extraction.
 */
export function parseTagContents(input: string): ParsedTagContent[] {
  // Step 1: Extract complete <think>...</think> blocks using regex.
  // During streaming, incomplete tags (e.g. "<think" without closing)
  // stay in the string content without causing parse failures.
  const thinkBlocks: string[] = []
  const cleanedInput = input.replace(
    /<think>([\s\S]*?)<\/think>/g,
    (_match, content) => {
      thinkBlocks.push(content.replace(/^\n|\n$/g, ''))
      return THINK_PLACEHOLDER
    },
  )

  // Step 2: Parse oa_block tags with parse5 on the cleaned input
  try {
    return interleaveThinkBlocks(
      parseOaBlocks(cleanedInput),
      thinkBlocks,
    )
  } catch {
    // If parse5 fails, fall back to simple string rendering
    // but still extract think blocks
    if (thinkBlocks.length > 0) {
      const result: ParsedTagContent[] = []
      const parts = cleanedInput.split(THINK_PLACEHOLDER)
      for (let i = 0; i < parts.length; i++) {
        const trimmed = parts[i].trim()
        if (trimmed) {
          result.push({ type: 'string', content: trimmed })
        }
        if (i < thinkBlocks.length) {
          result.push({ type: 'think', content: thinkBlocks[i] })
        }
      }
      return result
    }
    return [{ type: 'string', content: input }]
  }
}

function interleaveThinkBlocks(
  oaBlocks: ParsedTagContent[],
  thinkBlocks: string[],
): ParsedTagContent[] {
  const result: ParsedTagContent[] = []
  let thinkIndex = 0
  for (const block of oaBlocks) {
    if (block.type === 'string') {
      const parts = block.content.split(THINK_PLACEHOLDER)
      for (let i = 0; i < parts.length; i++) {
        const trimmed = parts[i].trim()
        if (trimmed) {
          result.push({ type: 'string', content: trimmed })
        }
        if (i < parts.length - 1 && thinkIndex < thinkBlocks.length) {
          result.push({ type: 'think', content: thinkBlocks[thinkIndex++] })
        }
      }
    } else {
      result.push(block)
    }
  }
  return result
}

function parseOaBlocks(input: string): ParsedTagContent[] {
  if (!input.includes('<oa_block')) {
    return [{ type: 'string', content: input }]
  }
  const parsedResult: ParsedTagContent[] = []
  const fragment = parseFragment(input, {
    sourceCodeLocationInfo: true,
  })
  let lastEndOffset = 0
  for (const node of fragment.childNodes) {
    if (node.nodeName === 'oa_block') {
      if (!node.sourceCodeLocation) {
        throw new Error('sourceCodeLocation is undefined')
      }
      const startOffset = node.sourceCodeLocation.startOffset
      const endOffset = node.sourceCodeLocation.endOffset
      if (startOffset > lastEndOffset) {
        parsedResult.push({
          type: 'string',
          content: input.slice(lastEndOffset, startOffset),
        })
      }

      const language = node.attrs.find(
        (attr) => attr.name === 'language',
      )?.value
      const filename = node.attrs.find(
        (attr) => attr.name === 'filename',
      )?.value
      const startLine = node.attrs.find(
        (attr) => attr.name === 'startline',
      )?.value
      const endLine = node.attrs.find((attr) => attr.name === 'endline')?.value

      const children = node.childNodes
      if (children.length === 0) {
        parsedResult.push({
          type: 'oa_block',
          content: '',
          language,
          filename,
          startLine: startLine ? parseInt(startLine) : undefined,
          endLine: endLine ? parseInt(endLine) : undefined,
        })
      } else {
        const innerContentStartOffset =
          children[0].sourceCodeLocation?.startOffset
        const innerContentEndOffset =
          children[children.length - 1].sourceCodeLocation?.endOffset
        if (!innerContentStartOffset || !innerContentEndOffset) {
          throw new Error('sourceCodeLocation is undefined')
        }
        parsedResult.push({
          type: 'oa_block',
          content: input.slice(innerContentStartOffset, innerContentEndOffset),
          language,
          filename,
          startLine: startLine ? parseInt(startLine) : undefined,
          endLine: endLine ? parseInt(endLine) : undefined,
        })
      }
      lastEndOffset = endOffset
    }
  }
  if (lastEndOffset < input.length) {
    parsedResult.push({
      type: 'string',
      content: input.slice(lastEndOffset),
    })
  }

  parsedResult.forEach((block) => {
    block.content = block.content.replace(/^\n|\n$/g, '')
  })

  return parsedResult
}
