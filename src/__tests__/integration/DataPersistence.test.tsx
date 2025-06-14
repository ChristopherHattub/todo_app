import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoProvider, useTodoContext } from '../../contexts/TodoContext';
import { LocalStorageService } from '../../services/LocalStorageService';
import { DataMigrationService } from '../../services/DataMigrationService';

// Mock services
jest.mock('../../services/LocalStorageService');
jest.mock('../../services/DataMigrationService');
jest.mock('../../services/AnimationHandler', () => ({
  animationHandler: {
    queueAnimation: jest.fn()
  }
}));

const mockedLocalStorageService = LocalStorageService as jest.Mocked<typeof LocalStorageService>;
const mockedDataMigrationService = DataMigrationService as jest.Mocked<typeof DataMigrationService>;

// Test component to access context
const TestComponent: React.FC = () => {
  const { state, addTodo, completeTodo, exportData, importData, createBackup } = useTodoContext();
  
  return (
    <div>
      <div data-testid="loading">{state.isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{state.error || 'No Error'}</div>
      <div data-testid="initialized">{state.isInitialized ? 'Initialized' : 'Not Initialized'}</div>
      <div data-testid="unsaved-changes">{state.hasUnsavedChanges ? 'Has Changes' : 'No Changes'}</div>
      <div data-testid="total-points">{state.yearSchedule.totalYearPoints}</div>
      
      <button 
        onClick={() => addTodo({ title: 'Test Todo', description: 'Test', pointValue: 5 })}
        data-testid="add-todo"
      >
        Add Todo
      </button>
      
      <button 
        onClick={() => completeTodo('test-id')}
        data-testid="complete-todo"
      >
        Complete Todo
      </button>
      
      <button 
        onClick={async () => {
          const data = await exportData();
          console.log('Exported:', data);
        }}
        data-testid="export-data"
      >
        Export Data
      </button>
      
      <button 
        onClick={() => importData('{"test": "data"}')}
        data-testid="import-data"
      >
        Import Data
      </button>
      
      <button 
        onClick={() => createBackup('test')}
        data-testid="create-backup"
      >
        Create Backup
      </button>
    </div>
  );
};

describe('Data Persistence Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockedDataMigrationService.checkAndMigrate.mockResolvedValue({
      data: undefined,
      success: true
    });
    
    mockedDataMigrationService.validateDataIntegrity.mockResolvedValue({
      data: true,
      success: true
    });
    
    mockedDataMigrationService.cleanOldBackups.mockResolvedValue({
      data: 0,
      success: true
    });
    
    mockedLocalStorageService.loadYearSchedule.mockResolvedValue({
      data: null,
      success: true
    });
    
    mockedLocalStorageService.saveYearSchedule.mockResolvedValue({
      data: expect.any(Object),
      success: true
    });
    
    mockedLocalStorageService.saveDaySchedule.mockResolvedValue({
      data: expect.any(Object),
      success: true
    });
  });

  describe('Initialization', () => {
    it('should initialize app with migration check', async () => {
      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Should start loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
      expect(screen.getByTestId('initialized')).toHaveTextContent('Not Initialized');

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      expect(mockedDataMigrationService.checkAndMigrate).toHaveBeenCalled();
      expect(mockedDataMigrationService.validateDataIntegrity).toHaveBeenCalled();
      expect(mockedLocalStorageService.loadYearSchedule).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockedDataMigrationService.checkAndMigrate.mockResolvedValue({
        data: undefined,
        success: false,
        error: {
          type: 'MIGRATION',
          message: 'Migration failed',
          timestamp: new Date(),
          recoverable: false
        }
      });

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Migration failed');
      });
    });

    it('should load existing year data on initialization', async () => {
      const existingYearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 100,
        totalCompletedYearPoints: 50
      };

      mockedLocalStorageService.loadYearSchedule.mockResolvedValue({
        data: existingYearSchedule,
        success: true
      });

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-points')).toHaveTextContent('100');
      });
    });
  });

  describe('Auto-save functionality', () => {
    it('should auto-save when todo is added', async () => {
      const user = userEvent.setup();
      
      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Add a todo
      await user.click(screen.getByTestId('add-todo'));

      // Should mark as having unsaved changes
      expect(screen.getByTestId('unsaved-changes')).toHaveTextContent('Has Changes');

      // Wait for auto-save (debounced)
      await waitFor(() => {
        expect(mockedLocalStorageService.saveYearSchedule).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Should clear unsaved changes flag
      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes')).toHaveTextContent('No Changes');
      });
    });

    it('should auto-save when todo is completed', async () => {
      const user = userEvent.setup();
      
      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Complete a todo
      await user.click(screen.getByTestId('complete-todo'));

      // Should mark as having unsaved changes
      expect(screen.getByTestId('unsaved-changes')).toHaveTextContent('Has Changes');

      // Wait for auto-save
      await waitFor(() => {
        expect(mockedLocalStorageService.saveYearSchedule).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should handle auto-save errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockedLocalStorageService.saveYearSchedule.mockResolvedValue({
        data: null,
        success: false,
        error: {
          type: 'STORAGE',
          message: 'Save failed',
          timestamp: new Date(),
          recoverable: true
        }
      });

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Add a todo to trigger auto-save
      await user.click(screen.getByTestId('add-todo'));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Save failed');
      });
    });
  });

  describe('Data export/import', () => {
    it('should export data successfully', async () => {
      const user = userEvent.setup();
      const mockExportData = '{"test": "data"}';
      
      mockedLocalStorageService.exportData.mockResolvedValue({
        data: mockExportData,
        success: true
      });

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Export data
      await user.click(screen.getByTestId('export-data'));

      await waitFor(() => {
        expect(mockedLocalStorageService.exportData).toHaveBeenCalled();
      });
    });

    it('should import data successfully', async () => {
      const user = userEvent.setup();
      
      mockedLocalStorageService.importData.mockResolvedValue({
        data: undefined,
        success: true
      });

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Import data
      await user.click(screen.getByTestId('import-data'));

      await waitFor(() => {
        expect(mockedLocalStorageService.importData).toHaveBeenCalledWith('{"test": "data"}');
      });
    });

    it('should handle export errors', async () => {
      const user = userEvent.setup();
      
      mockedLocalStorageService.exportData.mockRejectedValue(new Error('Export failed'));

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Export data
      await user.click(screen.getByTestId('export-data'));

      // Should handle error (component would catch this)
      await waitFor(() => {
        expect(mockedLocalStorageService.exportData).toHaveBeenCalled();
      });
    });
  });

  describe('Backup functionality', () => {
    it('should create backup successfully', async () => {
      const user = userEvent.setup();
      
      mockedDataMigrationService.createBackup.mockResolvedValue({
        data: 'backup_key_123',
        success: true
      });

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Create backup
      await user.click(screen.getByTestId('create-backup'));

      await waitFor(() => {
        expect(mockedDataMigrationService.createBackup).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle storage quota exceeded errors', async () => {
      const user = userEvent.setup();
      
      mockedLocalStorageService.saveYearSchedule.mockResolvedValue({
        data: null,
        success: false,
        error: {
          type: 'STORAGE',
          message: 'QuotaExceededError',
          timestamp: new Date(),
          recoverable: true
        }
      });

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Add todo to trigger save
      await user.click(screen.getByTestId('add-todo'));

      // Should handle quota error
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('QuotaExceededError');
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockedLocalStorageService.saveYearSchedule.mockRejectedValue(new Error('Network error'));

      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initialized')).toHaveTextContent('Initialized');
      });

      // Add todo to trigger save
      await user.click(screen.getByTestId('add-todo'));

      // Should handle network error
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Auto-save failed');
      });
    });
  });

  describe('Browser session persistence', () => {
    it('should persist data across browser refresh', async () => {
      // Simulate existing data in storage
      const existingData = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 50,
        totalCompletedYearPoints: 25
      };

      mockedLocalStorageService.loadYearSchedule.mockResolvedValue({
        data: existingData,
        success: true
      });

      // First render - simulating initial load
      render(
        <TodoProvider>
          <TestComponent />
        </TodoProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('total-points')).toHaveTextContent('50');
      });

      // Verify data was loaded from storage
      expect(mockedLocalStorageService.loadYearSchedule).toHaveBeenCalledWith(2024);
    });
  });
}); 