export async function semanticChunkingData(
  data: string,
  bufferSize: number,
): Promise<string[]> {
  const sentences = data
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .split(/[.!?]/g)

  const results = []
  for (let i = 0; i < sentences.length; i++) {
    let combined_sentence = ''

    for (let bIndex = i - bufferSize; bIndex < i; bIndex++) {
      if (bIndex >= 0) {
        combined_sentence += sentences[bIndex] + ' '
      }
    }

    combined_sentence += sentences[i]

    for (let aIndex = i + 1; aIndex <= i + bufferSize; aIndex++) {
      if (aIndex < sentences.length) {
        combined_sentence += ' ' + sentences[aIndex]
      }
    }
    results.push(combined_sentence)
  }
  return results
}
