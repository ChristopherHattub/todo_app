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
  const totalPoints = daySchedule?.totalPointValue || 0;
  const completedPoints = daySchedule?.totalCompletedPointValue || 0;

  if (isLoading) {
    return (
      <div className="schedule-container bg-white rounded-lg shadow-md p-6 min-h-[400px] flex items-center justify-center">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-container bg-white rounded-lg shadow-md p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold mb-2">Error Loading Schedule</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-container bg-white rounded-lg shadow-md overflow-hidden">
      {/* Schedule Header */}
      <div className="schedule-header bg-gray-50 p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">
            {format(new Date(dayKey), 'MMMM d, yyyy')}
          </h2>
          <div className="text-sm text-gray-600">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
        
        {/* Points Summary */}
        <div className="mt-2 text-sm text-gray-600">
          {completedPoints} / {totalPoints} points completed
        </div>
      </div>

      {/* Task List */}
      <div className="schedule-content max-h-[600px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="empty-state p-8 text-center">
            <div className="text-gray-400 mb-4">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tasks for this day
            </h3>
            <p className="text-gray-500">
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