# ToDo List Tracker - System Architecture

## Architecture Overview

### System Design Pattern
**Pattern:** Component-Based Architecture with Centralized State Management  
**Framework:** React 18+ with TypeScript  
**State Management:** React Context API + useReducer for complex state  
**Data Flow:** Unidirectional data flow with event-driven updates  

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
├─────────────────────────────────────────────────────────────┤
│  App.tsx  │  DateSelector  │  ProgressAnimation  │  Schedule │
│           │  Component     │  Component          │  Component│
│           │                │                     │           │
│  DayView  │  EntryForm     │  TaskItem           │  UI       │
│  Component│  Component     │  Component          │  Components│
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  TodoContext   │  DateContext   │  AnimationHandler         │
│  (State Mgmt)  │  (Date State)  │  (Animation Controller)   │
│                │                │                           │
│  TodoService   │  DateService   │  ValidationService        │
│  (CRUD Ops)    │  (Date Utils)  │  (Input Validation)       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  LocalStorageService  │  DataStructures  │  TypeDefinitions │
│  (Persistence)        │  (Year/Month/Day)│  (TypeScript)    │
└─────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Core Data Structures

#### Type Definitions (types/index.ts)
```typescript
// Base TodoItem interface
interface TodoItem {
  id: string;                    // UUID for unique identification
  title: string;                 // Required task title
  description: string;           // Optional task description
  pointValue: number;           // Positive integer (1-100)
  isCompleted: boolean;         // Completion status
  createdAt: Date;              // Creation timestamp
  completedAt?: Date;           // Completion timestamp (optional)
}

// Day schedule containing all tasks for a specific date
interface DaySchedule {
  date: string;                 // ISO date string (YYYY-MM-DD)
  totalPointValue: number;      // Sum of all task points
  totalCompletedPointValue: number; // Sum of completed task points
  todoItems: TodoItem[];        // All tasks for this day
  completedTodoItems: TodoItem[]; // Computed: completed tasks
  incompleteTodoItems: TodoItem[]; // Computed: incomplete tasks
}

// Month schedule containing all days in a month
interface MonthSchedule {
  date: string;                 // ISO month string (YYYY-MM)
  daySchedules: Map<string, DaySchedule>; // Key: date string, Value: DaySchedule
  totalMonthPoints: number;     // Computed: sum of all day points
  totalCompletedMonthPoints: number; // Computed: sum of completed points
}

// Year schedule containing all months in a year
interface YearSchedule {
  year: number;                 // Year number (2025, 2026, etc.)
  monthSchedules: Map<string, MonthSchedule>; // Key: month string, Value: MonthSchedule
  totalYearPoints: number;      // Computed: sum of all month points
  totalCompletedYearPoints: number; // Computed: sum of completed points
}

// Entry form data for creating new todos
interface EntryFormData {
  title: string;
  description: string;
  pointValue: string;           // String for input validation
}

// Current application state
interface AppState {
  selectedDate: Date;           // Currently viewed date
  currentYear: number;          // Current year being viewed
  yearSchedule: YearSchedule;   // Complete year data
  isDateSelectorOpen: boolean;  // Date selector modal state
  isLoading: boolean;          // Loading state for async operations
}
```

### Data Flow Architecture

#### State Management Strategy
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Action   │───▶│   Action Creator │───▶│    Reducer      │
│                 │    │                  │    │                 │
│ - Add Todo      │    │ - ADD_TODO       │    │ - Update State  │
│ - Complete Todo │    │ - COMPLETE_TODO  │    │ - Trigger Side  │
│ - Change Date   │    │ - SET_DATE       │    │   Effects       │
│ - Open Calendar │    │ - TOGGLE_CALENDAR│    │ - Validate Data │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Persistence   │◀───│   Side Effects   │◀───│   Updated State │
│                 │    │                  │    │                 │
│ - Save to Local │    │ - Save Data      │    │ - New Todo List │
│   Storage       │    │ - Trigger Anim   │    │ - Updated Totals│
│ - Auto Backup   │    │ - Validate Input │    │ - UI Updates    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Component Architecture

### Component Hierarchy

