import { ValidationService } from '../ValidationService';
import { TodoItem, DaySchedule, YearSchedule, EntryFormData } from '../../types';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = ValidationService.getInstance();
  });

  describe('validateTodoInput', () => {
    it('should validate valid todo input', () => {
      const input: EntryFormData = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: '50'
      };

      const result = validationService.validateTodoInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty title', () => {
      const input: EntryFormData = {
        title: '',
        description: 'Test Description',
        pointValue: '50'
      };

      const result = validationService.validateTodoInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should reject title longer than 100 characters', () => {
      const input: EntryFormData = {
        title: 'a'.repeat(101),
        description: 'Test Description',
        pointValue: '50'
      };

      const result = validationService.validateTodoInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title must be 100 characters or less');
    });

    it('should reject description longer than 500 characters', () => {
      const input: EntryFormData = {
        title: 'Test Todo',
        description: 'a'.repeat(501),
        pointValue: '50'
      };

      const result = validationService.validateTodoInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be 500 characters or less');
    });

    it('should reject invalid point values', () => {
      const testCases = [
        { value: '0', expected: 'Point value must be between 1 and 100' },
        { value: '101', expected: 'Point value must be between 1 and 100' },
        { value: 'abc', expected: 'Point value must be a number' },
        { value: '-1', expected: 'Point value must be between 1 and 100' }
      ];

      testCases.forEach(({ value, expected }) => {
        const input: EntryFormData = {
          title: 'Test Todo',
          description: 'Test Description',
          pointValue: value
        };

        const result = validationService.validateTodoInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expected);
      });
    });

    it('should detect XSS in title and description', () => {
      const input: EntryFormData = {
        title: '<script>alert("xss")</script>',
        description: 'javascript:alert("xss")',
        pointValue: '50'
      };

      const result = validationService.validateTodoInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title contains potentially harmful content');
      expect(result.errors).toContain('Description contains potentially harmful content');
    });
  });

  describe('validateTodoItem', () => {
    it('should validate valid todo item', () => {
      const todo: TodoItem = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 50,
        isCompleted: false,
        createdAt: new Date()
      };

      const result = validationService.validateTodoItem(todo);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate completed todo item', () => {
      const todo: TodoItem = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 50,
        isCompleted: true,
        createdAt: new Date(),
        completedAt: new Date()
      };

      const result = validationService.validateTodoItem(todo);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject todo item without required fields', () => {
      const todo = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 50,
        isCompleted: false,
        createdAt: new Date()
      } as TodoItem;

      const result = validationService.validateTodoItem(todo);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Todo ID is required');
    });

    it('should reject completed todo without completion date', () => {
      const todo: TodoItem = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 50,
        isCompleted: true,
        createdAt: new Date()
      };

      const result = validationService.validateTodoItem(todo);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Completion date is required for completed todos');
    });
  });

  describe('sanitizeTodoInput', () => {
    it('should sanitize input strings', () => {
      const input: EntryFormData = {
        title: '<script>alert("xss")</script>',
        description: 'javascript:alert("xss")',
        pointValue: '50'
      };

      const result = validationService.sanitizeTodoInput(input);
      expect(result.title).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result.description).toBe('javascript:alert(&quot;xss&quot;)');
      expect(result.pointValue).toBe('50');
    });

    it('should handle empty strings', () => {
      const input: EntryFormData = {
        title: '',
        description: '',
        pointValue: '50'
      };

      const result = validationService.sanitizeTodoInput(input);
      expect(result.title).toBe('');
      expect(result.description).toBe('');
      expect(result.pointValue).toBe('50');
    });
  });

  describe('validateDaySchedule', () => {
    it('should validate valid day schedule', () => {
      const schedule: DaySchedule = {
        date: '2024-01-15',
        totalPointValue: 100,
        totalCompletedPointValue: 50,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const result = validationService.validateDaySchedule(schedule);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid date format', () => {
      const schedule: DaySchedule = {
        date: 'invalid-date',
        totalPointValue: 100,
        totalCompletedPointValue: 50,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const result = validationService.validateDaySchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });

    it('should reject negative point values', () => {
      const schedule: DaySchedule = {
        date: '2024-01-15',
        totalPointValue: -1,
        totalCompletedPointValue: 50,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const result = validationService.validateDaySchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total point value cannot be negative');
    });

    it('should reject completed points exceeding total points', () => {
      const schedule: DaySchedule = {
        date: '2024-01-15',
        totalPointValue: 50,
        totalCompletedPointValue: 100,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const result = validationService.validateDaySchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Completed points cannot exceed total points');
    });
  });

  describe('validateYearSchedule', () => {
    it('should validate valid year schedule', () => {
      const schedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 1000,
        totalCompletedYearPoints: 500
      };

      const result = validationService.validateYearSchedule(schedule);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid year', () => {
      const schedule: YearSchedule = {
        year: 1800,
        monthSchedules: new Map(),
        totalYearPoints: 1000,
        totalCompletedYearPoints: 500
      };

      const result = validationService.validateYearSchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid year');
    });

    it('should reject invalid month schedules', () => {
      const schedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map([['invalid-month', {
          date: '2024-01',
          daySchedules: new Map(),
          totalMonthPoints: 0,
          totalCompletedMonthPoints: 0
        }]]),
        totalYearPoints: 1000,
        totalCompletedYearPoints: 500
      };

      const result = validationService.validateYearSchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid month format: invalid-month');
    });

    it('should reject negative point totals', () => {
      const schedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: -1,
        totalCompletedYearPoints: 500
      };

      const result = validationService.validateYearSchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total year points cannot be negative');
    });

    it('should reject completed points exceeding total points', () => {
      const schedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 500,
        totalCompletedYearPoints: 1000
      };

      const result = validationService.validateYearSchedule(schedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Completed points cannot exceed total points');
    });
  });
}); 