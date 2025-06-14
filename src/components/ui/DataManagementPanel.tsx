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
    <div className="data-management-panel">
      <h2>Data Management</h2>
      
      {/* Status Message */}
      {message && (
        <div className={`status-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Main Actions */}
      <div className="action-grid">
        <button
          onClick={handleExportData}
          disabled={isLoading}
          className={`action-button primary ${isLoading ? 'disabled' : ''}`}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            <span>📥</span>
          )}
          Export Data
        </button>

        <label className="file-input-label">
          <span>📤</span>
          Import Data
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            disabled={isLoading}
          />
        </label>

        <button
          onClick={handleCreateBackup}
          disabled={isLoading}
          className={`action-button secondary ${isLoading ? 'disabled' : ''}`}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            <span>💾</span>
          )}
          Create Backup
        </button>

        <button
          onClick={handleValidateIntegrity}
          disabled={isLoading}
          className={`action-button warning ${isLoading ? 'disabled' : ''}`}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            <span>🔍</span>
          )}
          Validate Data
        </button>
      </div>

      {/* Backup Management */}
      <div className="backup-section">
        <button
          onClick={handleShowBackups}
          className="backup-toggle"
        >
          <span>{showBackups ? '🔽' : '▶️'}</span>
          Backup Management ({getBackups().length} backups)
        </button>

        {showBackups && (
          <div className="backup-list">
            {backups.length === 0 ? (
              <div className="empty-backups">No backups available</div>
            ) : (
              backups.map((backup) => (
                <div
                  key={backup.key}
                  className="backup-item"
                >
                  <div className="backup-info">
                    <div className="backup-type">
                      {backup.type === 'manual' ? '👤 Manual Backup' : '🔄 Migration Backup'}
                    </div>
                    <div className="backup-timestamp">
                      {formatTimestamp(backup.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreBackup(backup.key)}
                    disabled={isLoading}
                    className="restore-button"
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
      <div className="help-section">
        <h3>Data Management Help</h3>
        <ul className="help-list">
          <li><strong>Export:</strong> Download all your data as a JSON file</li>
          <li><strong>Import:</strong> Upload and restore data from a JSON file</li>
          <li><strong>Backup:</strong> Create a restore point stored locally</li>
          <li><strong>Validate:</strong> Check data integrity and consistency</li>
        </ul>
      </div>
    </div>
  );
}; 