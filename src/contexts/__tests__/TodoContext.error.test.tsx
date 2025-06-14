import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock TodoService before importing the context
jest.mock('../../services/TodoService', () => {
  const mockTodoService = {
    createTodo: jest.fn().mockRejectedValue(new Error('Test error')),
    completeTodo: jest.fn(),
    getYearSchedule: jest.fn(),
  };
  return {
    TodoService: {
      getInstance: jest.fn().mockReturnValue(mockTodoService),
    },
  };
});

import { TodoProvider, useTodoContext } from '../TodoContext';

describe('TodoContext error handling', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TodoProvider>{children}</TodoProvider>
  );

  it('should handle errors', async () => {
    const { result } = renderHook(() => useTodoContext(), { wrapper });

    await act(async () => {
      await result.current.addTodo({
        title: 'Error Todo',
        description: 'Error Description',
        pointValue: 10,
        isCompleted: false,
      });
    });

    await waitFor(() => {
      expect(result.current.state.error).toBe('Test error');
    });
  });
}); 