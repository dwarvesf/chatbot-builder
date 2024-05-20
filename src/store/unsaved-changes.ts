import { create } from 'zustand'

type State = {
  unsavedChanges: boolean
  setUnsavedChanges: (unsavedChanges: boolean) => void
  warning: boolean
  toggleWarning: () => void
}

export const useUnsavedChanges = create<State>((set) => ({
  unsavedChanges: false,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  setUnsavedChanges: (unsavedChanges) => set({ unsavedChanges }),
  warning: false,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  toggleWarning: () => set((state) => ({ warning: !state.warning })),
}))
