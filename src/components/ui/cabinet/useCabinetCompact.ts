import { usePageInsets } from '../../../hooks/usePageInsets'

/** True on compact and phone viewports, where Cabinet chrome uses its dense spacing. Callers can pick smaller controls with it. */
export function useCabinetCompact(): boolean {
  return usePageInsets().mode !== 'desktop'
}
