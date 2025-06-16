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
      className="date-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Date Selector"
    >
      <div
        ref={modalRef}
        className={`date-modal-container ${isAnimating ? 'animating' : ''}`}
      >
        {/* Header */}
        <div className="date-modal-header">
          <button
            onClick={() => handleMonthChange(-1)}
            className="nav-button"
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 className="date-modal-title">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => handleMonthChange(1)}
            className="nav-button"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div ref={calendarRef} className="calendar-container">
          {/* Weekday headers */}
          <div className="weekday-grid">
            {dateService.getWeekdays().map((day) => (
              <div
                key={day}
                className="weekday-header"
              >
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Date grid */}
          <div className="date-grid">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isSelected = dateService.isSameDay(date, selectedDate);
              const isToday = dateService.isToday(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  className={`date-button ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
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