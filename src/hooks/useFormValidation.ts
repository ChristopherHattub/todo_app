import { useState, useCallback, useRef, useEffect } from 'react';
import { useService } from '../core/di/react';
import { SERVICE_TOKENS } from '../core/di/ServiceToken';
import { IValidationService } from '../services/interfaces/IValidationService';
import {
  ValidationSchema,
  ValidationErrors,
  TouchedFields,
  FormValidationState,
  FormValidationHelpers,
  ValidationContext
} from '../types/validation';

const DEFAULT_VALIDATION_CONTEXT: ValidationContext = {
  sanitizeInput: true,
  showRealTimeValidation: true,
  validationDelay: 300
};

/**
 * Hook for form validation with real-time feedback
 * Integrates with the ValidationService for consistent validation logic
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationSchema: ValidationSchema<T>,
  context: Partial<ValidationContext> = {}
): FormValidationState<T> & FormValidationHelpers<T> {
  const validationService = useService(SERVICE_TOKENS.VALIDATION_SERVICE);
  const validationContext = { ...DEFAULT_VALIDATION_CONTEXT, ...context };
  
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<TouchedFields<T>>({});
  const [isValidating, setIsValidating] = useState(false);
  
  const validationTimeouts = useRef<Map<keyof T, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      validationTimeouts.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Compute overall validation state
  const isValid = Object.keys(errors).length === 0 && 
    Object.values(errors).every(error => !error);

  const validateField = useCallback(async (field: keyof T): Promise<void> => {
    const fieldRule = validationSchema[field];
    if (!fieldRule) return;

    const value = values[field];
    let error: string | null = null;

    // Required validation
    if (fieldRule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      error = 'This field is required';
    }

    // Length validations for strings
    if (!error && typeof value === 'string') {
      if (fieldRule.minLength && value.length < fieldRule.minLength) {
        error = `Must be at least ${fieldRule.minLength} characters`;
      } else if (fieldRule.maxLength && value.length > fieldRule.maxLength) {
        error = `Must be no more than ${fieldRule.maxLength} characters`;
      }
    }

    // Numeric validations
    if (!error && typeof value === 'string' && fieldRule.min !== undefined || fieldRule.max !== undefined) {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        if (fieldRule.min !== undefined && numValue < fieldRule.min) {
          error = `Must be at least ${fieldRule.min}`;
        } else if (fieldRule.max !== undefined && numValue > fieldRule.max) {
          error = `Must be no more than ${fieldRule.max}`;
        }
      }
    }

    // Pattern validation
    if (!error && fieldRule.pattern && typeof value === 'string') {
      if (!fieldRule.pattern.test(value)) {
        error = 'Invalid format';
      }
    }

    // Custom validation
    if (!error && fieldRule.custom) {
      error = fieldRule.custom(value);
    }

    // XSS validation using validation service
    if (!error && typeof value === 'string' && validationService.containsXSS(value)) {
      error = 'Contains potentially harmful content';
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [values, validationSchema, validationService]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    const sanitizedValue = validationContext.sanitizeInput && 
      typeof value === 'string' && validationService
      ? validationService.sanitizeString(value)
      : value;

    setValues(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Clear any existing validation timeout for this field
    const existingTimeout = validationTimeouts.current.get(field);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set up delayed validation if real-time validation is enabled
    if (validationContext.showRealTimeValidation && touched[field]) {
      const timeout = setTimeout(() => {
        validateField(field);
      }, validationContext.validationDelay);
      
      validationTimeouts.current.set(field, timeout);
    }
  }, [validationContext, validationService, validateField, touched]);

  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched(prev => ({
      ...prev,
      [field]: isTouched
    }));
  }, []);

  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    
    const fieldPromises = Object.keys(validationSchema).map(field => 
      validateField(field as keyof T)
    );
    
    await Promise.all(fieldPromises);
    
    setIsValidating(false);
    
    return Object.values(errors).every(error => !error);
  }, [validationSchema, validateField, errors]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    
    // Clear all validation timeouts
    validationTimeouts.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    validationTimeouts.current.clear();
  }, [initialValues]);

  const resetField = useCallback((field: keyof T) => {
    setValues(prev => ({
      ...prev,
      [field]: initialValues[field]
    }));
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
    setTouched(prev => ({
      ...prev,
      [field]: false
    }));
    
    // Clear validation timeout for this field
    const timeout = validationTimeouts.current.get(field);
    if (timeout) {
      clearTimeout(timeout);
      validationTimeouts.current.delete(field);
    }
  }, [initialValues]);

  return {
    // State
    values,
    errors,
    touched,
    isValid,
    isValidating,
    
    // Helpers
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    resetField
  };
} 