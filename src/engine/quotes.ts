const OUTER_QUOTE_START = /^["“”]/
const OUTER_QUOTE_END = /["“”]$/

/** Trims the text, then removes one leading and one trailing quotation mark, then trims again. Inner quotes are kept. */
export function stripOuterQuotes(text: string): string {
  return text.trim().replace(OUTER_QUOTE_START, '').replace(OUTER_QUOTE_END, '').trim()
}
