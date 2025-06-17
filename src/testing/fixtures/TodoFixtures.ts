import { TodoItem, DaySchedule, MonthSchedule, YearSchedule } from '../../types';

/**
 * Base todo item fixture
 */
export const createBaseTodoItem = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  id: 'todo-1',
  title: 'Test Todo Item',
  description: 'This is a test todo item',
  pointValue: 10,
  isCompleted: false,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides
});

/**
 * Completed todo item fixture
 */
export const createCompletedTodoItem = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  ...createBaseTodoItem(overrides),
  isCompleted: true,
  completedAt: new Date('2024-01-01T15:00:00Z'),
  ...overrides
});

/**
 * High priority todo item fixture
 */
export const createHighPriorityTodoItem = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  ...createBaseTodoItem(overrides),
  title: 'High Priority Task',
  pointValue: 50,
  ...overrides
});

/**
 * Low priority todo item fixture
 */
export const createLowPriorityTodoItem = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  ...createBaseTodoItem(overrides),
  title: 'Low Priority Task',
  pointValue: 5,
  ...overrides
});

/**
 * Collection of todo items for testing lists
 */
export const createTodoCollection = (count: number = 5): TodoItem[] => {
  return Array.from({ length: count }, (_, index) => 
    createBaseTodoItem({
      id: `todo-${index + 1}`,
      title: `Todo Item ${index + 1}`,
      pointValue: (index + 1) * 10,
      isCompleted: index % 2 === 0
    })
  );
};

/**
 * Mixed priority todo collection
 */
export const createMixedPriorityTodos = (): TodoItem[] => [
  createHighPriorityTodoItem({ id: 'todo-high-1', title: 'Critical Bug Fix' }),
  createBaseTodoItem({ id: 'todo-med-1', title: 'Update Documentation' }),
  createLowPriorityTodoItem({ id: 'todo-low-1', title: 'Clean Desktop' }),
  createHighPriorityTodoItem({ id: 'todo-high-2', title: 'Client Presentation', pointValue: 100 }),
  createBaseTodoItem({ id: 'todo-med-2', title: 'Code Review' })
];

/**
 * Completed todos for testing statistics
 */
export const createCompletedTodos = (): TodoItem[] => [
  createCompletedTodoItem({ id: 'completed-1', title: 'Finished Task 1', pointValue: 20 }),
  createCompletedTodoItem({ id: 'completed-2', title: 'Finished Task 2', pointValue: 30 }),
  createCompletedTodoItem({ id: 'completed-3', title: 'Finished Task 3', pointValue: 15 })
];

/**
 * Day schedule fixture
 */
export const createDaySchedule = (overrides: Partial<DaySchedule> = {}): DaySchedule => {
  const todos = createTodoCollection(3);
  const completedTodos = todos.filter(todo => todo.isCompleted);
  const incompleteTodos = todos.filter(todo => !todo.isCompleted);
  
  return {
    date: '2024-01-01',
    totalPointValue: todos.reduce((sum, todo) => sum + todo.pointValue, 0),
    totalCompletedPointValue: completedTodos.reduce((sum, todo) => sum + todo.pointValue, 0),
    todoItems: todos,
    completedTodoItems: completedTodos,
    incompleteTodoItems: incompleteTodos,
    ...overrides
  };
};

/**
 * Empty day schedule fixture
 */
export const createEmptyDaySchedule = (date: string = '2024-01-01'): DaySchedule => ({
  date,
  totalPointValue: 0,
  totalCompletedPointValue: 0,
  todoItems: [],
  completedTodoItems: [],
  incompleteTodoItems: []
});

/**
 * Productive day schedule (high completion rate)
 */
export const createProductiveDaySchedule = (): DaySchedule => {
  const todos = [
    createCompletedTodoItem({ id: 'prod-1', pointValue: 25 }),
    createCompletedTodoItem({ id: 'prod-2', pointValue: 35 }),
    createCompletedTodoItem({ id: 'prod-3', pointValue: 20 }),
    createBaseTodoItem({ id: 'prod-4', pointValue: 10 }) // Only one incomplete
  ];
  
  const completedTodos = todos.filter(todo => todo.isCompleted);
  const incompleteTodos = todos.filter(todo => !todo.isCompleted);
  
  return {
    date: '2024-01-15',
    totalPointValue: todos.reduce((sum, todo) => sum + todo.pointValue, 0),
    totalCompletedPointValue: completedTodos.reduce((sum, todo) => sum + todo.pointValue, 0),
    todoItems: todos,
    completedTodoItems: completedTodos,
    incompleteTodoItems: incompleteTodos
  };
};

