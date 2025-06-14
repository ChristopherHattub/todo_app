import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { EntryForm } from '../EntryForm';
import { EntryFormData } from '../../../types';

describe('EntryForm', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all form fields', () => {
    render(<EntryForm {...defaultProps} />);
    
    expect(screen.getByTestId('entry-form')).toBeInTheDocument();
    expect(screen.getByTestId('entry-form-title')).toBeInTheDocument();
    expect(screen.getByTestId('entry-form-description')).toBeInTheDocument();
    expect(screen.getByTestId('entry-form-points')).toBeInTheDocument();
    expect(screen.getByTestId('entry-form-submit')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<EntryForm {...defaultProps} />);
    
    const submitButton = screen.getByTestId('entry-form-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Point value is required')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<EntryForm {...defaultProps} />);
    
    const formData: EntryFormData = {
      title: 'Test Task',
      description: 'Test Description',
      pointValue: '10',
    };

    fireEvent.change(screen.getByTestId('entry-form-title'), {
      target: { value: formData.title },
    });
    fireEvent.change(screen.getByTestId('entry-form-description'), {
      target: { value: formData.description },
    });
    fireEvent.change(screen.getByTestId('entry-form-points'), {
      target: { value: formData.pointValue },
    });

    const submitButton = screen.getByTestId('entry-form-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(formData);
    });
  });

  it('resets form after successful submission', async () => {
    render(<EntryForm {...defaultProps} />);
    
    const formData: EntryFormData = {
      title: 'Test Task',
      description: 'Test Description',
      pointValue: '10',
    };

    fireEvent.change(screen.getByTestId('entry-form-title'), {
      target: { value: formData.title },
    });
    fireEvent.change(screen.getByTestId('entry-form-description'), {
      target: { value: formData.description },
    });
    fireEvent.change(screen.getByTestId('entry-form-points'), {
      target: { value: formData.pointValue },
    });

    const submitButton = screen.getByTestId('entry-form-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('entry-form-title')).toHaveValue('');
      expect(screen.getByTestId('entry-form-description')).toHaveValue('');
      expect(screen.getByTestId('entry-form-points')).toHaveValue(null);
    });
  });

  it('handles keyboard submission', async () => {
    render(<EntryForm {...defaultProps} />);
    
    const formData: EntryFormData = {
      title: 'Test Task',
      description: 'Test Description',
      pointValue: '10',
    };

    fireEvent.change(screen.getByTestId('entry-form-title'), {
      target: { value: formData.title },
    });
    fireEvent.change(screen.getByTestId('entry-form-description'), {
      target: { value: formData.description },
    });
    fireEvent.change(screen.getByTestId('entry-form-points'), {
      target: { value: formData.pointValue },
    });

    fireEvent.keyDown(screen.getByTestId('entry-form-title'), {
      key: 'Enter',
      code: 'Enter',
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(formData);
    });
  });

  it('disables form during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<EntryForm {...defaultProps} />);
    
    const formData: EntryFormData = {
      title: 'Test Task',
      description: 'Test Description',
      pointValue: '10',
    };

    fireEvent.change(screen.getByTestId('entry-form-title'), {
      target: { value: formData.title },
    });
    fireEvent.change(screen.getByTestId('entry-form-description'), {
      target: { value: formData.description },
    });
    fireEvent.change(screen.getByTestId('entry-form-points'), {
      target: { value: formData.pointValue },
    });

    const submitButton = screen.getByTestId('entry-form-submit');
    fireEvent.click(submitButton);

    expect(screen.getByTestId('entry-form-title')).toBeDisabled();
    expect(screen.getByTestId('entry-form-description')).toBeDisabled();
    expect(screen.getByTestId('entry-form-points')).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Submitting...');
  });

  it('clears error when user starts typing', async () => {
    render(<EntryForm {...defaultProps} />);
    
    const submitButton = screen.getByTestId('entry-form-submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    const titleInput = screen.getByTestId('entry-form-title');
    fireEvent.change(titleInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });
  });
}); 