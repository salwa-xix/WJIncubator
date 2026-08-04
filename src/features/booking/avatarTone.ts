/**
 * The reference alternates mentor avatars between navy and maroon rather than
 * making them all one colour.
 *
 * Derived from the name, not from the list index, so a mentor keeps the same
 * colour wherever they appear — the booking card at the top of the dashboard and
 * the mentor card further down are the same person and must not disagree. Index
 * would also reshuffle every time the list re-sorted.
 */
export function avatarTone(name: string): 'navy' | 'maroon' {
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return sum % 2 === 0 ? 'navy' : 'maroon'
}
