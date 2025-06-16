import React from 'react';
import { useTodoContext } from '../../contexts/TodoContext';
import { format } from 'date-fns';

interface AppHeaderProps {
  onDateSelectorClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onDateSelectorClick }) => {
  const { state } = useTodoContext();
  const { selectedDate } = state;

  const formattedDate = format(selectedDate, 'MM/dd/yy');

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <button
            onClick={onDateSelectorClick}
            className="date-selector-btn"
            aria-label="Select date"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Select Date</span>
          </button>
          <div className="current-date">
            {formattedDate}
          </div>
        </div>
      </div>
    </header>
  );
}; 