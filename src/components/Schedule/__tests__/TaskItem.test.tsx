import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TaskItem } from '../TaskItem';
import { TodoItem } from '../../../types';

describe('TaskItem', () => {
  const baseTodo: TodoItem = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    pointValue: 10,
    isCompleted: false,
    createdAt: new Date('2024-01-01'),
  };

  it('renders all todo properties', () => {
    const { getByTestId } = render(
      <TaskItem todo={baseTodo} onToggleComplete={jest.fn()} />
    );
    expect(getByTestId('taskitem-title').textContent).toBe('Test Task');
    expect(getByTestId('taskitem-desc').textContent).toBe('Test Description');
    expect(getByTestId('taskitem-badge').textContent).toBe('10');
  });

  it('applies point color coding', () => {
    const greenTodo = { ...baseTodo, pointValue: 3 };
    const blueTodo = { ...baseTodo, pointValue: 10 };
    const purpleTodo = { ...baseTodo, pointValue: 25 };
    const orangeTodo = { ...baseTodo, pointValue: 40 };
    const { getByTestId, rerender } = render(
      <TaskItem todo={greenTodo} onToggleComplete={jest.fn()} />
    );
    expect(getByTestId('taskitem-badge').className).toContain('green');
    rerender(<TaskItem todo={blueTodo} onToggleComplete={jest.fn()} />);
    expect(getByTestId('taskitem-badge').className).toContain('blue');
    rerender(<TaskItem todo={purpleTodo} onToggleComplete={jest.fn()} />);
    expect(getByTestId('taskitem-badge').className).toContain('purple');
    rerender(<TaskItem todo={orangeTodo} onToggleComplete={jest.fn()} />);
    expect(getByTestId('taskitem-badge').className).toContain('orange');
  });

  it('applies completion state styling', () => {
    const completedTodo = { ...baseTodo, isCompleted: true };
    const { getByTestId, container } = render(
      <TaskItem todo={completedTodo} onToggleComplete={jest.fn()} />
    );
    expect(getByTestId('taskitem-title').className).toContain('completed');
    expect(getByTestId('taskitem-desc').className).toContain('completed');
    expect(container.firstChild).toHaveClass('taskitem--completed');
    expect(getByTestId('taskitem-toggle').className).toContain('taskitem-toggle--completed');
  });

  it('calls onToggleComplete when toggle is clicked', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <TaskItem todo={baseTodo} onToggleComplete={onToggle} />
    );
    fireEvent.click(getByTestId('taskitem-toggle'));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('calls onToggleComplete on Enter/Space key', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <TaskItem todo={baseTodo} onToggleComplete={onToggle} />
    );
    fireEvent.keyDown(getByTestId('taskitem-container'), { key: 'Enter' });
    fireEvent.keyDown(getByTestId('taskitem-container'), { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('has proper accessibility attributes', () => {
    const { getByTestId } = render(
      <TaskItem todo={baseTodo} onToggleComplete={jest.fn()} />
    );
    const container = getByTestId('taskitem-container');
    expect(container.getAttribute('role')).toBe('listitem');
    expect(container.getAttribute('aria-label')).toContain('Task: Test Task');
    const toggle = getByTestId('taskitem-toggle');
    expect(toggle.getAttribute('aria-label')).toBe('Mark as complete');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders memoized component', () => {
    const { rerender, getByTestId } = render(
      <TaskItem todo={baseTodo} onToggleComplete={jest.fn()} />
    );
    const firstRender = getByTestId('taskitem-title');
    rerender(<TaskItem todo={baseTodo} onToggleComplete={jest.fn()} />);
    const secondRender = getByTestId('taskitem-title');
    expect(firstRender).toBe(secondRender);
  });
}); 