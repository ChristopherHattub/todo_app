import React, { useState, useCallback } from 'react';
import { useTodoContext } from '../../contexts/TodoContext';

interface BackupItem {
  key: string;
  timestamp: number;
  type: string;
}

export const DataManagementPanel: React.FC = () => {
  const { exportData, importData, createBackup, getBackups, restoreFromBackup, validateDataIntegrity } = useTodoContext();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [showBackups, setShowBackups] = useState(false);

  const showMessage = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const handleExportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await exportData();
      
      // Create downloadable file
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `todo-app-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showMessage('Data exported successfully!', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to export data';
      showMessage(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [exportData, showMessage]);

  const handleImportData = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const text = await file.text();
      await importData(text);
      showMessage('Data imported successfully!', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to import data';
      showMessage(errorMsg, 'error');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [importData, showMessage]);

  const handleCreateBackup = useCallback(async () => {
    try {
      setIsLoading(true);
      const backupKey = await createBackup('manual');
      showMessage(`Backup created: ${backupKey}`, 'success');
      // Refresh backup list
      if (showBackups) {
        setBackups(getBackups());
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create backup';
      showMessage(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [createBackup, showMessage, showBackups, getBackups]);

  const handleShowBackups = useCallback(() => {
    setBackups(getBackups());
    setShowBackups(!showBackups);
  }, [getBackups, showBackups]);

  const handleRestoreBackup = useCallback(async (backupKey: string) => {
    if (!window.confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      return;
    }

    try {
      setIsLoading(true);
      await restoreFromBackup(backupKey);
      showMessage('Data restored successfully!', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to restore backup';
      showMessage(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [restoreFromBackup, showMessage]);

  const handleValidateIntegrity = useCallback(async () => {
    try {
      setIsLoading(true);
      const isValid = await validateDataIntegrity();
      showMessage(
        isValid ? 'Data integrity check passed!' : 'Data integrity issues detected. Check console for details.',
        isValid ? 'success' : 'error'
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to validate data integrity';
      showMessage(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [validateDataIntegrity, showMessage]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="data-management-panel bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Management</h2>
      
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md mb-4 ${
          messageType === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
          messageType === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
          'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          {message}
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleExportData}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <span className="mr-2">📥</span>
          )}
          Export Data
        </button>

        <label className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer">
          <span className="mr-2">📤</span>
          Import Data
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            disabled={isLoading}
            className="hidden"
          />
        </label>

        <button
          onClick={handleCreateBackup}
          disabled={isLoading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <span className="mr-2">💾</span>
          )}
          Create Backup
        </button>

        <button
          onClick={handleValidateIntegrity}
          disabled={isLoading}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <span className="mr-2">🔍</span>
          )}
          Validate Data
        </button>
      </div>

      {/* Backup Management */}
      <div className="border-t pt-6">
        <button
          onClick={handleShowBackups}
          className="text-gray-600 hover:text-gray-800 font-medium mb-4 flex items-center"
        >
          <span className="mr-2">{showBackups ? '🔽' : '▶️'}</span>
          Backup Management ({getBackups().length} backups)
        </button>

        {showBackups && (
          <div className="space-y-2">
            {backups.length === 0 ? (
              <p className="text-gray-500 italic">No backups available</p>
            ) : (
              backups.map((backup) => (
                <div
                  key={backup.key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {backup.type === 'manual' ? '👤 Manual Backup' : '🔄 Migration Backup'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTimestamp(backup.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreBackup(backup.key)}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
        <h3 className="font-medium text-gray-800 mb-2">Data Management Help</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Export:</strong> Download all your data as a JSON file</li>
          <li>• <strong>Import:</strong> Upload and restore data from a JSON file</li>
          <li>• <strong>Backup:</strong> Create a restore point stored locally</li>
          <li>• <strong>Validate:</strong> Check data integrity and consistency</li>
        </ul>
      </div>
    </div>
  );
}; 