/** The phrase naming who put a decree before the Chancellor, as used in the decree's sub line and preamble. */
export function proposalPhrase(proposedBy: string): string {
  if (proposedBy === 'Chancellor Ashavel') return "issued on the Chancellor's own motion"
  if (proposedBy.startsWith('Archbishop ') || proposedBy.startsWith('Chancellor ')) {
    return `on the proposal of ${proposedBy}`
  }
  return `on the proposal of the ${proposedBy}`
}
