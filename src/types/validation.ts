/**
 * Validation-specific type definitions for the ToDo List Tracker application
 */

import { EntryFormData } from './index';

/**
 * Validation rule for a single field
 */
export interface ValidationRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

/**
 * Generic validation schema for form fields
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

/**
 * Validation errors keyed by field name
 */
export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * Touched fields tracking for validation timing
 */
export type TouchedFields<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Form validation state
 */
export interface FormValidationState<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: TouchedFields<T>;
  isValid: boolean;
  isValidating: boolean;
}

/**
 * Form validation helpers
 */
export interface FormValidationHelpers<T> {
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string | null) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  validateField: (field: keyof T) => Promise<void>;
  validateForm: () => Promise<boolean>;
  resetForm: () => void;
  resetField: (field: keyof T) => void;
}

/**
 * Validation context for forms
 */
export interface ValidationContext {
  sanitizeInput: boolean;
  showRealTimeValidation: boolean;
  validationDelay: number;
}

/**
 * Common validation schemas
 */
export const VALIDATION_SCHEMAS = {
  TODO_INPUT: {
    title: {
      required: true,
      minLength: 1,
      maxLength: 100,
      custom: (value: string) => {
        if (value && value.trim().length === 0) {
          return 'Title cannot be empty or whitespace only';
        }
        return null;
      }
    },
    description: {
      maxLength: 500
    },
    pointValue: {
      required: true,
      min: 1,
      max: 100,
      custom: (value: string) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
          return 'Point value must be a valid number';
        }
        return null;
      }
    }
  } as ValidationSchema<EntryFormData>
} as const; 