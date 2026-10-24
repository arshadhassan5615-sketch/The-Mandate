import { useMemo, useState, type CSSProperties } from 'react'
import { useNarrativeStore, type ChoiceRecord } from '../../stores/narrativeStore'
import { usePageInsets } from '../../hooks/usePageInsets'
import { getScene } from '../../engine/NarrativeEngine'
import { buildScenePath, type PathNode, type PathTarget, type ScenePathSummary } from '../../engine/scenePaths'
import { stripOuterQuotes } from '../../engine/quotes'
import PaperPanel from './PaperPanel'
import { CAB_BODY, CAB_FONT, CAB_LABEL } from '../ui/cabinet/cabinetStyles'
import { CabinetCard, StatusPill } from '../ui/cabinet/CabinetParts'
import { rem } from '../../constants/typography'

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

// Kind tags: a meeting that ended is done (calm); the other two are neutral.
const TAG_COLOR_BY_KIND: Record<PathTarget['kind'], string> = {
  segment: 'var(--cab-muted)',
  scene: 'var(--cab-muted)',
  end: 'var(--sev-calm)',
}

const SCROLL_THIN: CSSProperties = {
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(201,168,76,0.3) transparent',
}

const CARD_BODY: CSSProperties = { padding: '4px 0' }
const EMPTY_STYLE: CSSProperties = {
  ...CAB_BODY, fontStyle: 'italic', color: 'var(--cab-muted)', textAlign: 'center', margin: '18px 0',
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
  const isMobile = usePageInsets().isPhone
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
        <div style={{ overflowY: 'auto', ...SCROLL_THIN, padding: '4px 20px 20px', flex: 1, minHeight: 0 }}>
          <p style={EMPTY_STYLE}>{EMPTY_NOTE}</p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
            flex: 1,
            minHeight: 0,
            padding: '4px 20px 20px',
          }}
        >
          <SceneList
            scenes={scenes}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            isMobile={isMobile}
          />
          {selected && (
            <div
              data-testid="scene-paths-tree"
              role="region"
              aria-label="Scene paths"
              tabIndex={0}
              style={{ flex: 1, minWidth: 0, overflowY: 'auto', ...SCROLL_THIN }}
            >
              <CabinetCard title="The Roads Taken" bodyStyle={CARD_BODY}>
                <PathBranch node={selected.summary.root} nested={false} isPhone={isMobile} />
              </CabinetCard>
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
        ...SCROLL_THIN,
      }}
    >
      <CabinetCard title="Finished Meetings" bodyStyle={CARD_BODY}>
        {scenes.map((scene, index) => (
          <SceneButton
            key={scene.id}
            scene={scene}
            isSelected={scene.id === selectedId}
            isFirst={index === 0}
            onSelect={onSelect}
          />
        ))}
      </CabinetCard>
    </div>
  )
}

interface SceneButtonProps {
  scene: FinishedScene
  isSelected: boolean
  isFirst: boolean
  onSelect: (id: string) => void
}

function SceneButton({ scene, isSelected, isFirst, onSelect }: SceneButtonProps) {
  const { explored, total } = scene.summary
  return (
    <button
      type="button"
      data-testid={`path-scene-${scene.id}`}
      aria-current={isSelected ? 'true' : undefined}
      onClick={() => onSelect(scene.id)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '9px 14px',
        background: isSelected ? 'var(--cab-wine)' : 'transparent',
        border: 'none',
        borderTop: isFirst ? 'none' : '1px solid var(--cab-card-edge)',
        borderLeft: `2px solid ${isSelected ? 'var(--cab-gold)' : 'transparent'}`,
        color: isSelected ? 'var(--cab-title)' : 'var(--cab-text)',
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'block', fontFamily: CAB_FONT.title, fontWeight: 700, fontSize: rem(16), lineHeight: 1.3 }}>
        {scene.title}
      </span>
      <span style={{ ...CAB_LABEL, fontSize: rem(10), display: 'block', marginTop: 3 }}>
        {`${explored} of ${total} paths explored`}
      </span>
    </button>
  )
}

interface PathBranchProps {
  node: PathNode
  nested: boolean
  isPhone: boolean
}

/** One decision point: its choices as a vertical list, indented under the choice that led here. */
function PathBranch({ node, nested, isPhone }: PathBranchProps) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: nested ? '2px 0 2px 12px' : 0,
        marginLeft: nested ? INDENT_PX : 0,
        borderLeft: nested ? '1px solid var(--cab-card-edge)' : 'none',
      }}
    >
      {node.choices.map((choice, index) => (
        <li key={choice.id} style={{ borderTop: index > 0 ? '1px solid var(--cab-card-edge)' : undefined }}>
          {choice.taken ? (
            <TakenChoice
              text={choice.text}
              tag={TAG_BY_KIND[choice.target.kind]}
              tagColor={TAG_COLOR_BY_KIND[choice.target.kind]}
              next={choice.next}
              isPhone={isPhone}
            />
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
  tagColor: string
  next: PathNode | null
  isPhone: boolean
}

function TakenChoice({ text, tag, tagColor, next, isPhone }: TakenChoiceProps) {
  return (
    <>
      <div
        data-testid="path-taken"
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '9px 14px', flexWrap: isPhone ? 'wrap' : 'nowrap' }}
      >
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cab-gold)', flexShrink: 0, transform: 'translateY(-1px)' }}
        />
        <span style={{ ...CAB_BODY, flex: 1, minWidth: 0, fontSize: rem(15), lineHeight: 1.4 }}>
          {`“${stripOuterQuotes(text)}”`}
        </span>
        <span style={{ flexShrink: 0 }}>
          <StatusPill color={tagColor}>{tag}</StatusPill>
        </span>
      </div>
      {next && <PathBranch node={next} nested isPhone={isPhone} />}
    </>
  )
}

function SealedChoice() {
  return (
    <div
      data-testid="path-sealed"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 14px',
        color: 'var(--cab-muted)',
      }}
    >
      <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
        <path d={PADLOCK_PATH} />
      </svg>
      <span style={{ ...CAB_BODY, fontStyle: 'italic', fontSize: rem(14), color: 'var(--cab-muted)' }}>{SEALED_LABEL}</span>
    </div>
  )
}
