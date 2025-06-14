import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// State interface
interface DateState {
  currentDate: Date;
  selectedDate: Date;
  currentMonth: Date;
  isDateSelectorOpen: boolean;
}

// Action types
export enum DateActionType {
  SET_SELECTED_DATE = 'SET_SELECTED_DATE',
  SET_CURRENT_MONTH = 'SET_CURRENT_MONTH',
  TOGGLE_DATE_SELECTOR = 'TOGGLE_DATE_SELECTOR',
  CLOSE_DATE_SELECTOR = 'CLOSE_DATE_SELECTOR',
}

// Action interfaces
interface SetSelectedDateAction {
  type: DateActionType.SET_SELECTED_DATE;
  payload: Date;
}

interface SetCurrentMonthAction {
  type: DateActionType.SET_CURRENT_MONTH;
  payload: Date;
}

interface ToggleDateSelectorAction {
  type: DateActionType.TOGGLE_DATE_SELECTOR;
}

interface CloseDateSelectorAction {
  type: DateActionType.CLOSE_DATE_SELECTOR;
}

type DateAction =
  | SetSelectedDateAction
  | SetCurrentMonthAction
  | ToggleDateSelectorAction
  | CloseDateSelectorAction;

// Initial state
const today = new Date();
const initialState: DateState = {
  currentDate: today,
  selectedDate: today,
  currentMonth: new Date(today.getFullYear(), today.getMonth(), 1),
  isDateSelectorOpen: false,
};

// Reducer
function dateReducer(state: DateState, action: DateAction): DateState {
  switch (action.type) {
    case DateActionType.SET_SELECTED_DATE:
      return {
        ...state,
        selectedDate: action.payload,
        currentMonth: new Date(action.payload.getFullYear(), action.payload.getMonth(), 1),
        isDateSelectorOpen: false,
      };
    case DateActionType.SET_CURRENT_MONTH:
      return {
        ...state,
        currentMonth: new Date(action.payload.getFullYear(), action.payload.getMonth(), 1),
      };
    case DateActionType.TOGGLE_DATE_SELECTOR:
      return {
        ...state,
        isDateSelectorOpen: !state.isDateSelectorOpen,
      };
    case DateActionType.CLOSE_DATE_SELECTOR:
      return {
        ...state,
        isDateSelectorOpen: false,
      };
    default:
      return state;
  }
}

// Context type
interface DateContextType {
  state: DateState;
  setSelectedDate: (date: Date) => void;
  navigateToMonth: (date: Date) => void;
  openDateSelector: () => void;
  closeDateSelector: () => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

// Provider
export const DateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dateReducer, initialState);

  const setSelectedDate = (date: Date) => {
    dispatch({ type: DateActionType.SET_SELECTED_DATE, payload: date });
  };

  const navigateToMonth = (date: Date) => {
    dispatch({ type: DateActionType.SET_CURRENT_MONTH, payload: date });
  };

  const openDateSelector = () => {
    dispatch({ type: DateActionType.TOGGLE_DATE_SELECTOR });
  };

  const closeDateSelector = () => {
    dispatch({ type: DateActionType.CLOSE_DATE_SELECTOR });
  };

  return (
    <DateContext.Provider
      value={{
        state,
        setSelectedDate,
        navigateToMonth,
        openDateSelector,
        closeDateSelector,
      }}
    >
      {children}
    </DateContext.Provider>
  );
};

// Custom hook
export const useDateContext = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDateContext must be used within a DateProvider');
  }
  return context;
}; 