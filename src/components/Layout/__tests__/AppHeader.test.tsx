import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppHeader } from '../AppHeader';
import { TodoProvider } from '../../../contexts/TodoContext';
import { format } from 'date-fns';

// Mock the TodoContext
jest.mock('../../../contexts/TodoContext', () => ({
  ...jest.requireActual('../../../contexts/TodoContext'),
  useTodoContext: () => ({
    state: {
      selectedDate: new Date('2024-03-20'),
    },
  }),
}));

describe('AppHeader', () => {
  const mockOnDateSelectorClick = jest.fn();

  beforeEach(() => {
    mockOnDateSelectorClick.mockClear();
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
}); 