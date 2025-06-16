import { useCallback } from 'react';
import { useStateManagement } from './useStateManagement';

export interface DateNavigationHook {
  selectedDate: Date;
  currentYear: number;
  setSelectedDate: (date: Date) => void;
  setCurrentYear: (year: number) => void;
  navigateToToday: () => void;
  navigateToDate: (year: number, month: number, day: number) => void;
  getDateString: () => string;
  getMonthString: () => string;
  getYearString: () => string;
}

export function useDateNavigation(): DateNavigationHook {
  const { state, dispatch } = useStateManagement();

  const setSelectedDate = useCallback((date: Date) => {
    dispatch({
      type: 'TODO_SET_SELECTED_DATE',
      payload: { date }
    });
  }, [dispatch]);

  const setCurrentYear = useCallback((year: number) => {
    dispatch({
      type: 'TODO_LOAD_YEAR_STARTED',
      payload: { year }
    });
  }, [dispatch]);

  const navigateToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
  }, [setSelectedDate]);

  const navigateToDate = useCallback((year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    setSelectedDate(date);
  }, [setSelectedDate]);

  const getDateString = useCallback(() => {
    return state.todo.selectedDate.toISOString().slice(0, 10);
  }, [state.todo.selectedDate]);

  const getMonthString = useCallback(() => {
    return state.todo.selectedDate.toISOString().slice(0, 7);
  }, [state.todo.selectedDate]);

  const getYearString = useCallback(() => {
    return state.todo.currentYear.toString();
  }, [state.todo.currentYear]);

  return {
    selectedDate: state.todo.selectedDate,
    currentYear: state.todo.currentYear,
    setSelectedDate,
    setCurrentYear,
    navigateToToday,
    navigateToDate,
    getDateString,
    getMonthString,
    getYearString
  };
} 