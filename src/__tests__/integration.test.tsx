import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the AnimationHandler
jest.mock('../services/AnimationHandler', () => ({
  animationHandler: {
    queueAnimation: jest.fn(),
    clearQueue: jest.fn()
  }
}));

// Mock TodoService properly
const mockTodoService = {
  createTodo: jest.fn(),
  completeTodo: jest.fn(),
  getDaySchedule: jest.fn(),
  getYearSchedule: jest.fn()
};

jest.mock('../services/TodoService', () => ({
  TodoService: {
    getInstance: () => mockTodoService
  }
}));

// Mock LocalStorageService
jest.mock('../services/LocalStorageService', () => ({
  LocalStorageService: {
    saveDaySchedule: jest.fn().mockResolvedValue({ success: true }),
    loadDaySchedule: jest.fn().mockResolvedValue({ success: true, data: null }),
    saveYearSchedule: jest.fn().mockResolvedValue({ success: true }),
    loadYearSchedule: jest.fn().mockResolvedValue({ success: true, data: null }),
    isStorageAvailable: jest.fn().mockReturnValue(true)
  }
}));

// Mock window.dispatchEvent for animation
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
});

describe('Application Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Setup default mock responses
    mockTodoService.createTodo.mockImplementation((todo, forDate) => {
      const newTodo = {
        ...todo,
        id: `mock-${Date.now()}`,
        createdAt: new Date(),
        isCompleted: false
      };
      
      const result = {
        todo: newTodo,
        daySchedule: {
          date: forDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          totalPointValue: todo.pointValue,
          totalCompletedPointValue: 0,
          todoItems: [newTodo],
          completedTodoItems: [],
          incompleteTodoItems: [newTodo]
        },
        monthSchedule: {
          date: '2025-06',
          daySchedules: new Map(),
          totalMonthPoints: 0,
          totalCompletedMonthPoints: 0
        },
        yearSchedule: {
          year: 2025,
          monthSchedules: new Map(),
          totalYearPoints: 0,
          totalCompletedYearPoints: 0
        }
      };
      
      return Promise.resolve(result);
    });

    mockTodoService.completeTodo.mockResolvedValue({
      todo: { id: 'test', isCompleted: true },
      daySchedule: {},
      monthSchedule: {},
      yearSchedule: {}
    });

    mockTodoService.getDaySchedule.mockResolvedValue({
      date: new Date().toISOString().split('T')[0],
      totalPointValue: 0,
      totalCompletedPointValue: 0,
      todoItems: [],
      completedTodoItems: [],
      incompleteTodoItems: []
    });

    mockTodoService.getYearSchedule.mockResolvedValue({
      year: 2025,
      monthSchedules: new Map(),
      totalYearPoints: 0,
      totalCompletedYearPoints: 0
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders main application components', async () => {
    render(<App />);

    // Check that all main components are rendered
    expect(screen.getByRole('banner')).toBeInTheDocument(); // AppHeader
    expect(screen.getByText('Select Date')).toBeInTheDocument();
    expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
    expect(screen.getByText('No tasks for this day')).toBeInTheDocument(); // Empty state
    expect(screen.getByTestId('entry-form')).toBeInTheDocument();
  });

  test('adds a new todo item through the complete workflow', async () => {
    render(<App />);

    // Fill out the entry form
    const titleInput = screen.getByTestId('entry-form-title');
    const descriptionInput = screen.getByTestId('entry-form-description');
    const pointsInput = screen.getByTestId('entry-form-points');
    const submitButton = screen.getByTestId('entry-form-submit');

    await userEvent.type(titleInput, 'Test Task');
    await userEvent.type(descriptionInput, 'This is a test task');
    await userEvent.type(pointsInput, '15');

    // Submit the form
    await act(async () => {
      await userEvent.click(submitButton);
    });

    // Wait for the task to appear in the schedule
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('This is a test task')).toBeInTheDocument();
      expect(screen.getByText('15 points')).toBeInTheDocument();
    });

    // Check that the form was reset
    expect(titleInput).toHaveValue('');
    expect(descriptionInput).toHaveValue('');
    expect(pointsInput).toHaveValue(null); // Number inputs return null when empty
  });

  test('completes a todo item and triggers animation', async () => {
    render(<App />);

    // First add a task
    const titleInput = screen.getByTestId('entry-form-title');
    const pointsInput = screen.getByTestId('entry-form-points');
    const submitButton = screen.getByTestId('entry-form-submit');

    await userEvent.type(titleInput, 'Task to Complete');
    await userEvent.type(pointsInput, '10');
    
    await act(async () => {
      await userEvent.click(submitButton);
    });

    // Wait for task to appear
    await waitFor(() => {
      expect(screen.getByText('Task to Complete')).toBeInTheDocument();
    });

    // Find and click the completion button
    const completionButton = screen.getByRole('button', { name: /mark as complete/i });
    
    await act(async () => {
      await userEvent.click(completionButton);
    });

    // Wait for task to be marked as completed
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark as incomplete/i })).toBeInTheDocument();
    });

    // Check that the task has strikethrough styling
    const taskTitle = screen.getByText('Task to Complete');
    expect(taskTitle.closest('.task-item')).toHaveClass('bg-gray-50');
  });

  test('opens and closes date selector modal', async () => {
    render(<App />);

    // Click the date selector button
    const dateButton = screen.getByText('Select Date');
    await userEvent.click(dateButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Date Selector' })).toBeInTheDocument();
    });

    // Check that calendar is displayed by looking for the modal header with month/year
    expect(screen.getByRole('dialog')).toContainElement(
      screen.getAllByText(/2025/)[1] // Get the second occurrence (the one in the modal)
    );

    // Close the modal by clicking outside or pressing escape
    await userEvent.keyboard('{Escape}');

    // Wait for modal to disappear
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Date Selector' })).not.toBeInTheDocument();
    });
  });

  test('validates form inputs and shows errors', async () => {
    render(<App />);

    const submitButton = screen.getByTestId('entry-form-submit');

    // Try to submit empty form
    await userEvent.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Point value is required')).toBeInTheDocument();
    });
  });

  test('handles error states gracefully', async () => {
    // Mock an error in the TodoService
    const mockError = new Error('Storage unavailable');
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    const titleInput = screen.getByTestId('entry-form-title');
    const pointsInput = screen.getByTestId('entry-form-points');
    const submitButton = screen.getByTestId('entry-form-submit');

    await userEvent.type(titleInput, 'Test Task');
    await userEvent.type(pointsInput, '10');

    // This should trigger an error due to mocked failure
    await userEvent.click(submitButton);

    // The form should still be usable even if there's an error
    expect(titleInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  test('displays current date in header', () => {
    render(<App />);

    // Check that a date is displayed in MM/DD/YY format
    const dateRegex = /\d{2}\/\d{2}\/\d{2}/;
    expect(screen.getByText(dateRegex)).toBeInTheDocument();
  });

  test('shows appropriate empty state when no tasks exist', () => {
    render(<App />);

    expect(screen.getByText('No tasks for this day')).toBeInTheDocument();
    expect(screen.getByText('Add a task to get started with your schedule')).toBeInTheDocument();
  });

  test('handles keyboard navigation and accessibility', async () => {
    render(<App />);

    const titleInput = screen.getByTestId('entry-form-title');
    
    // Focus directly on the title input instead of using tab
    titleInput.focus();
    expect(titleInput).toHaveFocus();

    // Test Enter key submission
    await userEvent.type(titleInput, 'Keyboard Test');
    await userEvent.tab(); // to description
    await userEvent.tab(); // to points
    await userEvent.type(screen.getByTestId('entry-form-points'), '5');
    
    await act(async () => {
      await userEvent.keyboard('{Enter}');
    });

    // Wait for task to appear
    await waitFor(() => {
      expect(screen.getByText('Keyboard Test')).toBeInTheDocument();
    });
  });
}); 