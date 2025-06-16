import { StateSlice, SliceAction } from './core/StateSlice';
import { TodoSlice, TodoState, TodoActions } from './slices/TodoSlice';
import { DateSlice, DateState, DateActions } from './slices/DateSlice';
import { UISlice, UIState, UIActions } from './slices/UISlice';

export interface RootState {
  todo: TodoState;
  date: DateState;
  ui: UIState;
}

export type RootActions = TodoActions | DateActions | UIActions;

export class StateManager {
  private slices: Map<string, StateSlice> = new Map();
  private currentState: RootState;
  private listeners: Array<(state: RootState) => void> = [];

  constructor() {
    // Register slices
    this.registerSlice(new TodoSlice());
    this.registerSlice(new DateSlice());
    this.registerSlice(new UISlice());

    // Initialize state
    this.currentState = this.createInitialState();
  }

  private registerSlice(slice: StateSlice): void {
    this.slices.set(slice.name, slice);
  }

  private createInitialState(): RootState {
    const state: any = {};
    
    for (const [name, slice] of this.slices) {
      state[name] = slice.initialState;
    }

    return state as RootState;
  }

  getState(): RootState {
    return this.currentState;
  }

  dispatch(action: RootActions): void {
    let hasChanged = false;
    const newState: any = {};

    // Run action through all slice reducers
    for (const [name, slice] of this.slices) {
      const currentSliceState = this.currentState[name as keyof RootState];
      const newSliceState = slice.reducer(currentSliceState, action);
      
      newState[name] = newSliceState;
      
      if (newSliceState !== currentSliceState) {
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.currentState = newState as RootState;
      this.notifyListeners();
    }
  }

  subscribe(listener: (state: RootState) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Selector helpers
  getSliceSelectors<T extends keyof RootState>(sliceName: T): Record<string, (state: RootState[T]) => any> {
    const slice = this.slices.get(sliceName as string);
    return slice?.selectors || {};
  }

  getSliceActions<T extends keyof RootState>(sliceName: T): Record<string, (...args: any[]) => any> {
    const slice = this.slices.get(sliceName as string);
    return slice?.actions || {};
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    }
  }
} 