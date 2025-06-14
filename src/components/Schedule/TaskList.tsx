import React from 'react';
import { TodoItem } from '../../types';
import { useTodoContext } from '../../contexts/TodoContext';

interface TaskListProps {
  tasks: TodoItem[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const { completeTodo } = useTodoContext();

  const handleToggleComplete = async (taskId: string) => {
    await completeTodo(taskId);
  };

  return (
    <div className="task-list divide-y divide-gray-200">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`task-item p-4 hover:bg-gray-50 transition-colors duration-150 ${
            task.isCompleted ? 'bg-gray-50' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <button
                  onClick={() => handleToggleComplete(task.id)}
                  className={`mr-3 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    task.isCompleted
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                  aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {task.isCompleted && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <div className={`flex-1 ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                  <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500 italic">{task.description}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  task.pointValue <= 5
                    ? 'bg-green-100 text-green-800'
                    : task.pointValue <= 19
                    ? 'bg-blue-100 text-blue-800'
                    : task.pointValue <= 29
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {task.pointValue} points
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList; 