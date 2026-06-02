import { create } from 'zustand'
import type {
  CabinetState,
  AppointedMinister,
  MinistryType,
  MinisterCandidate,
  MinisterRequest,
} from '../types/minister'

interface CabinetStore extends CabinetState {
  appointMinister: (candidate: MinisterCandidate, week: number) => void
  removeMinister: (ministry: MinistryType) => void
  updateLoyalty: (ministry: MinistryType, delta: number) => void
  updateSatisfaction: (ministry: MinistryType, delta: number) => void
  addRequest: (request: MinisterRequest) => void
  completeRequest: (requestId: string) => void
  completeFormation: (week: number) => void
  getMinister: (ministry: MinistryType) => AppointedMinister | null
  getAllMinisters: () => AppointedMinister[]
  getPendingRequests: () => MinisterRequest[]
}

const EMPTY_CABINET: Record<MinistryType, null> = {
  finance: null,
  interior: null,
  defense: null,
  justice: null,
  labor: null,
  foreign_affairs: null,
  education: null,
  health: null,
  development: null,
  resources: null,
}

export const useCabinetStore = create<CabinetStore>()((set, get) => ({
  ministers: { ...EMPTY_CABINET },
  formation_complete: false,
  formation_week: null,
  pending_requests: [],
  completed_requests: [],

  appointMinister: (candidate, week) =>
    set(state => ({
      ministers: {
        ...state.ministers,
        [candidate.ministry]: {
          ...candidate,
          appointed_week: week,
          current_loyalty: candidate.loyalty,
          satisfaction: 70,
          last_report_week: week,
          active_request: undefined,
        },
      },
    })),

  removeMinister: (ministry) =>
    set(state => ({
      ministers: {
        ...state.ministers,
        [ministry]: null,
      },
    })),

  updateLoyalty: (ministry, delta) =>
    set(state => {
      const minister = state.ministers[ministry]
      if (!minister) return state
      return {
        ministers: {
          ...state.ministers,
          [ministry]: {
            ...minister,
            current_loyalty: Math.max(
              0,
              Math.min(100, minister.current_loyalty + delta)
            ),
          },
        },
      }
    }),

  updateSatisfaction: (ministry, delta) =>
    set(state => {
      const minister = state.ministers[ministry]
      if (!minister) return state
      return {
        ministers: {
          ...state.ministers,
          [ministry]: {
            ...minister,
            satisfaction: Math.max(
              0,
              Math.min(100, minister.satisfaction + delta)
            ),
          },
        },
      }
    }),

  addRequest: (request) =>
    set(state => ({
      pending_requests: [...state.pending_requests, request],
    })),

  completeRequest: (requestId) =>
    set(state => ({
      pending_requests: state.pending_requests.filter(
        r => r.id !== requestId
      ),
      completed_requests: [...state.completed_requests, requestId],
    })),

  completeFormation: (week) =>
    set({
      formation_complete: true,
      formation_week: week,
    }),

  getMinister: (ministry) => {
    return get().ministers[ministry]
  },

  getAllMinisters: () => {
    return Object.values(get().ministers).filter(
      Boolean
    ) as AppointedMinister[]
  },

  getPendingRequests: () => {
    return get().pending_requests
  },
}))