```
App.tsx (Root Component)
├── TodoProvider (Context Provider)
│   ├── DateProvider (Context Provider)
│   │   ├── AppHeader
│   │   │   ├── DateDisplay
│   │   │   └── DateSelectorButton
│   │   ├── DateSelectorModal
│   │   │   ├── CalendarGrid
│   │   │   ├── MonthNavigation
│   │   │   └── DatePickerButton
│   │   ├── MainContent
│   │   │   ├── ProgressAnimationContainer
│   │   │   │   └── CircleFillAnimation (Existing)
│   │   │   ├── ScheduleContainer
│   │   │   │   ├── ScheduleHeader
│   │   │   │   ├── TaskList
│   │   │   │   │   └── TaskItem[]
│   │   │   │   │       ├── TaskContent
│   │   │   │   │       ├── PointBadge
│   │   │   │   │       └── CompletionToggle
│   │   │   │   └── EmptyState
│   │   │   └── EntryFormContainer
│   │   │       ├── EntryForm
│   │   │       │   ├── TitleInput
│   │   │       │   ├── DescriptionInput
│   │   │       │   ├── PointValueInput
│   │   │       │   └── SubmitButton
│   │   │       └── FormValidation
│   │   └── ErrorBoundary
```

### Component Specifications

#### App.tsx (Root Component)
**Purpose:** Application entry point and provider setup  
**Responsibilities:**
- Initialize global state providers
- Setup error boundaries
- Handle application-level routing (if needed)
- Manage global loading states

**Props:** None  
**State:** Application-level error state  
**Hooks Used:** ErrorBoundary logic

#### TodoProvider (Context Provider)
**Purpose:** Manage todo-related state and operations  
**Responsibilities:**
- Maintain TodoContext state
- Provide todo CRUD operations
- Handle data persistence
- Trigger animations on completion

**State Interface:**
```typescript
interface TodoContextState {
  yearSchedule: YearSchedule;
  selectedDate: Date;
  isLoading: boolean;
  error: string | null;
}

interface TodoContextActions {
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt'>) => Promise<void>;
  completeTodo: (todoId: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  loadYearData: (year: number) => Promise<void>;
  clearError: () => void;
}
```

#### DateProvider (Context Provider)
**Purpose:** Manage date-related state and calendar functionality  
**Responsibilities:**
- Track selected date
- Handle calendar navigation
- Manage date selector modal state
- Provide date utility functions

#### ProgressAnimationContainer
**Purpose:** Container for the existing circle fill animation  
**Responsibilities:**
- Monitor todo completion events
- Calculate animation parameters based on point values
- Trigger CircleFillAnimation component
- Manage animation queue for multiple rapid completions

**Props:**
```typescript
interface ProgressAnimationProps {
  onAnimationComplete?: () => void;
  className?: string;
}
```

**Animation Integration:**
- Listen to todo completion events
- Extract point value from completed todo
- Pass point value to existing CircleFillAnimation
- Queue multiple animations if needed

#### ScheduleContainer
**Purpose:** Display and manage the daily task list  
**Responsibilities:**
- Render task list for selected date
- Handle task completion interactions
- Manage scroll behavior for 10+ items
- Display empty state when no tasks

**Props:**
```typescript
interface ScheduleContainerProps {
  selectedDate: Date;
  className?: string;
}
```

#### TaskItem Component
**Purpose:** Individual task display and interaction  
**Responsibilities:**
- Display task title, description, and points
- Handle completion toggle
- Show appropriate point color coding
- Apply completion styling (strikethrough, gray background)

**Props:**
```typescript
interface TaskItemProps {
  todo: TodoItem;
  onComplete: (todoId: string) => void;
  className?: string;
}
```

**Styling Logic:**
```typescript
const getPointColor = (points: number): string => {
  if (points <= 5) return 'bg-green-500';
  if (points <= 19) return 'bg-blue-500';
  if (points <= 29) return 'bg-purple-500';
  return 'bg-orange-500';
};

const getTaskStyling = (isCompleted: boolean) => ({
  backgroundColor: isCompleted ? '#f3f4f6' : '#ffffff',
  textDecoration: isCompleted ? 'line-through' : 'none',
  opacity: isCompleted ? 0.8 : 1.0
});
```

