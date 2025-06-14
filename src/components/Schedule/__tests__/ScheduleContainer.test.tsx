import React from 'react';
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';

// Mock the TodoContext module FIRST before any imports
const mockUseTodoContext = jest.fn();
jest.mock('../../../contexts/TodoContext', () => ({
  useTodoContext: mockUseTodoContext,
  TodoProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the TaskList component to avoid any nested context issues
jest.mock('../TaskList', () => ({
  TaskList: ({ tasks }: { tasks: any[] }) => (
    <div data-testid="task-list">
      {tasks.map((task) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          <div>{task.title}</div>
          <div>{task.description}</div>
        </div>
      ))}
    </div>
  ),
}));

// Now import the component after mocks are set up
import { ScheduleContainer } from '../ScheduleContainer';

describe('ScheduleContainer', () => {
  const testDate = new Date(2024, 2, 15); // March 15, 2024 (month is 0-indexed)
  // Calculate the expected formatted date the same way the component does
  const dayKey = testDate.toISOString().slice(0, 10); // This gives us the ISO date string
  const expectedFormattedDate = format(new Date(dayKey), 'MMMM d, yyyy');
  
  const mockState = {
    selectedDate: testDate,
    yearSchedule: {
      year: 2024,
      monthSchedules: new Map([
        ['2024-03', {
          date: '2024-03',
          daySchedules: new Map([
            ['2024-03-15', {
              date: '2024-03-15',
              todoItems: [
                {
                  id: '1',
                  title: 'Test Task 1',
                  description: 'Test Description 1',
                  pointValue: 5,
                  isCompleted: false,
                  createdAt: new Date(2024, 2, 15),
                },
                {
                  id: '2',
                  title: 'Test Task 2',
                  description: 'Test Description 2',
                  pointValue: 10,
                  isCompleted: true,
                  createdAt: new Date(2024, 2, 15),
                  completedAt: new Date(2024, 2, 15),
                },
              ],
              totalPointValue: 15,
              totalCompletedPointValue: 10,
              completedTodoItems: [],
              incompleteTodoItems: [],
            }],
          ]),
          totalMonthPoints: 15,
          totalCompletedMonthPoints: 10,
        }],
      ]),
      totalYearPoints: 15,
      totalCompletedYearPoints: 10,
    },
    isLoading: false,
    error: null,
    currentYear: 2024,
    isDateSelectorOpen: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTodoContext.mockReturnValue({
      state: mockState,
      completeTodo: jest.fn(),
      addTodo: jest.fn(),
      setSelectedDate: jest.fn(),
      loadYearData: jest.fn(),
    });
  });

  it('renders the schedule header with correct date and task count', () => {
    render(<ScheduleContainer />);

    expect(screen.getByText(expectedFormattedDate)).toBeInTheDocument();
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
  });

  it('shows points summary', () => {
    render(<ScheduleContainer />);

    expect(screen.getByText('10 / 15 points completed')).toBeInTheDocument();
  });

  it('renders task list with correct items', () => {
    render(<ScheduleContainer />);

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description 2')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseTodoContext.mockReturnValue({
      state: {
        ...mockState,
        isLoading: true,
      },
      completeTodo: jest.fn(),
      addTodo: jest.fn(),
      setSelectedDate: jest.fn(),
      loadYearData: jest.fn(),
    });

    render(<ScheduleContainer />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseTodoContext.mockReturnValue({
      state: {
        ...mockState,
        error: 'Failed to load schedule',
      },
      completeTodo: jest.fn(),
      addTodo: jest.fn(),
      setSelectedDate: jest.fn(),
      loadYearData: jest.fn(),
    });

    render(<ScheduleContainer />);

    expect(screen.getByText('Error Loading Schedule')).toBeInTheDocument();
    expect(screen.getByText('Failed to load schedule')).toBeInTheDocument();
  });

  it('displays empty state when no tasks are available', () => {
    mockUseTodoContext.mockReturnValue({
      state: {
        ...mockState,
        yearSchedule: {
          ...mockState.yearSchedule,
          monthSchedules: new Map([
            ['2024-03', {
              date: '2024-03',
              daySchedules: new Map([
                ['2024-03-15', {
                  date: '2024-03-15',
                  todoItems: [],
                  totalPointValue: 0,
                  totalCompletedPointValue: 0,
                  completedTodoItems: [],
                  incompleteTodoItems: [],
                }],
              ]),
              totalMonthPoints: 0,
              totalCompletedMonthPoints: 0,
            }],
          ]),
          totalYearPoints: 0,
          totalCompletedYearPoints: 0,
        },
      },
      completeTodo: jest.fn(),
      addTodo: jest.fn(),
      setSelectedDate: jest.fn(),
      loadYearData: jest.fn(),
    });

    render(<ScheduleContainer />);

    expect(screen.getByText('No tasks for this day')).toBeInTheDocument();
    expect(screen.getByText('Add a task to get started with your schedule')).toBeInTheDocument();
  });
}); 