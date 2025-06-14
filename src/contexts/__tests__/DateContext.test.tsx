import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { DateProvider, useDateContext, DateActionType } from '../DateContext';

describe('DateContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DateProvider>{children}</DateProvider>
  );

  it('should provide initial state', () => {
    const { result } = renderHook(() => useDateContext(), { wrapper });
    expect(result.current.state.currentDate).toBeInstanceOf(Date);
    expect(result.current.state.selectedDate).toBeInstanceOf(Date);
    expect(result.current.state.currentMonth).toBeInstanceOf(Date);
    expect(result.current.state.isDateSelectorOpen).toBe(false);
  });

  it('should set selected date and update current month', () => {
    const { result } = renderHook(() => useDateContext(), { wrapper });
    const newDate = new Date(2024, 5, 15);
    act(() => {
      result.current.setSelectedDate(newDate);
    });
    expect(result.current.state.selectedDate).toEqual(newDate);
    expect(result.current.state.currentMonth.getFullYear()).toBe(2024);
    expect(result.current.state.currentMonth.getMonth()).toBe(5);
    expect(result.current.state.isDateSelectorOpen).toBe(false);
  });

  it('should navigate to a different month', () => {
    const { result } = renderHook(() => useDateContext(), { wrapper });
    const newMonth = new Date(2025, 2, 1);
    act(() => {
      result.current.navigateToMonth(newMonth);
    });
    expect(result.current.state.currentMonth.getFullYear()).toBe(2025);
    expect(result.current.state.currentMonth.getMonth()).toBe(2);
  });

  it('should open and close the date selector', () => {
    const { result } = renderHook(() => useDateContext(), { wrapper });
    act(() => {
      result.current.openDateSelector();
    });
    expect(result.current.state.isDateSelectorOpen).toBe(true);
    act(() => {
      result.current.closeDateSelector();
    });
    expect(result.current.state.isDateSelectorOpen).toBe(false);
  });

  it('should toggle the date selector', () => {
    const { result } = renderHook(() => useDateContext(), { wrapper });
    act(() => {
      result.current.openDateSelector();
    });
    expect(result.current.state.isDateSelectorOpen).toBe(true);
    act(() => {
      result.current.openDateSelector();
    });
    expect(result.current.state.isDateSelectorOpen).toBe(false);
  });
}); 