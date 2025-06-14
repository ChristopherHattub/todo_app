import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from '../TaskList';
import { TodoProvider } from '../../../contexts/TodoContext';

// Mock the TodoContext
jest.mock('../../../contexts/TodoContext', () => ({
  ...jest.requireActual('../../../contexts/TodoContext'),
  useTodoContext: () => ({
    completeTodo: jest.fn(),
  }),
}));

describe('TaskList', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Test Description 1',
      pointValue: 5,
      isCompleted: false,
      createdAt: new Date('2024-03-19'),
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Test Description 2',
      pointValue: 10,
      isCompleted: true,
      createdAt: new Date('2024-03-19'),
      completedAt: new Date('2024-03-19'),
    },
  ];

  it('renders task list with correct items', () => {
    render(
      <TodoProvider>
        <TaskList tasks={mockTasks} />
      </TodoProvider>
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description 2')).toBeInTheDocument();
  });

  it('displays empty state when no tasks are provided', () => {
    render(
      <TodoProvider>
        <TaskList tasks={[]} />
      </TodoProvider>
    );

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('calls completeTodo when task is clicked', () => {
    const mockCompleteTodo = jest.fn();
    jest.spyOn(require('../../../contexts/TodoContext'), 'useTodoContext').mockImplementation(() => ({
      completeTodo: mockCompleteTodo,
    }));

    render(
      <TodoProvider>
        <TaskList tasks={mockTasks} />
      </TodoProvider>
    );

    const completeButton = screen.getAllByRole('button', { name: /mark as complete/i })[0];
    fireEvent.click(completeButton);

    expect(mockCompleteTodo).toHaveBeenCalledWith('1');
  });

  it('displays correct point value badges', () => {
    render(
      <TodoProvider>
        <TaskList tasks={mockTasks} />
      </TodoProvider>
    );

    const pointBadges = screen.getAllByText(/points$/);
    expect(pointBadges[0]).toHaveTextContent('5 points');
    expect(pointBadges[1]).toHaveTextContent('10 points');
  });

  it('applies correct styling for completed tasks', () => {
    render(
      <TodoProvider>
        <TaskList tasks={mockTasks} />
      </TodoProvider>
    );

    const completedTask = screen.getByText('Test Task 2').closest('.task-item');
    const completedTaskContent = screen.getByText('Test Task 2').closest('.flex-1');
    
    expect(completedTask).toHaveClass('bg-gray-50');
    expect(completedTaskContent).toHaveClass('line-through');
    expect(completedTaskContent).toHaveClass('text-gray-500');
  });
}); 