import React, { useState } from 'react';
import { TaskForm } from '../presentation/TaskForm';
import { FeatureErrorBoundary } from '../boundaries/FeatureErrorBoundary';
import { useService } from '../../core/di/react';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';
import { ITodoService } from '../../services/interfaces/ITodoService';

/**
 * Container component for task form with error handling
 * Wraps TaskForm with error boundary and manages todo operations
 */
export const TaskFormContainer: React.FC = () => {
  const todoService = useService(SERVICE_TOKENS.TODO_SERVICE);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    pointValue: number;
  }) => {
    setIsLoading(true);
    try {
      await todoService.createTodo({
        title: formData.title,
        description: formData.description,
        pointValue: formData.pointValue,
        isCompleted: false
      });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to add todo:', error);
      throw error; // Re-throw to be caught by error boundary
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  return (
    <FeatureErrorBoundary
      featureName="TaskForm"
      isolateFailure={true}
    >
      <div className="task-form-container">
        {!isFormOpen ? (
          <button
            onClick={handleOpenForm}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="add-task-button"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add New Task</span>
            </div>
          </button>
        ) : (
          <TaskForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            data-testid="task-form"
          />
        )}
      </div>
    </FeatureErrorBoundary>
  );
}; 