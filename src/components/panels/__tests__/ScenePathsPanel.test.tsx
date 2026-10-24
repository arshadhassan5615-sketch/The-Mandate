import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ScenePathsPanel from '../ScenePathsPanel'
import { SCENE_REGISTRY } from '../../../engine/NarrativeEngine'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import type { NarrativeNode } from '../../../types/narrative'

const PANEL_SCENE_ID = 'test_panel_bill_scene'
const SECOND_SCENE_ID = 'test_panel_second_scene'

// Opening: "Take the bill" continues into seg_one; "Wait and see" and "Send for the
// minister" are untaken. In seg_one, "Sign it" is taken and "Veto it" is untaken.
// Declared: 3 + 2 = 5 choices. Taken: 2. So "2 of 5 paths explored".
function makeBillScene(): NarrativeNode {
  return {
    id: PANEL_SCENE_ID,
    title: 'The Bill Meeting',
    act: 1,
    weekAvailable: 1,
    type: 'meeting',
    agendaCost: 0,
    location: 'Office',
    characters: [],
    prerequisites: [],
    choices: [
      { id: 'o_take', text: 'Take the bill', nextSegment: 'seg_one' },
      { id: 'o_wait', text: 'Wait and see' },
      { id: 'o_send', text: 'Send for the minister' },
    ],
    segments: {
      seg_one: {
        choices: [
          { id: 's_sign', text: 'Sign it' },
          { id: 's_veto', text: 'Veto it' },
        ],
      },
    },
  }
}

function makeSecondScene(): NarrativeNode {
  return {
    id: SECOND_SCENE_ID,
    title: 'The Second Meeting',
    act: 1,
    weekAvailable: 2,
    type: 'meeting',
    agendaCost: 0,
    location: 'Office',
    characters: [],
    prerequisites: [],
    choices: [{ id: 'x_only', text: 'Only option' }],
  }
}

function resetNarrative() {
  useNarrativeStore.setState({ visitedSceneIds: [], choiceLog: [] })
}

describe('ScenePathsPanel', () => {
  beforeEach(() => {
    SCENE_REGISTRY.set(PANEL_SCENE_ID, makeBillScene())
    SCENE_REGISTRY.set(SECOND_SCENE_ID, makeSecondScene())
    useNarrativeStore.setState({
      visitedSceneIds: [PANEL_SCENE_ID],
      choiceLog: [
        { sceneId: PANEL_SCENE_ID, segmentId: null, choiceId: 'o_take', week: 3 },
        { sceneId: PANEL_SCENE_ID, segmentId: 'seg_one', choiceId: 's_sign', week: 3 },
      ],
    })
  })

  afterEach(() => {
    SCENE_REGISTRY.delete(PANEL_SCENE_ID)
    SCENE_REGISTRY.delete(SECOND_SCENE_ID)
    resetNarrative()
  })

  it('is a labelled dialog titled Scene Paths', () => {
    render(<ScenePathsPanel onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Scene Paths' })).toBeInTheDocument()
  })

  it('lists the finished scene with its explored count', () => {
    render(<ScenePathsPanel onClose={() => {}} />)
    const item = screen.getByTestId(`path-scene-${PANEL_SCENE_ID}`)
    expect(item).toHaveTextContent('The Bill Meeting')
    expect(item).toHaveTextContent('2 of 5 paths explored')
  })

  it('selects the first scene by default', () => {
    render(<ScenePathsPanel onClose={() => {}} />)
    expect(screen.getByTestId(`path-scene-${PANEL_SCENE_ID}`)).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the taken choice text with its tag', () => {
    render(<ScenePathsPanel onClose={() => {}} />)
    const taken = screen.getAllByTestId('path-taken')
    expect(taken).toHaveLength(2)
    expect(taken[0]).toHaveTextContent('“Take the bill”')
    expect(taken[0]).toHaveTextContent('Continued')
    expect(taken[1]).toHaveTextContent('“Sign it”')
    expect(taken[1]).toHaveTextContent('Ended the meeting')
  })

  it('does not double the quotes on a choice text that already has them', () => {
    const quotedSceneId = 'test_panel_quoted_scene'
    SCENE_REGISTRY.set(quotedSceneId, {
      ...makeSecondScene(),
      id: quotedSceneId,
      choices: [{ id: 'q_let', text: '"Let them."' }],
    })
    useNarrativeStore.setState({
      visitedSceneIds: [quotedSceneId],
      choiceLog: [{ sceneId: quotedSceneId, segmentId: null, choiceId: 'q_let', week: 4 }],
    })
    try {
      render(<ScenePathsPanel onClose={() => {}} />)
      expect(screen.getByText('“Let them.”')).toBeInTheDocument()
    } finally {
      SCENE_REGISTRY.delete(quotedSceneId)
    }
  })

  it('shows a sealed row for each untaken option', () => {
    render(<ScenePathsPanel onClose={() => {}} />)
    const sealed = screen.getAllByTestId('path-sealed')
    expect(sealed).toHaveLength(3)
    sealed.forEach(row => expect(within(row).getByText('Unexplored path')).toBeInTheDocument())
  })

  it('never reveals the text of an untaken option', () => {
    render(<ScenePathsPanel onClose={() => {}} />)
    expect(screen.queryByText('Wait and see')).toBeNull()
    expect(screen.queryByText('Send for the minister')).toBeNull()
    expect(screen.queryByText(/Veto it/)).toBeNull()
    expect(document.body.innerHTML).not.toContain('Wait and see')
    expect(document.body.innerHTML).not.toContain('Send for the minister')
    expect(document.body.innerHTML).not.toContain('Veto it')
  })

  it('switches the tree when another finished scene is picked', () => {
    useNarrativeStore.setState({ visitedSceneIds: [PANEL_SCENE_ID, SECOND_SCENE_ID] })
    render(<ScenePathsPanel onClose={() => {}} />)
    expect(screen.getByTestId(`path-scene-${SECOND_SCENE_ID}`)).toHaveTextContent('0 of 1 paths explored')
    fireEvent.click(screen.getByTestId(`path-scene-${SECOND_SCENE_ID}`))
    expect(screen.getByTestId(`path-scene-${SECOND_SCENE_ID}`)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('path-sealed')).toHaveAttribute('aria-label', 'Unexplored path')
    expect(screen.queryByText('“Take the bill”')).toBeNull()
  })

  it('shows the empty state when no meeting is finished', () => {
    resetNarrative()
    render(<ScenePathsPanel onClose={() => {}} />)
    expect(screen.getByText('Finish a meeting to see its paths here.')).toBeInTheDocument()
    expect(screen.queryByTestId('scene-paths-tree')).toBeNull()
  })

  it('leaves out visited ids that cannot be found', () => {
    useNarrativeStore.setState({ visitedSceneIds: ['missing_scene_id', PANEL_SCENE_ID] })
    render(<ScenePathsPanel onClose={() => {}} />)
    expect(screen.queryByTestId('path-scene-missing_scene_id')).toBeNull()
    expect(screen.getByTestId(`path-scene-${PANEL_SCENE_ID}`)).toBeInTheDocument()
  })

  it('closes from the close button and from Escape', () => {
    const onClose = vi.fn()
    render(<ScenePathsPanel onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close Scene Paths' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
