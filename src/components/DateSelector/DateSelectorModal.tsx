import React, { useEffect, useRef, useState, RefObject } from 'react';
import { DateSelectorModalProps } from '../../types/ui';
import { DateService } from '../../services/DateService';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const dateService = DateService.getInstance();

export const DateSelectorModal: React.FC<DateSelectorModalProps> = ({
  isOpen,
  selectedDate,
  onDateSelect,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useKeyboardNavigation({
    onEscape: onClose,
    onArrowLeft: () => handleMonthChange(-1),
    onArrowRight: () => handleMonthChange(1),
  });

  // Handle click outside
  useClickOutside(modalRef as RefObject<HTMLElement>, onClose);

  // Trap focus within modal
  useFocusTrap(modalRef as RefObject<HTMLElement>, isOpen);

  // Generate calendar days for current month
  const calendarDays = dateService.generateCalendarDays(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  // Handle month navigation
  const handleMonthChange = (months: number) => {
    setCurrentMonth(dateService.addMonths(currentMonth, months));
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  // Animation handlers
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Date Selector"
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full max-w-md transform transition-transform duration-300 ${
          isAnimating ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div ref={calendarRef} className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dateService.getWeekdays().map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isSelected = dateService.isSameDay(date, selectedDate);
              const isToday = dateService.isToday(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  className={`
                    p-2 text-center rounded-full
                    ${!isCurrentMonth ? 'text-gray-400' : 'hover:bg-gray-100'}
                    ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isToday && !isSelected ? 'border-2 border-blue-500' : ''}
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                  aria-selected={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}; 