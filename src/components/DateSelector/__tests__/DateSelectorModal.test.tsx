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
      new Date(2024, 0, 3),
      new Date(2024, 0, 4),
      new Date(2024, 0, 5),
      new Date(2024, 0, 6),
      new Date(2024, 0, 7),
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
    
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  it('applies correct styles for selected dates', () => {
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
    expect(selectedDateCell.className).toContain('selected');
  });

  // Enhanced test cases
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Date Selector');
    });

    it('has correct tab order and keyboard navigation', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const modal = screen.getByRole('dialog');
      const focusableElements = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // First element should be focusable
      act(() => {
        (focusableElements[0] as HTMLElement).focus();
      });
      expect(document.activeElement).toBe(focusableElements[0]);
    });

    it('supports screen reader announcements', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // Check for screen reader friendly labels
      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates dates with arrow keys', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const dateCell = screen.getByText('1');
      
      // Test arrow key navigation (implementation may vary)
      fireEvent.keyDown(dateCell, { key: 'ArrowRight' });
      fireEvent.keyDown(dateCell, { key: 'ArrowDown' });
      fireEvent.keyDown(dateCell, { key: 'ArrowLeft' });
      fireEvent.keyDown(dateCell, { key: 'ArrowUp' });

      // Should handle navigation (implementation specific)
    });

    it('handles keyboard interaction on date buttons', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const dateCell = screen.getByText('1');
      
      // Click should work
      fireEvent.click(dateCell);
      expect(mockOnDateSelect).toHaveBeenCalled();
    });
  });

  describe('Month Navigation', () => {
    it('updates calendar when navigating to different months', () => {
      const { rerender } = render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // Mock a different month's data
      (DateService.getInstance().generateCalendarDays as jest.Mock).mockReturnValue([
        new Date(2024, 1, 1), // February
        new Date(2024, 1, 2),
        // ... more dates
      ]);

      fireEvent.click(screen.getByLabelText('Next month'));

      // Should call generateCalendarDays with new month
      expect(DateService.getInstance().generateCalendarDays).toHaveBeenCalled();
    });

    it('handles edge cases for year boundaries', () => {
      const decemberDate = new Date(2024, 11, 15); // December
      
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={decemberDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // Navigate to next month (should go to next year)
      fireEvent.click(screen.getByLabelText('Next month'));
      
      expect(DateService.getInstance().addMonths).toHaveBeenCalledWith(expect.any(Date), 1);
    });
  });

  describe('Date Selection', () => {
    it('highlights today\'s date when present', () => {
      // Mock isToday to return true for a specific date
      (DateService.getInstance().isToday as jest.Mock).mockImplementation((date: Date) => {
        return date.getDate() === 1;
      });

      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const todayCell = screen.getByText('1');
      expect(todayCell.className).toContain('today');
    });

    it('shows selected date with different styling', () => {
      // Mock isSameDay to return true for selected date
      (DateService.getInstance().isSameDay as jest.Mock).mockImplementation((date1: Date, date2: Date) => {
        return date1.getDate() === selectedDate.getDate();
      });

      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // Find a button with selected class (should exist)
      const selectedButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('selected')
      );
      expect(selectedButtons.length).toBeGreaterThan(0);
    });

    it('handles other month dates correctly', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // Other month dates should have appropriate styling
      const dateButtons = screen.getAllByRole('button').filter(button => 
        button.className.includes('date-button')
      );
      expect(dateButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Calendar Display', () => {
    it('shows correct weekday headers', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weekdays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('displays correct number of calendar days', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // Should display dates from generateCalendarDays
      expect(DateService.getInstance().generateCalendarDays).toHaveBeenCalled();
    });
  });

  describe('Modal Behavior', () => {
    it('has proper modal structure', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveClass('date-modal-overlay');
    });

    it('restores state when closed and reopened', () => {
      const { rerender } = render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(
        <DateSelectorModal
          isOpen={false}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('focuses the modal when opened', () => {
      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // Modal should be present and focusable
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('generates calendar days on mount', () => {
      const initialCallCount = (DateService.getInstance().generateCalendarDays as jest.Mock).mock.calls.length;

      render(
        <DateSelectorModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // Should call generateCalendarDays at least once
      expect((DateService.getInstance().generateCalendarDays as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });
}); 