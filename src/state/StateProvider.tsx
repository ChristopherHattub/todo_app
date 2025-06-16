import React, { createContext, useContext, useEffect, useState } from 'react';
import { StateManager, RootState } from './StateManager';

const StateContext = createContext<StateManager | null>(null);

export interface StateProviderProps {
  stateManager: StateManager;
  children: React.ReactNode;
}

export const StateProvider: React.FC<StateProviderProps> = ({ stateManager, children }) => {
  return (
    <StateContext.Provider value={stateManager}>
      {children}
    </StateContext.Provider>
  );
};

export function useStateManager(): StateManager {
  const stateManager = useContext(StateContext);
  if (!stateManager) {
    throw new Error('useStateManager must be used within a StateProvider');
  }
  return stateManager;
}

export function useAppState(): RootState {
  const stateManager = useStateManager();
  const [state, setState] = useState(stateManager.getState());

  useEffect(() => {
    return stateManager.subscribe(setState);
  }, [stateManager]);

  return state;
}

export function useAppDispatch() {
  const stateManager = useStateManager();
  return stateManager.dispatch.bind(stateManager);
}

export function useSliceSelector<T extends keyof RootState>(
  sliceName: T,
  selectorName: string
): (state: RootState[T]) => any {
  const stateManager = useStateManager();
  const selectors = stateManager.getSliceSelectors(sliceName);
  return selectors[selectorName];
}

export function useSliceActions<T extends keyof RootState>(
  sliceName: T
): Record<string, (...args: any[]) => any> {
  const stateManager = useStateManager();
  return stateManager.getSliceActions(sliceName);
} 