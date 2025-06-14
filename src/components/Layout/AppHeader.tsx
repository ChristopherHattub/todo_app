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
    <header className="app-header bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onDateSelectorClick}
            className="date-selector-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            aria-label="Select date"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
          <div className="current-date text-xl font-bold">
            {formattedDate}
          </div>
        </div>
      </div>
    </header>
  );
}; 