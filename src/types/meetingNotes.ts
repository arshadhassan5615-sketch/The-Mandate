/** One entry in Katerin's automatic meeting notes, written when a scene completes. */
export interface MeetingNote {
  sceneId: string
  title: string
  week: number
  lines: string[]
}