/**
 * Month schedule fixture
 */
export const createMonthSchedule = (overrides: Partial<MonthSchedule> = {}): MonthSchedule => {
  const daySchedules = new Map<string, DaySchedule>();
  
  // Create schedules for first 5 days of the month
  for (let day = 1; day <= 5; day++) {
    const date = `2024-01-${day.toString().padStart(2, '0')}`;
    daySchedules.set(date, createDaySchedule({ date }));
  }
  
  const totalMonthPoints = Array.from(daySchedules.values())
    .reduce((sum, day) => sum + day.totalPointValue, 0);
  const totalCompletedMonthPoints = Array.from(daySchedules.values())
    .reduce((sum, day) => sum + day.totalCompletedPointValue, 0);
  
  return {
    date: '2024-01',
    daySchedules,
    totalMonthPoints,
    totalCompletedMonthPoints,
    ...overrides
  };
};

/**
 * Year schedule fixture
 */
export const createYearSchedule = (overrides: Partial<YearSchedule> = {}): YearSchedule => {
  const monthSchedules = new Map<string, MonthSchedule>();
  
  // Create schedules for first 3 months
  for (let month = 1; month <= 3; month++) {
    const monthKey = `2024-${month.toString().padStart(2, '0')}`;
    monthSchedules.set(monthKey, createMonthSchedule({ date: monthKey }));
  }
  
  const totalYearPoints = Array.from(monthSchedules.values())
    .reduce((sum, month) => sum + month.totalMonthPoints, 0);
  const totalCompletedYearPoints = Array.from(monthSchedules.values())
    .reduce((sum, month) => sum + month.totalCompletedMonthPoints, 0);
  
  return {
    year: 2024,
    monthSchedules,
    totalYearPoints,
    totalCompletedYearPoints,
    ...overrides
  };
};

/**
 * Form data fixtures for testing input validation
 */
export const createValidFormData = () => ({
  title: 'Valid Todo Title',
  description: 'This is a valid description for testing',
  pointValue: '25'
});

export const createInvalidFormData = () => ({
  title: '', // Empty title
  description: 'Valid description',
  pointValue: 'invalid' // Invalid point value
});

/**
 * Bulk todo operations fixtures
 */
export const createBulkTodoData = () => ({
  todosToCreate: [
    { title: 'Bulk Todo 1', description: 'First bulk todo', pointValue: 10 },
    { title: 'Bulk Todo 2', description: 'Second bulk todo', pointValue: 15 },
    { title: 'Bulk Todo 3', description: 'Third bulk todo', pointValue: 20 }
  ],
  todosToComplete: ['todo-1', 'todo-2', 'todo-3'],
  todosToDelete: ['todo-4', 'todo-5']
});

/**
 * Performance testing fixtures
 */
export const createLargeTodoCollection = (count: number = 1000): TodoItem[] => {
  return Array.from({ length: count }, (_, index) => 
    createBaseTodoItem({
      id: `perf-todo-${index}`,
      title: `Performance Test Todo ${index}`,
      description: `Description for performance test todo ${index}`,
      pointValue: Math.floor(Math.random() * 100) + 1,
      isCompleted: Math.random() > 0.5,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    })
  );
};

/**
 * Edge case fixtures
 */
export const createEdgeCaseTodos = () => ({
  emptyTitle: createBaseTodoItem({ title: '' }),
  longTitle: createBaseTodoItem({ title: 'x'.repeat(1000) }),
  maxPoints: createBaseTodoItem({ pointValue: 100 }),
  minPoints: createBaseTodoItem({ pointValue: 1 }),
  zeroPoints: createBaseTodoItem({ pointValue: 0 }),
  negativePoints: createBaseTodoItem({ pointValue: -5 }),
  futureDate: createBaseTodoItem({ createdAt: new Date('2030-01-01') }),
  veryOldDate: createBaseTodoItem({ createdAt: new Date('1990-01-01') })
}); 