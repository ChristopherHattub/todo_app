import React from 'react';
import { useTodoContext } from '../../contexts/TodoContext';
import { format } from 'date-fns';
import { TaskList } from './TaskList';

export const ScheduleContainer: React.FC = () => {
  const { state } = useTodoContext();
  const { selectedDate, yearSchedule, isLoading, error } = state;

  // Get the day schedule for the selected date
  // Use the same date formatting as the reducer to ensure consistency
  const monthKey = selectedDate.toISOString().slice(0, 7); // yyyy-MM
  const dayKey = selectedDate.toISOString().slice(0, 10); // yyyy-MM-dd
  
  const monthSchedule = yearSchedule.monthSchedules.get(monthKey);
  const daySchedule = monthSchedule?.daySchedules.get(dayKey);

  const tasks = daySchedule?.todoItems || [];

  if (isLoading) {
    return (
      <div className="schedule-container">
        <div className="loading-spinner">
          <div data-testid="loading-spinner" className="animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-container">
        <div className="error-state">
          <h3>Error Loading Schedule</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <div className="schedule-content">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div>
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3>
              No tasks for this day
            </h3>
            <p>
              Add a task to get started with your schedule
            </p>
          </div>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>
    </div>
  );
}; 