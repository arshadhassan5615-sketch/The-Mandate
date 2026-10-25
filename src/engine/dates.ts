// Calendar helpers for the 1963 timeline. Engine-level so that engine code never
// has to import from the UI layer.

/** Formats a calendar date the way the game prints dates: "1 October 1963". */
export function formatGameDate(d: Date): string {
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`
}

export function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return formatGameDate(d)
}

const ORDINAL_WORDS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth',
  'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third',
  'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth',
  'thirtieth', 'thirty-first',
]

const UNIT_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
]

const TENS_WORDS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
]

/** Day of the month as a word: 1 → "first", 21 → "twenty-first". */
export function ordinalWord(day: number): string {
  const word = ORDINAL_WORDS[day - 1]
  if (!Number.isInteger(day) || word === undefined) {
    throw new RangeError(`ordinalWord: day must be 1-31, got ${day}`)
  }
  return word
}

/** Cardinal words for 0-99: 63 → "sixty-three". */
function cardinalUnderHundred(n: number): string {
  if (n < UNIT_WORDS.length) return UNIT_WORDS[n]
  const units = n % 10
  const tens = TENS_WORDS[Math.floor(n / 10)]
  return units === 0 ? tens : `${tens}-${UNIT_WORDS[units]}`
}

/** Year as words for 1900-1999: 1963 → "nineteen hundred and sixty-three". */
export function yearWords(year: number): string {
  if (!Number.isInteger(year) || year < 1900 || year > 1999) {
    throw new RangeError(`yearWords: year must be 1900-1999, got ${year}`)
  }
  const rest = year - 1900
  return rest === 0 ? 'nineteen hundred' : `nineteen hundred and ${cardinalUnderHundred(rest)}`
}

/** Formal dating clause for a decree: 2 → "this eighth day of January, in the year nineteen hundred and sixty-three". */
export function formalGivenDate(week: number): string {
  const [day, month, year] = weekToDate(week).split(' ')
  return `this ${ordinalWord(Number(day))} day of ${month}, in the year ${yearWords(Number(year))}`
}
