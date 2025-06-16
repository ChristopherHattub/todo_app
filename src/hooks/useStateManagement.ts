import { useAppContext } from '../core/AppContext';
import { RootState, RootActions } from '../state/StateManager';

export interface StateManagementHook {
  state: RootState;
  dispatch: (action: RootActions) => void;
}

export function useStateManagement(): StateManagementHook {
  const { bootstrap, isInitialized } = useAppContext();
  
  if (!isInitialized) {
    throw new Error('State management is not initialized yet');
  }

  const stateManager = bootstrap.getStateManager();
  
  return {
    state: stateManager.getState(),
    dispatch: stateManager.dispatch.bind(stateManager)
  };
} 