import React, { useState, useCallback } from 'react';
import { EntryFormData } from '../../types';

interface EntryFormProps {
  onSubmit: (data: EntryFormData) => Promise<void>;
}

interface FormErrors {
  title?: string;
  description?: string;
  pointValue?: string;
}

export const EntryForm: React.FC<EntryFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<EntryFormData>({
    title: '',
    description: '',
    pointValue: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (!formData.pointValue) {
      newErrors.pointValue = 'Point value is required';
    } else {
      const points = parseInt(formData.pointValue, 10);
      if (isNaN(points) || points < 1 || points > 100) {
        newErrors.pointValue = 'Point value must be between 1 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        pointValue: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validateForm]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form
      className="entry-form"
      onSubmit={handleSubmit}
      data-testid="entry-form"
      aria-label="Todo Entry Form"
    >
      <div className="entry-form-group">
        <label htmlFor="title" className="entry-form-label">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter Title..."
          maxLength={100}
          className={`entry-form-input entry-form-input--title ${errors.title ? 'entry-form-input--error' : ''}`}
          data-testid="entry-form-title"
          disabled={isSubmitting}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <div id="title-error" className="entry-form-error" role="alert">
            {errors.title}
          </div>
        )}
      </div>

      <div className="entry-form-group">
        <label htmlFor="description" className="entry-form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter Description..."
          maxLength={500}
          className={`entry-form-input entry-form-input--description ${errors.description ? 'entry-form-input--error' : ''}`}
          data-testid="entry-form-description"
          disabled={isSubmitting}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <div id="description-error" className="entry-form-error" role="alert">
            {errors.description}
          </div>
        )}
      </div>

      <div className="entry-form-group">
        <label htmlFor="pointValue" className="entry-form-label">
          Points
        </label>
        <input
          type="number"
          id="pointValue"
          name="pointValue"
          value={formData.pointValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter points..."
          min={1}
          max={100}
          className={`entry-form-input entry-form-input--points ${errors.pointValue ? 'entry-form-input--error' : ''}`}
          data-testid="entry-form-points"
          disabled={isSubmitting}
          aria-invalid={!!errors.pointValue}
          aria-describedby={errors.pointValue ? 'points-error' : undefined}
        />
        {errors.pointValue && (
          <div id="points-error" className="entry-form-error" role="alert">
            {errors.pointValue}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="entry-form-submit"
        data-testid="entry-form-submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Add Task'}
        <span className="entry-form-submit-arrow">→</span>
      </button>
    </form>
  );
};

export default EntryForm; 