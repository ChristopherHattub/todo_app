import { BaseStateSlice, SliceAction } from '../core/StateSlice';

export interface UIState {
  isLoading: boolean;
  globalError: string | null;
  notifications: Notification[];
  modals: {
    isDateSelectorOpen: boolean;
    isSettingsOpen: boolean;
    isConfirmDeleteOpen: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
  duration?: number;
}

export type UIActions =
  | SliceAction<'UI_SET_LOADING', { isLoading: boolean }>
  | SliceAction<'UI_SET_GLOBAL_ERROR', { error: string | null }>
  | SliceAction<'UI_ADD_NOTIFICATION', { notification: Omit<Notification, 'id' | 'timestamp'> }>
  | SliceAction<'UI_REMOVE_NOTIFICATION', { id: string }>
  | SliceAction<'UI_CLEAR_NOTIFICATIONS'>
  | SliceAction<'UI_SET_MODAL', { modal: keyof UIState['modals']; isOpen: boolean }>
  | SliceAction<'UI_SET_THEME', { theme: 'light' | 'dark' | 'auto' }>
  | SliceAction<'UI_TOGGLE_SIDEBAR'>;

export class UISlice extends BaseStateSlice<UIState, UIActions> {
  readonly name = 'ui';

  readonly initialState: UIState = {
    isLoading: false,
    globalError: null,
    notifications: [],
    modals: {
      isDateSelectorOpen: false,
      isSettingsOpen: false,
      isConfirmDeleteOpen: false
    },
    theme: 'auto',
    sidebarCollapsed: false
  };

  actions = {
    setLoading: this.createAction<'UI_SET_LOADING', { isLoading: boolean }>('UI_SET_LOADING'),
    setGlobalError: this.createAction<'UI_SET_GLOBAL_ERROR', { error: string | null }>('UI_SET_GLOBAL_ERROR'),
    addNotification: this.createAction<'UI_ADD_NOTIFICATION', { notification: Omit<Notification, 'id' | 'timestamp'> }>('UI_ADD_NOTIFICATION'),
    removeNotification: this.createAction<'UI_REMOVE_NOTIFICATION', { id: string }>('UI_REMOVE_NOTIFICATION'),
    clearNotifications: this.createAction<'UI_CLEAR_NOTIFICATIONS'>('UI_CLEAR_NOTIFICATIONS'),
    setModal: this.createAction<'UI_SET_MODAL', { modal: keyof UIState['modals']; isOpen: boolean }>('UI_SET_MODAL'),
    setTheme: this.createAction<'UI_SET_THEME', { theme: 'light' | 'dark' | 'auto' }>('UI_SET_THEME'),
    toggleSidebar: this.createAction<'UI_TOGGLE_SIDEBAR'>('UI_TOGGLE_SIDEBAR')
  };

  selectors = {
    getIsLoading: this.createSelector('getIsLoading', (state: UIState): boolean => state.isLoading),
    getGlobalError: this.createSelector('getGlobalError', (state: UIState): string | null => state.globalError),
    getNotifications: this.createSelector('getNotifications', (state: UIState): Notification[] => state.notifications),
    getModals: this.createSelector('getModals', (state: UIState): UIState['modals'] => state.modals),
    getTheme: this.createSelector('getTheme', (state: UIState): 'light' | 'dark' | 'auto' => state.theme),
    getSidebarCollapsed: this.createSelector('getSidebarCollapsed', (state: UIState): boolean => state.sidebarCollapsed),
    
    getActiveNotifications: this.createSelector('getActiveNotifications', (state: UIState): Notification[] => {
      return state.notifications.filter(notification => {
        if (!notification.autoHide) return true;
        const now = new Date();
        const elapsed = now.getTime() - notification.timestamp.getTime();
        return elapsed < (notification.duration || 5000);
      });
    }),
    
    getModalState: this.createSelector('getModalState', (state: UIState) => (modal: keyof UIState['modals']): boolean => {
      return state.modals[modal];
    })
  };

  reducer(state: UIState, action: UIActions): UIState {
    switch (action.type) {
      case 'UI_SET_LOADING':
        return {
          ...state,
          isLoading: action.payload!.isLoading
        };

      case 'UI_SET_GLOBAL_ERROR':
        return {
          ...state,
          globalError: action.payload!.error
        };

      case 'UI_ADD_NOTIFICATION': {
        const notification: Notification = {
          ...action.payload!.notification,
          id: `notification-${Date.now()}-${Math.random()}`,
          timestamp: new Date()
        };
        
        return {
          ...state,
          notifications: [...state.notifications, notification]
        };
      }

      case 'UI_REMOVE_NOTIFICATION':
        return {
          ...state,
          notifications: state.notifications.filter(n => n.id !== action.payload!.id)
        };

      case 'UI_CLEAR_NOTIFICATIONS':
        return {
          ...state,
          notifications: []
        };

      case 'UI_SET_MODAL': {
        const { modal, isOpen } = action.payload!;
        return {
          ...state,
          modals: {
            ...state.modals,
            [modal]: isOpen
          }
        };
      }

      case 'UI_SET_THEME':
        return {
          ...state,
          theme: action.payload!.theme
        };

      case 'UI_TOGGLE_SIDEBAR':
        return {
          ...state,
          sidebarCollapsed: !state.sidebarCollapsed
        };

      default:
        return state;
    }
  }
} 