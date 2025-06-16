import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataManagementPanel } from '../DataManagementPanel';

// Mock file API
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock DOM methods
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockReturnValue({
    href: '',
    download: '',
    click: mockClick,
  }),
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(),
});

// Mock the TodoContext
const mockExportData = jest.fn();
const mockImportData = jest.fn();
const mockCreateBackup = jest.fn();
const mockGetBackups = jest.fn();
const mockRestoreFromBackup = jest.fn();
const mockValidateDataIntegrity = jest.fn();

jest.mock('../../../contexts/TodoContext', () => ({
  useTodoContext: () => ({
    exportData: mockExportData,
    importData: mockImportData,
    createBackup: mockCreateBackup,
    getBackups: mockGetBackups,
    restoreFromBackup: mockRestoreFromBackup,
    validateDataIntegrity: mockValidateDataIntegrity,
  }),
}));

describe('DataManagementPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBackups.mockReturnValue([
      { key: 'backup1', timestamp: Date.now() - 1000000, type: 'manual' },
      { key: 'backup2', timestamp: Date.now() - 2000000, type: 'auto' },
    ]);
  });

  it('renders all main action buttons', () => {
    render(<DataManagementPanel />);

    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Import Data')).toBeInTheDocument();
    expect(screen.getByText('Create Backup')).toBeInTheDocument();
    expect(screen.getByText('Validate Data')).toBeInTheDocument();
  });

  it('renders backup management section', () => {
    render(<DataManagementPanel />);

    expect(screen.getByText(/Backup Management \(\d+ backups\)/)).toBeInTheDocument();
  });

  describe('Export Data', () => {
    it('successfully exports data and creates download', async () => {
      const mockData = JSON.stringify({ todos: [], version: '1.0' });
      mockExportData.mockResolvedValue(mockData);
      mockCreateObjectURL.mockReturnValue('blob:mock-url');

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockExportData).toHaveBeenCalled();
      });

      // Verify file download setup
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      // Check success message
      expect(screen.getByText('Data exported successfully!')).toBeInTheDocument();
    });

    it('handles export error', async () => {
      mockExportData.mockRejectedValue(new Error('Export failed'));

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(screen.getByText('Export failed')).toBeInTheDocument();
      });
    });

    it('shows loading state during export', async () => {
      mockExportData.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Export Data'));

      // Check loading state
      expect(screen.getByRole('button', { name: /export data/i })).toBeDisabled();
      expect(screen.getByText('⏳')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export data/i })).not.toBeDisabled();
      });
    });
  });

  describe('Import Data', () => {
    it('successfully imports data from file', async () => {
      const mockFile = new File(['{"todos": []}'], 'backup.json', { type: 'application/json' });
      mockImportData.mockResolvedValue(undefined);

      render(<DataManagementPanel />);

      const fileInput = screen.getByRole('button', { name: /import data/i }).querySelector('input');
      
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput!);

      await waitFor(() => {
        expect(mockImportData).toHaveBeenCalledWith('{"todos": []}');
      });

      expect(screen.getByText('Data imported successfully!')).toBeInTheDocument();
    });

    it('handles import error', async () => {
      const mockFile = new File(['invalid json'], 'backup.json', { type: 'application/json' });
      mockImportData.mockRejectedValue(new Error('Invalid JSON'));

      render(<DataManagementPanel />);

      const fileInput = screen.getByRole('button', { name: /import data/i }).querySelector('input');
      
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput!);

      await waitFor(() => {
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });
    });

    it('does nothing when no file is selected', () => {
      render(<DataManagementPanel />);

      const fileInput = screen.getByRole('button', { name: /import data/i }).querySelector('input');
      fireEvent.change(fileInput!);

      expect(mockImportData).not.toHaveBeenCalled();
    });
  });

  describe('Create Backup', () => {
    it('successfully creates backup', async () => {
      mockCreateBackup.mockResolvedValue('backup-key-123');

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Create Backup'));

      await waitFor(() => {
        expect(mockCreateBackup).toHaveBeenCalledWith('manual');
      });

      expect(screen.getByText('Backup created: backup-key-123')).toBeInTheDocument();
    });

    it('handles backup creation error', async () => {
      mockCreateBackup.mockRejectedValue(new Error('Backup failed'));

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Create Backup'));

      await waitFor(() => {
        expect(screen.getByText('Backup failed')).toBeInTheDocument();
      });
    });
  });

  describe('Validate Data', () => {
    it('shows success message when data is valid', async () => {
      mockValidateDataIntegrity.mockResolvedValue(true);

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Validate Data'));

      await waitFor(() => {
        expect(mockValidateDataIntegrity).toHaveBeenCalled();
      });

      expect(screen.getByText('Data integrity check passed!')).toBeInTheDocument();
    });

    it('shows error message when data is invalid', async () => {
      mockValidateDataIntegrity.mockResolvedValue(false);

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Validate Data'));

      await waitFor(() => {
        expect(screen.getByText('Data integrity issues detected. Check console for details.')).toBeInTheDocument();
      });
    });

    it('handles validation error', async () => {
      mockValidateDataIntegrity.mockRejectedValue(new Error('Validation failed'));

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Validate Data'));

      await waitFor(() => {
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Backup Management', () => {
    it('shows backup list when expanded', () => {
      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText(/Backup Management/));

      expect(screen.getByText('backup1')).toBeInTheDocument();
      expect(screen.getByText('backup2')).toBeInTheDocument();
    });

    it('hides backup list when collapsed', () => {
      render(<DataManagementPanel />);

      // Expand
      fireEvent.click(screen.getByText(/Backup Management/));
      expect(screen.getByText('backup1')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText(/Backup Management/));
      expect(screen.queryByText('backup1')).not.toBeInTheDocument();
    });

    it('restores from backup with confirmation', async () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      mockRestoreFromBackup.mockResolvedValue(undefined);

      render(<DataManagementPanel />);

      // Expand backup list
      fireEvent.click(screen.getByText(/Backup Management/));

      // Find and click restore button for first backup
      const restoreButtons = screen.getAllByText('Restore');
      fireEvent.click(restoreButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to restore from this backup? This will overwrite current data.'
      );

      await waitFor(() => {
        expect(mockRestoreFromBackup).toHaveBeenCalledWith('backup1');
      });

      expect(screen.getByText('Data restored successfully!')).toBeInTheDocument();
    });

    it('cancels restore when confirmation is declined', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      render(<DataManagementPanel />);

      // Expand backup list
      fireEvent.click(screen.getByText(/Backup Management/));

      // Find and click restore button for first backup
      const restoreButtons = screen.getAllByText('Restore');
      fireEvent.click(restoreButtons[0]);

      expect(mockRestoreFromBackup).not.toHaveBeenCalled();
    });

    it('handles restore error', async () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      mockRestoreFromBackup.mockRejectedValue(new Error('Restore failed'));

      render(<DataManagementPanel />);

      // Expand backup list
      fireEvent.click(screen.getByText(/Backup Management/));

      // Find and click restore button for first backup
      const restoreButtons = screen.getAllByText('Restore');
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Restore failed')).toBeInTheDocument();
      });
    });
  });

  describe('Message Display', () => {
    it('auto-hides messages after 5 seconds', async () => {
      jest.useFakeTimers();
      mockExportData.mockResolvedValue('{}');

      render(<DataManagementPanel />);

      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(screen.getByText('Data exported successfully!')).toBeInTheDocument();
      });

      // Fast forward 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByText('Data exported successfully!')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('applies correct CSS classes for different message types', async () => {
      mockExportData.mockResolvedValue('{}');
      mockValidateDataIntegrity.mockResolvedValue(false);

      render(<DataManagementPanel />);

      // Test success message
      fireEvent.click(screen.getByText('Export Data'));
      await waitFor(() => {
        const successMessage = screen.getByText('Data exported successfully!');
        expect(successMessage.closest('.status-message')).toHaveClass('success');
      });

      // Test error message
      fireEvent.click(screen.getByText('Validate Data'));
      await waitFor(() => {
        const errorMessage = screen.getByText('Data integrity issues detected. Check console for details.');
        expect(errorMessage.closest('.status-message')).toHaveClass('error');
      });
    });
  });

  it('displays loading indicators correctly', async () => {
    mockExportData.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<DataManagementPanel />);

    fireEvent.click(screen.getByText('Export Data'));

    // All buttons should be disabled during loading
    expect(screen.getByRole('button', { name: /export data/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /create backup/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /validate data/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export data/i })).not.toBeDisabled();
    });
  });
}); 