#### EntryForm Component
**Purpose:** Handle new todo creation  
**Responsibilities:**
- Manage form input state
- Validate user input
- Submit new todo to context
- Reset form after submission
- Display validation errors

**Props:**
```typescript
interface EntryFormProps {
  selectedDate: Date;
  onSubmit?: (todo: EntryFormData) => void;
  className?: string;
}
```

**Validation Rules:**
- Title: Required, 1-100 characters
- Description: Optional, 0-500 characters  
- Point Value: Required, positive integer 1-100

#### DateSelectorModal
**Purpose:** Calendar interface for date navigation  
**Responsibilities:**
- Display month calendar grid
- Handle date selection
- Navigate between months/years
- Highlight current date and selected date
- Modal behavior (slide down, overlay)

**Props:**
```typescript
interface DateSelectorModalProps {
  isOpen: boolean;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}
```

## Service Layer Architecture

### TodoService
**Purpose:** Business logic for todo operations  
**Location:** `src/services/TodoService.ts`

**Methods:**
```typescript
class TodoService {
  // CRUD Operations
  static async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>): Promise<TodoItem>;
  static async updateTodo(todoId: string, updates: Partial<TodoItem>): Promise<TodoItem>;
  static async deleteTodo(todoId: string): Promise<void>;
  static async completeTodo(todoId: string): Promise<TodoItem>;
  
  // Retrieval Operations
  static async getTodosForDate(date: Date): Promise<TodoItem[]>;
  static async getDaySchedule(date: Date): Promise<DaySchedule>;
  static async getMonthSchedule(year: number, month: number): Promise<MonthSchedule>;
  static async getYearSchedule(year: number): Promise<YearSchedule>;
  
  // Calculation Operations
  static calculateDayTotals(todos: TodoItem[]): { total: number; completed: number };
  static calculateMonthTotals(monthSchedule: MonthSchedule): { total: number; completed: number };
  static calculateYearTotals(yearSchedule: YearSchedule): { total: number; completed: number };
}
```

### DateService
**Purpose:** Date-related utility functions  
**Location:** `src/services/DateService.ts`

**Methods:**
```typescript
class DateService {
  // Date Formatting
  static formatDisplayDate(date: Date): string; // MM/DD/YY format
  static formatISODate(date: Date): string;     // YYYY-MM-DD format
  static formatISOMonth(date: Date): string;    // YYYY-MM format
  
  // Date Navigation
  static getMonthStart(date: Date): Date;
  static getMonthEnd(date: Date): Date;
  static getYearStart(year: number): Date;
  static getYearEnd(year: number): Date;
  static addMonths(date: Date, months: number): Date;
  static isToday(date: Date): boolean;
  static isSameDay(date1: Date, date2: Date): boolean;
  
  // Calendar Generation
  static generateCalendarDays(year: number, month: number): Date[];
  static getWeekdays(): string[];
  static getDaysInMonth(year: number, month: number): number;
}
```

### LocalStorageService
**Purpose:** Data persistence and retrieval  
**Location:** `src/services/LocalStorageService.ts`

**Methods:**
```typescript
class LocalStorageService {
  // Core Storage Operations
  static async saveYearSchedule(yearSchedule: YearSchedule): Promise<void>;
  static async loadYearSchedule(year: number): Promise<YearSchedule | null>;
  static async saveDaySchedule(daySchedule: DaySchedule): Promise<void>;
  static async loadDaySchedule(date: Date): Promise<DaySchedule | null>;
  
  // Backup and Migration
  static async exportData(): Promise<string>; // JSON export
  static async importData(data: string): Promise<void>;
  static async migrateDataStructure(): Promise<void>;
  static async clearAllData(): Promise<void>;
  
  // Utility Methods
  static getStorageKey(type: 'year' | 'day', identifier: string): string;
  static isStorageAvailable(): boolean;
  static getStorageUsage(): { used: number; available: number };
}
```

### ValidationService
**Purpose:** Input validation and data integrity  
**Location:** `src/services/ValidationService.ts`

