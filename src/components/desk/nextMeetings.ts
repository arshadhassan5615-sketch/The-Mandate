// This week's meetings as the map pins offer them: each province offers only its
// next unfinished meeting (meetings in one province run in executionOrder).
import { groupByProvince, type ProvinceId } from '../../engine/LocationResolver'
import { isAgendaItemDone } from '../../engine/weekCompletion'
import type { AgendaItem } from '../../types/week'

export interface MeetingSlot {
  province: ProvinceId
  item: AgendaItem
}

export function nextMeetings(
  agendaPool: AgendaItem[],
  visitedSceneIds: string[],
  completedItemIds: string[],
): MeetingSlot[] {
  const groups = groupByProvince(agendaPool)
  const slots: MeetingSlot[] = []
  for (const province of Object.keys(groups) as ProvinceId[]) {
    const sorted = [...groups[province]].sort((a, b) => a.executionOrder - b.executionOrder)
    const next = sorted.find(item => !isAgendaItemDone(item, visitedSceneIds, completedItemIds))
    if (next) slots.push({ province, item: next })
  }
  // Urgent first, then the order the week would run them in
  return slots.sort((a, b) =>
    Number(!!b.item.isUrgent) - Number(!!a.item.isUrgent) || a.item.executionOrder - b.item.executionOrder)
}

export function doneMeetings(
  agendaPool: AgendaItem[],
  visitedSceneIds: string[],
  completedItemIds: string[],
): AgendaItem[] {
  return agendaPool.filter(item => isAgendaItemDone(item, visitedSceneIds, completedItemIds))
}
