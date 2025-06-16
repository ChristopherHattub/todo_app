import React from 'react';
import { useTodoOperations } from '../../hooks/useTodoOperations';
import { useDateNavigation } from '../../hooks/useDateNavigation';
import { useStateManagement } from '../../hooks/useStateManagement';
import { ErrorDisplay } from '../presentation/ErrorDisplay';
import { LoadingSpinner } from '../presentation/LoadingSpinner';

// Import existing components (these should exist from the current implementation)
// import { AppLayout } from '../Layout/AppLayout';

// For now, create a simple implementation that can be expanded
export const TodoAppContent: React.FC = () => {
  const { addTodo, dayStats, isLoading, error } = useTodoOperations();
  const { selectedDate, navigateToToday, getDateString } = useDateNavigation();
  const { state } = useStateManagement();

  const handleAddTodo = async (text: string) => {
    try {
      await addTodo(text, '', 1);
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Todo Application</h1>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                Migration Complete - New Modular Architecture Active
              </span>
            </div>
          </div>
        </div>
        
        <ErrorDisplay 
          error={error} 
          title="Todo Operation Error"
          className="mb-4"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Date Navigation Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Date Navigation</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Date
                </label>
                <p className="text-lg font-mono text-blue-600">{getDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Year
                </label>
                <p className="text-lg font-mono text-blue-600">{state.todo.currentYear}</p>
              </div>
              <button
                onClick={navigateToToday}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Go to Today
              </button>
            </div>
          </div>

          {/* Add Todo Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Todo</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter todo text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value.trim()) {
                      handleAddTodo(target.value.trim());
                      target.value = '';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input') as HTMLInputElement;
                  if (input?.value.trim()) {
                    handleAddTodo(input.value.trim());
                    input.value = '';
                  }
                }}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Adding...</span>
                  </div>
                ) : (
                  'Add Todo'
                )}
              </button>
            </div>
          </div>

          {/* Statistics Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Day Statistics</h2>
            <div className="space-y-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dayStats.total}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dayStats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dayStats.percentage}%</div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Info */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Architecture Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Dependency Injection</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>State Management Slices</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Component Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 