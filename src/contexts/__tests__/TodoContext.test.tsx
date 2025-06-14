import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { TodoProvider, useTodoContext, TodoActionType } from '../TodoContext';
import { TodoItem } from '../../types';

// Mock the TodoService
jest.mock('../../services/TodoService', () => {
  const mockTodoService = {
    createTodo: jest.fn().mockResolvedValue({
      todo: {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 10,
        isCompleted: false,
        createdAt: new Date('2024-01-01')
      }
    }),
    completeTodo: jest.fn().mockResolvedValue({}),
    getYearSchedule: jest.fn().mockResolvedValue({
      year: 2024,
      monthSchedules: new Map(),
      totalYearPoints: 0,
      totalCompletedYearPoints: 0
    })
  };

  return {
    TodoService: {
      getInstance: jest.fn().mockReturnValue(mockTodoService)
    }
  };
});

describe('TodoContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TodoProvider>{children}</TodoProvider>
  );

  it('should provide initial state', () => {
    const { result } = renderHook(() => useTodoContext(), { wrapper });
    
    expect(result.current.state.yearSchedule).toBeDefined();
    expect(result.current.state.selectedDate).toBeInstanceOf(Date);
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it('should add a todo', async () => {
    const { result } = renderHook(() => useTodoContext(), { wrapper });
    
    const newTodo: Omit<TodoItem, 'id' | 'createdAt'> = {
      title: 'New Todo',
      description: 'New Description',
      pointValue: 20,
      isCompleted: false
    };

    await act(async () => {
      await result.current.addTodo(newTodo);
    });

    expect(result.current.state.yearSchedule).toBeDefined();
    expect(result.current.state.error).toBeNull();
  });

  it('should complete a todo', async () => {
    const { result } = renderHook(() => useTodoContext(), { wrapper });
    
    await act(async () => {
      await result.current.completeTodo('1');
    });

    expect(result.current.state.error).toBeNull();
  });

  it('should set selected date', () => {
    const { result } = renderHook(() => useTodoContext(), { wrapper });
    const newDate = new Date('2024-01-02');
    
    act(() => {
      result.current.setSelectedDate(newDate);
    });

    expect(result.current.state.selectedDate).toEqual(newDate);
  });

  it('should load year data', async () => {
    const { result } = renderHook(() => useTodoContext(), { wrapper });
    
    await act(async () => {
      await result.current.loadYearData(2024);
    });

    expect(result.current.state.yearSchedule.year).toBe(2024);
    expect(result.current.state.error).toBeNull();
  });
}); 