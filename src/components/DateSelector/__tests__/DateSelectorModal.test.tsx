import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DateSelectorModal } from '../DateSelectorModal';
import { DateService } from '../../../services/DateService';

// Mock the DateService using a factory function
jest.mock('../../../services/DateService', () => {
  const mockDateService = {
    generateCalendarDays: jest.fn().mockReturnValue([
      new Date(2024, 0, 1),
      new Date(2024, 0, 2),
      // ... more dates
    ]),
    getWeekdays: jest.fn().mockReturnValue(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
    isSameDay: jest.fn().mockReturnValue(false) as jest.Mock<boolean, [Date, Date]>,
    isToday: jest.fn().mockReturnValue(false),
    addMonths: jest.fn().mockImplementation((date: Date, months: number) => {
      const newDate = new Date(date);
      newDate.setMonth(date.getMonth() + months);
      return newDate;
    }),
  };

  return {
    DateService: {
      getInstance: () => mockDateService,
    },
  };
});

describe('DateSelectorModal', () => {
  const mockOnDateSelect = jest.fn();
  const mockOnClose = jest.fn();
  const selectedDate = new Date(2024, 0, 15);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <DateSelectorModal
        isOpen={true}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DateSelectorModal
        isOpen={false}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking outside', () => {
    render(
      <DateSelectorModal
        isOpen={true}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    );

    fireEvent.mouseDown(document.body);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when pressing Escape', () => {
    render(
      <DateSelectorModal
        isOpen={true}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('navigates months when clicking arrow buttons', () => {
    render(
      <DateSelectorModal
        isOpen={true}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    );

    const prevButton = screen.getByLabelText('Previous month');
    const nextButton = screen.getByLabelText('Next month');

    fireEvent.click(prevButton);
    expect(DateService.getInstance().addMonths).toHaveBeenCalledWith(expect.any(Date), -1);

    fireEvent.click(nextButton);
    expect(DateService.getInstance().addMonths).toHaveBeenCalledWith(expect.any(Date), 1);
  });

  it('selects a date when clicking on a date cell', () => {
    render(
      <DateSelectorModal
        isOpen={true}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    );

    const dateCell = screen.getByText('1');
    fireEvent.click(dateCell);

    expect(mockOnDateSelect).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('maintains focus within the modal when tabbing', () => {
    render(
      <DateSelectorModal
        isOpen={true}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    );

    const modal = screen.getByRole('dialog');
    const focusableElements = modal.querySelectorAll('button');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the last element
    act(() => {
      lastElement.focus();
    });

    // Press Tab
    fireEvent.keyDown(lastElement, { key: 'Tab' });

    // Focus should wrap to the first element
    expect(document.activeElement).toBe(firstElement);
  });

  it('applies correct styles for selected and current dates', () => {
    // Mock isSameDay to return true for the first day
    (DateService.getInstance().isSameDay as jest.Mock).mockImplementation((date1: Date, date2: Date) => {
      return date1.getDate() === 1;
    });

    render(
      <DateSelectorModal
        isOpen={true}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    );

    const selectedDateCell = screen.getByText('1');
    expect(selectedDateCell.className).toContain('bg-blue-500');
    expect(selectedDateCell.className).toContain('text-white');
    expect(selectedDateCell.className).toContain('hover:bg-blue-600');
  });
}); 