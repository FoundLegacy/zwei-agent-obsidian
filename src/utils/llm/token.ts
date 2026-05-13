const AVG_CHARS_PER_TOKEN = 4

export async function tokenCount(text: string): Promise<number> {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN)
}
