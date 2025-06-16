export interface StateSlice<TState = any, TActions = any> {
  readonly name: string;
  readonly initialState: TState;
  reducer(state: TState, action: TActions): TState;
  selectors: Record<string, (state: TState) => any>;
  actions: Record<string, (...args: any[]) => TActions>;
}

export interface SliceAction<TType extends string = string, TPayload = any> {
  type: TType;
  payload?: TPayload;
  meta?: Record<string, any>;
}

export interface AsyncSliceAction<TType extends string = string, TPayload = any> 
  extends SliceAction<TType, TPayload> {
  async: true;
  promise: Promise<any>;
}

// Base class for creating slices
export abstract class BaseStateSlice<TState, TActions extends SliceAction> 
  implements StateSlice<TState, TActions> {
  
  abstract readonly name: string;
  abstract readonly initialState: TState;
  abstract reducer(state: TState, action: TActions): TState;
  
  selectors: Record<string, (state: TState) => any> = {};
  actions: Record<string, (...args: any[]) => TActions> = {};

  protected createAction<T extends string, P = void>(
    type: T
  ): P extends void ? () => SliceAction<T> : (payload: P) => SliceAction<T, P> {
    return ((payload?: P) => ({
      type,
      ...(payload !== undefined && { payload })
    })) as any;
  }

  protected createAsyncAction<T extends string, P = void>(
    type: T,
    asyncFn: (payload: P, getState: () => TState) => Promise<any>
  ): (payload: P) => AsyncSliceAction<T, P> {
    return (payload: P) => ({
      type,
      payload,
      async: true,
      promise: asyncFn(payload, () => this.initialState) // Will be replaced by actual state
    });
  }

  protected createSelector<TResult>(
    name: string,
    selectorFn: (state: TState) => TResult
  ): (state: TState) => TResult {
    this.selectors[name] = selectorFn;
    return selectorFn;
  }
} 