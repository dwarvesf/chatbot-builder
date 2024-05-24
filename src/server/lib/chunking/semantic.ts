export async function semanticChunkingData(data: string): Promise<string[]> {
  const sentences = data
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .split(/[.!?]/g)

  const results = []
  for (let i = 0; i < sentences.length; i++) {
    let combined_sentence = ''

    for (let j = i - 1; j < i; j++) {
      if (j >= 0) {
        combined_sentence += sentences[j] + ' '
      }
    }

    combined_sentence += sentences[i]

    for (let j = i + 1; j <= i + 1; j++) {
      if (j < sentences.length) {
        combined_sentence += ' ' + sentences[j]
      }
    }
    results.push(combined_sentence)
  }
  return results
}
