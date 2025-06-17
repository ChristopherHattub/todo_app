

## TASK-007: Update Data Persistence Layer
**Priority:** P1  
**Category:** DATA_PERSISTENCE  
**Estimated Time:** 2 hours

**Description:** Refactor storage services to work with the new dependency injection system and ensure proper separation of concerns.

### Implementation Steps:

#### 1. Update Storage Service Implementation
**File:** `src/services/LocalStorageService.ts`
**Purpose:** Implement IStorageService interface for localStorage persistence
**Context:** Provide concrete implementation of storage operations with proper error handling and type safety

**Key Functionality:**
- Implement all IStorageService interface methods
- Handle localStorage availability and quota limits
- Provide proper error handling with typed responses
- Support data export/import functionality
- Implement storage info reporting

**Integration Points:**
- Used by TodoService through dependency injection
- May be swapped with other storage implementations
- Returns structured StorageResponse objects

```typescript
// src/services/LocalStorageService.ts - Updated stub
export class LocalStorageService implements IStorageService {
  async saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>> {
    // Implement localStorage save with error handling
  }
  
  async loadYearSchedule(year: number): Promise<StorageResponse<YearSchedule | null>> {
    // Implement localStorage load with validation
  }
  
  // ... other interface methods
}
```

#### 2. Create Alternative Storage Implementations
**File:** `src/services/MemoryStorageService.ts`
**Purpose:** In-memory storage implementation for testing and development
**Context:** Provides volatile storage that resets on page refresh, useful for testing

**Key Functionality:**
- Implement IStorageService with in-memory Map storage
- Provide immediate synchronous-like operations
- Support all storage operations without persistence
- Enable easy testing without localStorage dependencies

```typescript
// src/services/MemoryStorageService.ts - Stub
export class MemoryStorageService implements IStorageService {
  private store = new Map<string, any>();
  
  async saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>> {
    // Store in memory map
  }
  
  // ... implement interface
}
```

**File:** `src/services/IndexedDBStorageService.ts`
**Purpose:** IndexedDB implementation for larger data storage needs
**Context:** Future-proofing for advanced storage requirements like offline support

**Key Functionality:**
- Implement IStorageService using IndexedDB
- Handle async database operations
- Provide structured data storage with indexes
- Support larger data volumes than localStorage

```typescript
// src/services/IndexedDBStorageService.ts - Stub
export class IndexedDBStorageService implements IStorageService {
  private dbName = 'TodoAppDB';
  private dbVersion = 1;
  
  async saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>> {
    // Implement IndexedDB operations
  }
  
  // ... implement interface
}
```

#### 3. Update Storage Factory
**File:** `src/services/factories/StorageServiceFactory.ts`
**Purpose:** Factory that creates appropriate storage service based on configuration
**Context:** Enables runtime selection of storage provider through configuration

**Key Functionality:**
- Read storage provider from config service
- Instantiate appropriate storage implementation
- Handle fallback scenarios (e.g., IndexedDB not available)
- Provide error handling for storage initialization

**Integration Points:**
- Uses IConfigService to determine provider
- Creates storage instances for dependency injection
- May need to test storage availability

```typescript
// src/services/factories/StorageServiceFactory.ts - Enhanced stub
export class StorageServiceFactory implements ServiceFactory<IStorageService> {
  dependencies = [SERVICE_TOKENS.CONFIG_SERVICE];

  create(container: IServiceContainer): IStorageService {
    const configService = container.resolve(SERVICE_TOKENS.CONFIG_SERVICE);
    const storageConfig = configService.getConfigValue('storage.provider');
    
    // Create appropriate storage based on config
    // Handle fallbacks and availability checks
  }
}
```

#### 4. Create Data Migration Service
**File:** `src/services/DataMigrationService.ts`
**Purpose:** Handle data format migrations and storage provider transitions
**Context:** Ensures backward compatibility when data structures or storage methods change

**Key Functionality:**
- Detect existing data format versions
- Migrate data between storage providers
- Handle schema updates and data transformations
- Provide rollback capabilities for failed migrations

**Integration Points:**
- Used during application bootstrap
- Works with all storage service implementations
- May trigger during storage provider changes

```typescript
// src/services/DataMigrationService.ts - Stub
export class DataMigrationService {
  constructor(
    private sourceStorage: IStorageService,
    private targetStorage: IStorageService
  ) {}
  
  async migrateData(): Promise<MigrationResult> {
    // Detect current data version
    // Transform data if needed
    // Copy to new storage format
  }
}
```

### Files to Create:
- `src/services/MemoryStorageService.ts`
- `src/services/IndexedDBStorageService.ts`
- `src/services/DataMigrationService.ts`
- `src/types/storage.ts` (storage-specific types)

### Files to Modify:
- `src/services/LocalStorageService.ts` (implement interface)
- `src/services/factories/StorageServiceFactory.ts` (enhance)
- `src/services/TodoService.ts` (use injected storage)

### Acceptance Criteria:
- [ ] All storage services implement IStorageService interface
- [ ] Storage provider configurable through config service
- [ ] Proper error handling and typed responses
- [ ] Data migration between storage providers works
- [ ] TodoService uses injected storage service
- [ ] Storage availability properly detected and handled

---
