import { useState } from 'react'
import { useCodexStore } from '../../stores/codexStore'
import { CHARACTERS } from '../../data/characters/roster'
import { PROVINCE_ENTRIES, FACTION_NAMES, NATION_ENTRIES, TERM_ENTRIES } from './entityMaps'
import { codexLinkHandlers } from '../narrative/linkPress'

interface EntityToken {
  text: string
  codexId: string
}

function findEntities(text: string): EntityToken[] {
  const entities: EntityToken[] = []

  for (const char of CHARACTERS) {
    if (text.includes(char.name)) {
      entities.push({ text: char.name, codexId: char.codexEntryId })
    }
  }

  for (const [name, id] of Object.entries(PROVINCE_ENTRIES)) {
    if (text.includes(name)) {
      entities.push({ text: name, codexId: id })
    }
  }

  for (const [name, id] of Object.entries(FACTION_NAMES)) {
    if (text.includes(name)) {
      entities.push({ text: name, codexId: id })
    }
  }

  for (const [name, id] of Object.entries(NATION_ENTRIES)) {
    if (text.includes(name)) {
      entities.push({ text: name, codexId: id })
    }
  }

  for (const [term, id] of Object.entries(TERM_ENTRIES)) {
    if (text.includes(term)) {
      entities.push({ text: term, codexId: id })
    }
  }

  return entities
}

function EntityLink({ text, codexId, inline }: { text: string; codexId: string; inline?: boolean }) {
  const viewEntry = useCodexStore(s => s.viewEntry)
  const openCodex = useCodexStore(s => s.openCodex)
  const openInlineCodex = useCodexStore(s => s.openInlineCodex)
  const [flashing, setFlashing] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFlashing(true)
    setTimeout(() => setFlashing(false), 300)
    viewEntry(codexId)
    if (inline) {
      openInlineCodex(codexId)
    } else {
      openCodex(undefined, codexId)
    }
  }

  // Inline links sit in conversation text, so they follow the touch rules in linkPress.ts.
  const openInline = () => {
    setFlashing(true)
    setTimeout(() => setFlashing(false), 300)
    viewEntry(codexId)
    openInlineCodex(codexId)
  }
  const pressHandlers = inline ? codexLinkHandlers(openInline) : null

  return (
    <span
      {...pressHandlers}
      onClick={pressHandlers ? pressHandlers.onClick : handleClick}
      style={{
        color: flashing ? '#8fe8f8' : '#5a9aaa',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.15s',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
      }}
      title={`Open Codex: ${text}`}
      onMouseEnter={e => { e.currentTarget.style.color = '#6fbfd0'; e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.textDecorationColor = 'rgba(111,191,208,0.5)'; e.currentTarget.style.textUnderlineOffset = '3px' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#5a9aaa'; e.currentTarget.style.textDecoration = 'none' }}
    >
      {text}
    </span>
  )
}

export function renderWithEntities(body: string, inline = false): React.ReactNode {
  const entities = findEntities(body)
  if (entities.length === 0) return body

  entities.sort((a, b) => b.text.length - a.text.length)

  const unique: EntityToken[] = []
  const seen = new Set<string>()
  for (const e of entities) {
    if (!seen.has(e.text)) {
      seen.add(e.text)
      unique.push(e)
    }
  }

  const result: React.ReactNode[] = []
  let remaining = body

  while (remaining.length > 0) {
    let earliestIndex = remaining.length
    let earliestEntity: EntityToken | null = null

    for (const entity of unique) {
      const idx = remaining.indexOf(entity.text)
      if (idx !== -1 && idx < earliestIndex) {
        earliestIndex = idx
        earliestEntity = entity
      }
    }

    if (earliestEntity === null) {
      result.push(remaining)
      break
    }

    if (earliestIndex > 0) {
      result.push(remaining.slice(0, earliestIndex))
    }

    result.push(
      <EntityLink
        key={`${earliestEntity.text}-${earliestIndex}`}
        text={earliestEntity.text}
        codexId={earliestEntity.codexId}
        inline={inline}
      />,
    )

    remaining = remaining.slice(earliestIndex + earliestEntity.text.length)
  }

  return result
}
