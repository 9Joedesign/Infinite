export function unwrapMarkdownFence(content: string) {
  const trimmed = content.trim()
  const openingFence = trimmed.match(/^```(?:markdown|md)\s*\n/i)

  if (!openingFence) return content

  let unwrapped = trimmed.slice(openingFence[0].length)
  unwrapped = unwrapped.replace(/\n```[\t ]*$/u, '')

  return unwrapped.trim()
}
