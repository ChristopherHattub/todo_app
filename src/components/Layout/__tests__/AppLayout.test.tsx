import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppLayout } from '../AppLayout';
import { TodoProvider } from '../../../contexts/TodoContext';

// Mock all the child components
jest.mock('../../ProgressAnimation/ProgressAnimationContainer', () => {
  return function MockProgressAnimationContainer() {
    return <div data-testid="progress-animation">Progress Animation</div>;
  };
});

jest.mock('../AppHeader', () => ({
  AppHeader: ({ onDateSelectorClick }: { onDateSelectorClick: () => void }) => (
    <div data-testid="app-header">
      <button onClick={onDateSelectorClick} data-testid="date-selector-trigger">
        Open Date Selector
      </button>
    </div>
  ),
}));

jest.mock('../ScheduleContainer', () => ({
  ScheduleContainer: () => <div data-testid="schedule-container">Schedule Container</div>,
}));

jest.mock('../../DateSelector/DateSelectorModal', () => ({
  DateSelectorModal: ({ 
    isOpen, 
    onClose, 
    onDateSelect 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onDateSelect: (date: Date) => void; 
  }) => (
    isOpen ? (
      <div data-testid="date-selector-modal">
        <button onClick={onClose} data-testid="modal-close">Close</button>
        <button 
          onClick={() => onDateSelect(new Date('2024-12-25'))} 
          data-testid="select-date"
        >
          Select Date
        </button>
      </div>
    ) : null
  ),
}));

jest.mock('../../EntryForm/EntryForm', () => ({
  EntryForm: ({ onSubmit }: { onSubmit: (data: any) => void }) => (
    <div data-testid="entry-form">
      <button 
        onClick={() => onSubmit({ title: 'Test Task', description: 'Test', pointValue: '10' })}
        data-testid="form-submit"
      >
        Submit Form
      </button>
    </div>
  ),
}));

// Mock the context
const mockAddTodo = jest.fn();
const mockSetSelectedDate = jest.fn();

jest.mock('../../../contexts/TodoContext', () => ({
  ...jest.requireActual('../../../contexts/TodoContext'),
  useTodoContext: () => ({
    state: {
      selectedDate: new Date('2024-03-20'),
    },
    addTodo: mockAddTodo,
    setSelectedDate: mockSetSelectedDate,
  }),
  TodoProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AppLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all main layout sections', () => {
    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('progress-animation')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-container')).toBeInTheDocument();
    expect(screen.getByTestId('entry-form')).toBeInTheDocument();
  });

  it('has correct semantic HTML structure', () => {
    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Check for semantic elements
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    
    // Check for proper sections
    const animationSection = screen.getByTestId('progress-animation').closest('section');
    const contentSection = screen.getByTestId('schedule-container').closest('section');
    
    expect(animationSection).toHaveClass('animation-section');
    expect(contentSection).toHaveClass('content-section');
  });

  it('opens date selector modal when triggered', () => {
    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Initially modal should not be visible
    expect(screen.queryByTestId('date-selector-modal')).not.toBeInTheDocument();

    // Click to open modal
    fireEvent.click(screen.getByTestId('date-selector-trigger'));

    // Modal should now be visible
    expect(screen.getByTestId('date-selector-modal')).toBeInTheDocument();
  });

  it('closes date selector modal when close is triggered', () => {
    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Open modal
    fireEvent.click(screen.getByTestId('date-selector-trigger'));
    expect(screen.getByTestId('date-selector-modal')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('date-selector-modal')).not.toBeInTheDocument();
  });

  it('handles date selection and closes modal', () => {
    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Open modal
    fireEvent.click(screen.getByTestId('date-selector-trigger'));
    
    // Select a date
    fireEvent.click(screen.getByTestId('select-date'));

    // Check that setSelectedDate was called with the correct date
    expect(mockSetSelectedDate).toHaveBeenCalledWith(new Date('2024-12-25'));
    
    // Modal should be closed
    expect(screen.queryByTestId('date-selector-modal')).not.toBeInTheDocument();
  });

  it('handles form submission and adds todo', async () => {
    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Submit form
    fireEvent.click(screen.getByTestId('form-submit'));

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test',
        pointValue: 10,
        isCompleted: false,
      });
    });
  });

  it('wraps components with error boundaries', () => {
    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Each section should be wrapped with ErrorBoundary
    // We can't directly test ErrorBoundary wrapping without triggering errors,
    // but we can verify the components render within their expected containers
    
    const mainElement = screen.getByRole('main');
    const animationSection = screen.getByTestId('progress-animation').closest('section');
    const contentSection = screen.getByTestId('schedule-container').closest('section');
    const footer = screen.getByRole('contentinfo');

    expect(mainElement).toContainElement(animationSection);
    expect(mainElement).toContainElement(contentSection);
    expect(footer).toContainElement(screen.getByTestId('entry-form'));
  });

  it('has correct CSS classes applied', () => {
    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    const layout = screen.getByTestId('app-header').closest('.app-layout');
    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');

    expect(layout).toHaveClass('app-layout');
    expect(main).toHaveClass('app-main');
    expect(footer).toHaveClass('app-footer');
  });

  it('maintains modal state across re-renders', () => {
    const { rerender } = render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Open modal
    fireEvent.click(screen.getByTestId('date-selector-trigger'));
    expect(screen.getByTestId('date-selector-modal')).toBeInTheDocument();

    // Re-render
    rerender(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Modal should still be open
    expect(screen.getByTestId('date-selector-modal')).toBeInTheDocument();
  });

  it('handles async form submission errors gracefully', async () => {
    mockAddTodo.mockRejectedValue(new Error('Failed to add todo'));

    render(
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    );

    // Submit form
    fireEvent.click(screen.getByTestId('form-submit'));

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalled();
    });

    // The error should be handled by the ErrorBoundary or the component itself
    // The layout should still be functional
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });
}); 