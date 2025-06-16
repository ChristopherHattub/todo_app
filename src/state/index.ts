// Core - Types
export type { StateSlice, SliceAction, AsyncSliceAction } from './core/StateSlice';
export { BaseStateSlice } from './core/StateSlice';

// Slices - Types
export type { TodoState, TodoActions } from './slices/TodoSlice';
export type { DateState, DateActions } from './slices/DateSlice';
export type { UIState, UIActions, Notification } from './slices/UISlice';

// Slices - Classes
export { TodoSlice } from './slices/TodoSlice';
export { DateSlice } from './slices/DateSlice';
export { UISlice } from './slices/UISlice';

// State Manager - Types
export type { RootState, RootActions } from './StateManager';
export { StateManager } from './StateManager';

// React Integration - Types
export type { StateProviderProps } from './StateProvider';
export {
  StateProvider,
  useStateManager,
  useAppState,
  useAppDispatch,
  useSliceSelector,
  useSliceActions
} from './StateProvider'; 