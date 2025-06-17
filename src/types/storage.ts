/**
 * Storage-specific type definitions for the ToDo List Tracker application
 */

export interface MigrationResult {
  /** Whether the migration was successful */
  success: boolean;
  /** Migration details */
  fromProvider: string;
  toProvider: string;
  /** Number of items migrated */
  itemsMigrated: number;
  /** Any errors that occurred during migration */
  errors: string[];
  /** Duration of migration in milliseconds */
  duration: number;
}

export interface StorageProviderCapabilities {
  /** Maximum storage size in bytes */
  maxSize: number;
  /** Whether the provider supports compression */
  supportsCompression: boolean;
  /** Whether the provider is available */
  isAvailable: boolean;
  /** Whether data persists across sessions */
  isPersistent: boolean;
  /** Provider type identifier */
  type: StorageProviderType;
}

export type StorageProviderType = 'localStorage' | 'indexedDB' | 'memory';

export interface StorageQuotaInfo {
  /** Total storage quota in bytes */
  quota: number;
  /** Used storage in bytes */
  usage: number;
  /** Available storage in bytes */
  available: number;
}

export interface IndexedDBConfig {
  /** Database name */
  dbName: string;
  /** Database version */
  version: number;
  /** Store names */
  stores: {
    yearSchedules: string;
    daySchedules: string;
  };
}

export interface StorageBackupMetadata {
  /** Backup creation timestamp */
  createdAt: Date;
  /** Source provider type */
  sourceProvider: StorageProviderType;
  /** App version when backup was created */
  appVersion: string;
  /** Number of items in backup */
  itemCount: number;
  /** Backup size in bytes */
  size: number;
} 