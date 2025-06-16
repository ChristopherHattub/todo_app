import { YearSchedule, DaySchedule, StorageResponse } from '../../types';

export interface IStorageService {
  // Year Operations
  saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>>;
  loadYearSchedule(year: number): Promise<StorageResponse<YearSchedule | null>>;

  // Day Operations
  saveDaySchedule(daySchedule: DaySchedule): Promise<StorageResponse<DaySchedule>>;
  loadDaySchedule(date: Date): Promise<StorageResponse<DaySchedule | null>>;

  // Bulk Operations
  exportData(): Promise<StorageResponse<string>>;
  importData(data: string): Promise<StorageResponse<void>>;
  clearAllData(): Promise<StorageResponse<void>>;

  // Utility
  isStorageAvailable(): boolean;
  getStorageInfo(): { used: number; available: number; type: string };

  // Lifecycle
  dispose?(): Promise<void>;
} 