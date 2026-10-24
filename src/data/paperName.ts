import { NEWSPAPERS } from './newspapers'

const LEADING_ARTICLE = 'The'

/** Turns a publication id such as 'veltrian_voice' into 'The Veltrian Voice'. */
function titleFromId(publication: string): string {
  const words = publication
    .split('_')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  const title = words.join(' ')
  const hasArticle = title === LEADING_ARTICLE || title.startsWith(`${LEADING_ARTICLE} `)
  return hasArticle ? title : `${LEADING_ARTICLE} ${title}`
}

/**
 * Display name of a publication: its masthead name, or a readable title made from the id
 * when the paper has no entry in NEWSPAPERS.
 */
export function paperName(publication: string): string {
  if (Object.hasOwn(NEWSPAPERS, publication)) {
    return NEWSPAPERS[publication].name
  }
  return titleFromId(publication)
}
