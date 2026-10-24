/** Up to two capital initials from a display name ('Gregor Marić' → 'GM', 'Col. Irina Dusek' → 'CI'). Empty or blank name → ''. */
export function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
}