**Methods:**
```typescript
class ValidationService {
  // Todo Validation
  static validateTodoInput(input: EntryFormData): ValidationResult;
  static validateTodoItem(todo: TodoItem): ValidationResult;
  static sanitizeTodoInput(input: EntryFormData): EntryFormData;
  
  // Date Validation
  static validateDate(date: Date): boolean;
  static isValidYear(year: number): boolean;
  static isValidMonth(month: number): boolean;
  
  // Data Structure Validation
  static validateYearSchedule(yearSchedule: YearSchedule): ValidationResult;
  static validateDaySchedule(daySchedule: DaySchedule): ValidationResult;
  
  // Utility Types
  interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }
}
```

## Animation Integration Architecture

### AnimationHandler
**Purpose:** Coordinate between todo completion and circle fill animation  
**Location:** `src/services/AnimationHandler.ts`

**Integration Strategy:**
```typescript
class AnimationHandler {
  private animationQueue: AnimationRequest[] = [];
  private isAnimating: boolean = false;
  
  // Queue animation based on completed todo
  static queueAnimation(completedTodo: TodoItem): void;
  
  // Process animation queue
  private static async processQueue(): Promise<void>;
  
  // Convert point value to animation parameters
  private static mapPointsToAnimation(points: number): AnimationParams;
  
  // Interface with existing CircleFillAnimation
  private static triggerCircleFillAnimation(params: AnimationParams): Promise<void>;
}

interface AnimationRequest {
  todoId: string;
  pointValue: number;
  timestamp: Date;
}

interface AnimationParams {
  ballCount: number;      // Equal to point value
  duration: number;       // Animation duration in ms
  colors: string[];       // Ball colors
  intensity: number;      // Animation intensity
}
```

### Animation Event Flow
```
Todo Completion → AnimationHandler.queueAnimation() → CircleFillAnimation
     ↓                        ↓                            ↓
Update UI State → Calculate Animation Params → Trigger Animation
     ↓                        ↓                            ↓
Persist Data → Add to Queue → Play Animation → Update Progress
```

## Error Handling Architecture

### Error Boundary Strategy
```typescript
// Global Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Service-Level Error Handling
interface ServiceError {
  type: 'VALIDATION' | 'STORAGE' | 'NETWORK' | 'ANIMATION';
  message: string;
  context: any;
  timestamp: Date;
  recoverable: boolean;
}

// Error Recovery Strategies
class ErrorRecoveryService {
  static handleStorageError(error: ServiceError): Promise<void>;
  static handleValidationError(error: ServiceError): ValidationResult;
  static handleAnimationError(error: ServiceError): void;
  static showUserNotification(error: ServiceError): void;
}
```

## Performance Architecture

### Optimization Strategies

#### Component Optimization
- **React.memo:** Memoize TaskItem components to prevent unnecessary re-renders
- **useMemo:** Cache expensive calculations (day totals, month totals)
- **useCallback:** Memoize event handlers to prevent child re-renders
- **Virtual Scrolling:** Implement for large task lists (100+ items)

#### State Optimization
- **Selective Updates:** Only update affected date ranges
- **Lazy Loading:** Load month data on demand
- **Debounced Saves:** Batch storage operations
- **Computed Properties:** Cache calculated values

#### Animation Optimization
- **Animation Queue:** Prevent animation overlap and memory leaks
- **RAF Optimization:** Use requestAnimationFrame for smooth animations
- **Cleanup:** Proper animation cleanup on component unmount

#### Storage Optimization
- **Compression:** Compress JSON data for storage
- **Incremental Saves:** Only save changed data
- **Background Sync:** Non-blocking storage operations
- **Cache Strategy:** In-memory cache for frequently accessed data

## Security Architecture

### Data Security
- **Input Sanitization:** All user inputs sanitized before storage
- **XSS Prevention:** Proper HTML escaping for user-generated content
- **Data Validation:** Server-side style validation for all data
- **Storage Encryption:** Optional encryption for sensitive data

### Application Security
- **CSP Headers:** Content Security Policy for XSS protection
- **Dependency Audit:** Regular security audits of npm dependencies
- **Error Handling:** No sensitive data exposure in error messages
- **Environment Variables:** Secure configuration management