import { useMemo, useState } from 'react'
import { useNarrativeStore, type ChoiceRecord } from '../../stores/narrativeStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { getScene } from '../../engine/NarrativeEngine'
import { buildScenePath, type PathNode, type PathTarget, type ScenePathSummary } from '../../engine/scenePaths'
import { stripOuterQuotes } from '../../engine/quotes'
import PaperPanel from './PaperPanel'
import { OVERLINE, SERIF_BODY } from './paperStyles'

// The roads taken through a finished meeting, on one state paper: the choices the
// Chancellor made, and each decision point's other options sealed shut. The words
// of an unexplored option are never shown. Read-only.

interface ScenePathsPanelProps {
  onClose: () => void
}

interface FinishedScene {
  id: string
  title: string
  summary: ScenePathSummary
}

const GOLD_DOT = '#b8892e'
const INDENT_PX = 18
const LIST_WIDTH_PX = 220
const SEALED_LABEL = 'Unexplored path'
const EMPTY_NOTE = 'Finish a meeting to see its paths here.'
const PADLOCK_PATH = 'M6 10V7a6 6 0 0 1 12 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1zm2 0h8V7a4 4 0 0 0-8 0z'

const TAG_BY_KIND: Record<PathTarget['kind'], string> = {
  segment: 'Continued',
  scene: 'Led elsewhere',
  end: 'Ended the meeting',
}

/** Finished scenes, most recent first. Unknown ids and scenes with no choices are left out. */
function finishedScenes(visitedSceneIds: readonly string[], choiceLog: readonly ChoiceRecord[]): FinishedScene[] {
  const scenes: FinishedScene[] = []
  for (const id of [...visitedSceneIds].reverse()) {
    const scene = getScene(id)
    if (!scene) continue
    const summary = buildScenePath(scene, choiceLog)
    if (summary.total === 0) continue
    scenes.push({ id, title: scene.title, summary })
  }
  return scenes
}

export default function ScenePathsPanel({ onClose }: ScenePathsPanelProps) {
  const visitedSceneIds = useNarrativeStore(s => s.visitedSceneIds)
  const choiceLog = useNarrativeStore(s => s.choiceLog)
  const isMobile = useIsMobile()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const scenes = useMemo(() => finishedScenes(visitedSceneIds, choiceLog), [visitedSceneIds, choiceLog])
  // The first (most recent) scene stands in until the player picks another.
  const selected = scenes.find(scene => scene.id === selectedId) ?? scenes[0]

  return (
    <PaperPanel
      testId="scene-paths-panel"
      titleId="scene-paths-title"
      overline="Office of the Chancellor"
      title="Scene Paths"
      standfirst="The roads taken, and the ones left closed."
      closeLabel="Close Scene Paths"
      onClose={onClose}
      desktopWidth="min(640px, calc(100vw - 112px))"
      headerPadding="18px 22px 14px"
    >
      {scenes.length === 0 ? (
        <div style={{ overflowY: 'auto', padding: '6px 22px 20px', flex: 1, minHeight: 0 }}>
          <p style={{ fontFamily: SERIF_BODY, fontStyle: 'italic', fontSize: '14px', color: 'var(--doc-ink-muted)', margin: 0, padding: '18px 0' }}>
            {EMPTY_NOTE}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, minHeight: 0 }}>
          <SceneList
            scenes={scenes}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            isMobile={isMobile}
          />
          {selected && (
            <div
              data-testid="scene-paths-tree"
              style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '14px 22px 20px' }}
            >
              <PathBranch node={selected.summary.root} nested={false} />
            </div>
          )}
        </div>
      )}
    </PaperPanel>
  )
}

interface SceneListProps {
  scenes: FinishedScene[]
  selectedId: string | null
  onSelect: (id: string) => void
  isMobile: boolean
}

function SceneList({ scenes, selectedId, onSelect, isMobile }: SceneListProps) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: isMobile ? undefined : LIST_WIDTH_PX,
        maxHeight: isMobile ? '35%' : undefined,
        overflowY: 'auto',
        padding: '6px 0',
        borderRight: isMobile ? 'none' : '1px solid var(--doc-rule)',
        borderBottom: isMobile ? '1px solid var(--doc-rule)' : 'none',
      }}
    >
      {scenes.map(scene => (
        <SceneButton
          key={scene.id}
          scene={scene}
          isSelected={scene.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

interface SceneButtonProps {
  scene: FinishedScene
  isSelected: boolean
  onSelect: (id: string) => void
}

function SceneButton({ scene, isSelected, onSelect }: SceneButtonProps) {
  const { explored, total } = scene.summary
  return (
    <button
      type="button"
      data-testid={`path-scene-${scene.id}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(scene.id)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '9px 14px',
        background: isSelected ? 'rgba(60,40,20,0.08)' : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${isSelected ? 'var(--oxblood)' : 'transparent'}`,
        color: 'var(--doc-ink)',
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'block', fontFamily: SERIF_BODY, fontSize: '15px', lineHeight: 1.3 }}>
        {scene.title}
      </span>
      <span style={{ ...OVERLINE, display: 'block', marginTop: 3 }}>
        {`${explored} of ${total} paths explored`}
      </span>
    </button>
  )
}

interface PathBranchProps {
  node: PathNode
  nested: boolean
}

/** One decision point: its choices as a vertical list, indented under the choice that led here. */
function PathBranch({ node, nested }: PathBranchProps) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: nested ? '2px 0 2px 12px' : 0,
        marginLeft: nested ? INDENT_PX : 0,
        borderLeft: nested ? '1px solid var(--doc-rule)' : 'none',
      }}
    >
      {node.choices.map(choice => (
        <li key={choice.id} style={{ margin: '0 0 8px' }}>
          {choice.taken ? (
            <TakenChoice text={choice.text} tag={TAG_BY_KIND[choice.target.kind]} next={choice.next} />
          ) : (
            <SealedChoice />
          )}
        </li>
      ))}
    </ul>
  )
}

interface TakenChoiceProps {
  text: string
  tag: string
  next: PathNode | null
}

function TakenChoice({ text, tag, next }: TakenChoiceProps) {
  return (
    <>
      <div data-testid="path-taken" style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD_DOT, flexShrink: 0, transform: 'translateY(-1px)' }}
        />
        <span style={{ flex: 1, minWidth: 0, fontFamily: SERIF_BODY, fontSize: '15px', lineHeight: 1.4, color: 'var(--doc-ink)' }}>
          {`“${stripOuterQuotes(text)}”`}
        </span>
        <span style={{ ...OVERLINE, flexShrink: 0 }}>{tag}</span>
      </div>
      {next && <PathBranch node={next} nested />}
    </>
  )
}

function SealedChoice() {
  return (
    <div
      data-testid="path-sealed"
      role="group"
      aria-label={SEALED_LABEL}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        border: '1px dashed var(--doc-rule)',
        color: 'var(--doc-ink-muted)',
      }}
    >
      <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
        <path d={PADLOCK_PATH} />
      </svg>
      <span style={{ fontFamily: SERIF_BODY, fontStyle: 'italic', fontSize: '14px' }}>{SEALED_LABEL}</span>
    </div>
  )
}
