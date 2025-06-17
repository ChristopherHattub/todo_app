import React from 'react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { VALIDATION_SCHEMAS } from '../../types/validation';
import { EntryFormData } from '../../types';

export interface TaskFormProps {
  onSubmit: (formData: { title: string; description: string; pointValue: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Task form component with integrated validation
 * Uses useFormValidation hook for real-time validation feedback
 */
export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  'data-testid': testId,
}) => {
  const initialValues: EntryFormData = {
    title: '',
    description: '',
    pointValue: '10'
  };

  const {
    values,
    errors,
    touched,
    isValid,
    isValidating,
    setFieldValue,
    setFieldTouched,
    validateForm,
    resetForm
  } = useFormValidation(
    initialValues,
    VALIDATION_SCHEMAS.TODO_INPUT,
    {
      sanitizeInput: true,
      showRealTimeValidation: true,
      validationDelay: 300
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isFormValid = await validateForm();
    if (!isFormValid) {
      return;
    }

    try {
      await onSubmit({
        title: values.title,
        description: values.description,
        pointValue: parseInt(values.pointValue, 10)
      });
      
      // Reset form after successful submission
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Form errors are handled by parent component or error boundary
    }
  };

  const handleFieldChange = (field: keyof EntryFormData, value: string) => {
    setFieldValue(field, value);
  };

  const handleFieldBlur = (field: keyof EntryFormData) => {
    setFieldTouched(field, true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white p-6 rounded-lg border shadow-sm ${className || ''}`}
      data-testid={testId}
    >
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Task</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <input
            id="title"
            type="text"
            value={values.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            onBlur={() => handleFieldBlur('title')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title && touched.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter task title..."
            disabled={isLoading || isValidating}
            aria-invalid={!!(errors.title && touched.title)}
            aria-describedby={errors.title && touched.title ? 'title-error' : undefined}
          />
          {errors.title && touched.title && (
            <div id="title-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.title}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            onBlur={() => handleFieldBlur('description')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.description && touched.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Optional description..."
            rows={3}
            disabled={isLoading || isValidating}
            aria-invalid={!!(errors.description && touched.description)}
            aria-describedby={errors.description && touched.description ? 'description-error' : undefined}
          />
          {errors.description && touched.description && (
            <div id="description-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.description}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="pointValue" className="block text-sm font-medium text-gray-700 mb-1">
            Point Value *
          </label>
          <select
            id="pointValue"
            value={values.pointValue}
            onChange={(e) => handleFieldChange('pointValue', e.target.value)}
            onBlur={() => handleFieldBlur('pointValue')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.pointValue && touched.pointValue ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isLoading || isValidating}
            aria-invalid={!!(errors.pointValue && touched.pointValue)}
            aria-describedby={errors.pointValue && touched.pointValue ? 'points-error' : undefined}
          >
            <option value="5">5 Points - Quick Task</option>
            <option value="10">10 Points - Standard Task</option>
            <option value="15">15 Points - Medium Task</option>
            <option value="20">20 Points - Large Task</option>
            <option value="30">30 Points - Major Task</option>
          </select>
          {errors.pointValue && touched.pointValue && (
            <div id="points-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.pointValue}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading || isValidating}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || isValidating || !isValid || !values.title.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : isValidating ? 'Validating...' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}; 