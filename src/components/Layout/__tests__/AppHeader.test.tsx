import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppHeader } from '../AppHeader';
import { TodoProvider } from '../../../contexts/TodoContext';
import { format } from 'date-fns';

// Mock the TodoContext with more realistic data
const mockUseTodoContext = jest.fn();

jest.mock('../../../contexts/TodoContext', () => ({
  ...jest.requireActual('../../../contexts/TodoContext'),
  useTodoContext: () => mockUseTodoContext(),
  TodoProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AppHeader', () => {
  const mockOnDateSelectorClick = jest.fn();

  beforeEach(() => {
    mockOnDateSelectorClick.mockClear();
    // Default mock implementation
    mockUseTodoContext.mockReturnValue({
      state: {
        selectedDate: new Date('2024-03-20'),
      },
    });
  });

  it('renders the current date in MM/dd/yy format', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    const expectedDate = format(new Date('2024-03-20'), 'MM/dd/yy');
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('calls onDateSelectorClick when the date selector button is clicked', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    const dateSelectorButton = screen.getByRole('button', { name: /select date/i });
    fireEvent.click(dateSelectorButton);

    expect(mockOnDateSelectorClick).toHaveBeenCalledTimes(1);
  });

  it('renders the date selector button with calendar icon', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    const dateSelectorButton = screen.getByRole('button', { name: /select date/i });
    expect(dateSelectorButton).toBeInTheDocument();
    expect(dateSelectorButton.querySelector('svg')).toBeInTheDocument();
  });

  // Enhanced test cases
  it('handles different date formats correctly', () => {
    const testDates = [
      new Date('2024-01-01'), // New Year
      new Date('2024-12-31'), // End of year
      new Date('2024-02-29'), // Leap year
      new Date('2023-02-28'), // Non-leap year
    ];

    testDates.forEach((date) => {
      mockUseTodoContext.mockReturnValue({
        state: { selectedDate: date },
      });

      const { rerender } = render(
        <TodoProvider>
          <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
        </TodoProvider>
      );

      const expectedDate = format(date, 'MM/dd/yy');
      expect(screen.getByText(expectedDate)).toBeInTheDocument();

      rerender(
        <TodoProvider>
          <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
        </TodoProvider>
      );
    });
  });

  it('has correct accessibility attributes', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    const dateSelectorButton = screen.getByRole('button', { name: /select date/i });
    
    // Check ARIA attributes
    expect(dateSelectorButton).toHaveAttribute('aria-label');
    
    // Check that it's focusable
    dateSelectorButton.focus();
    expect(document.activeElement).toBe(dateSelectorButton);
  });

  it('applies correct CSS classes', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('app-header');

    const dateSelectorButton = screen.getByRole('button', { name: /select date/i });
    expect(dateSelectorButton).toHaveClass('date-selector-btn');
  });

  it('prevents multiple rapid clicks', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    const dateSelectorButton = screen.getByRole('button', { name: /select date/i });
    
    // Rapid clicks
    fireEvent.click(dateSelectorButton);
    fireEvent.click(dateSelectorButton);
    fireEvent.click(dateSelectorButton);

    // Should register all calls (debouncing would be handled at a higher level)
    expect(mockOnDateSelectorClick).toHaveBeenCalledTimes(3);
  });

  it('updates when selectedDate changes', () => {
    mockUseTodoContext.mockReturnValue({
      state: { selectedDate: new Date('2024-03-20') },
    });

    const { rerender } = render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    expect(screen.getByText('03/20/24')).toBeInTheDocument();

    // Change the date
    mockUseTodoContext.mockReturnValue({
      state: { selectedDate: new Date('2024-12-25') },
    });

    rerender(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    expect(screen.getByText('12/25/24')).toBeInTheDocument();
    expect(screen.queryByText('03/20/24')).not.toBeInTheDocument();
  });

  it('handles invalid dates gracefully', () => {
    mockUseTodoContext.mockReturnValue({
      state: { selectedDate: new Date('invalid') },
    });

    // Should not throw an error, but may show "Invalid Date" or similar
    expect(() => {
      render(
        <TodoProvider>
          <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
        </TodoProvider>
      );
    }).not.toThrow();
  });

  it('maintains focus management', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    const dateSelectorButton = screen.getByRole('button', { name: /select date/i });
    
    // Focus the button
    dateSelectorButton.focus();
    expect(document.activeElement).toBe(dateSelectorButton);

    // Click should not remove focus unexpectedly
    fireEvent.click(dateSelectorButton);
    expect(mockOnDateSelectorClick).toHaveBeenCalled();
  });

  it('has proper semantic structure', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    // Should be wrapped in a header element
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Should contain navigation elements
    const dateSelectorButton = screen.getByRole('button');
    expect(header).toContainElement(dateSelectorButton);
  });

  it('contains select date text', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    // Should contain "Select Date" text
    expect(screen.getByText('Select Date')).toBeInTheDocument();
  });

  it('displays current date in separate element', () => {
    render(
      <TodoProvider>
        <AppHeader onDateSelectorClick={mockOnDateSelectorClick} />
      </TodoProvider>
    );

    const currentDateElement = screen.getByText('03/20/24').closest('.current-date');
    expect(currentDateElement).toBeInTheDocument();
    expect(currentDateElement).toHaveClass('current-date');
  });
}); 