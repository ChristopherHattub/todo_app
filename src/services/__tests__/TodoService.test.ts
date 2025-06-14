import { TodoService } from '../TodoService';
import { LocalStorageService } from '../LocalStorageService';
import { TodoItem, DaySchedule, MonthSchedule, YearSchedule } from '../../types';

// Mock LocalStorageService
jest.mock('../LocalStorageService');

describe('TodoService', () => {
  let todoService: TodoService;
  const mockDate = new Date('2024-01-01');
  const mockTodo: Omit<TodoItem, 'id' | 'createdAt'> = {
    title: 'Test Todo',
    description: 'Test Description',
    pointValue: 10,
    isCompleted: false
  };

  const mockYearSchedule: YearSchedule = {
    year: 2024,
    monthSchedules: new Map(),
    totalYearPoints: 0,
    totalCompletedYearPoints: 0
  };

  const mockMonthSchedule: MonthSchedule = {
    date: '2024-01',
    daySchedules: new Map(),
    totalMonthPoints: 0,
    totalCompletedMonthPoints: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    todoService = TodoService.getInstance();

    // Mock loadYearSchedule to return a valid response
    (LocalStorageService.loadYearSchedule as jest.Mock).mockResolvedValue({
      success: true,
      data: mockYearSchedule
    });
  });

  describe('createTodo', () => {
    it('should create a new todo and update day schedule', async () => {
      const mockDaySchedule: DaySchedule = {
        date: mockDate.toISOString().split('T')[0],
        totalPointValue: 0,
        totalCompletedPointValue: 0,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      (LocalStorageService.loadDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      (LocalStorageService.saveDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      const result = await todoService.createTodo(mockTodo);

      expect(result.todo).toMatchObject({
        ...mockTodo,
        id: expect.any(String),
        createdAt: expect.any(Date)
      });
      expect(result.daySchedule.todoItems).toHaveLength(1);
      expect(result.daySchedule.totalPointValue).toBe(mockTodo.pointValue);
      expect(LocalStorageService.saveDaySchedule).toHaveBeenCalled();
    });
  });

  describe('updateTodo', () => {
    it('should update an existing todo', async () => {
      const existingTodo: TodoItem = {
        id: '1',
        ...mockTodo,
        createdAt: new Date()
      };

      const mockDaySchedule: DaySchedule = {
        date: mockDate.toISOString().split('T')[0],
        totalPointValue: existingTodo.pointValue,
        totalCompletedPointValue: 0,
        todoItems: [existingTodo],
        completedTodoItems: [],
        incompleteTodoItems: [existingTodo]
      };

      (LocalStorageService.loadDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      (LocalStorageService.saveDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      const updates = { title: 'Updated Title' };
      const result = await todoService.updateTodo('1', updates);

      expect(result.todo.title).toBe('Updated Title');
      expect(LocalStorageService.saveDaySchedule).toHaveBeenCalled();
    });

    it('should throw error if todo not found', async () => {
      const mockDaySchedule: DaySchedule = {
        date: mockDate.toISOString().split('T')[0],
        totalPointValue: 0,
        totalCompletedPointValue: 0,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      (LocalStorageService.loadDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      await expect(todoService.updateTodo('nonexistent', { title: 'New Title' }))
        .rejects
        .toThrow('Todo with id nonexistent not found');
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo and update day schedule', async () => {
      const existingTodo: TodoItem = {
        id: '1',
        ...mockTodo,
        createdAt: new Date()
      };

      const mockDaySchedule: DaySchedule = {
        date: mockDate.toISOString().split('T')[0],
        totalPointValue: existingTodo.pointValue,
        totalCompletedPointValue: 0,
        todoItems: [existingTodo],
        completedTodoItems: [],
        incompleteTodoItems: [existingTodo]
      };

      (LocalStorageService.loadDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      (LocalStorageService.saveDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      const result = await todoService.deleteTodo('1');

      expect(result.daySchedule.todoItems).toHaveLength(0);
      expect(result.daySchedule.totalPointValue).toBe(0);
      expect(LocalStorageService.saveDaySchedule).toHaveBeenCalled();
    });
  });

  describe('completeTodo', () => {
    it('should mark a todo as completed', async () => {
      const existingTodo: TodoItem = {
        id: '1',
        ...mockTodo,
        createdAt: new Date()
      };

      const mockDaySchedule: DaySchedule = {
        date: mockDate.toISOString().split('T')[0],
        totalPointValue: existingTodo.pointValue,
        totalCompletedPointValue: 0,
        todoItems: [existingTodo],
        completedTodoItems: [],
        incompleteTodoItems: [existingTodo]
      };

      (LocalStorageService.loadDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      (LocalStorageService.saveDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      const result = await todoService.completeTodo('1');

      expect(result.todo.isCompleted).toBe(true);
      expect(result.todo.completedAt).toBeInstanceOf(Date);
      expect(result.daySchedule.completedTodoItems).toHaveLength(1);
      expect(result.daySchedule.incompleteTodoItems).toHaveLength(0);
      expect(LocalStorageService.saveDaySchedule).toHaveBeenCalled();
    });
  });

  describe('getTodosForDate', () => {
    it('should return todos for a specific date', async () => {
      const existingTodo: TodoItem = {
        id: '1',
        ...mockTodo,
        createdAt: new Date()
      };

      const mockDaySchedule: DaySchedule = {
        date: mockDate.toISOString().split('T')[0],
        totalPointValue: existingTodo.pointValue,
        totalCompletedPointValue: 0,
        todoItems: [existingTodo],
        completedTodoItems: [],
        incompleteTodoItems: [existingTodo]
      };

      (LocalStorageService.loadDaySchedule as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDaySchedule
      });

      const result = await todoService.getTodosForDate(mockDate);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(existingTodo);
    });
  });

  describe('calculateDayTotals', () => {
    it('should calculate correct totals for todos', () => {
      const todos: TodoItem[] = [
        {
          id: '1',
          title: 'Todo 1',
          description: 'Description 1',
          pointValue: 10,
          isCompleted: true,
          createdAt: new Date(),
          completedAt: new Date()
        },
        {
          id: '2',
          title: 'Todo 2',
          description: 'Description 2',
          pointValue: 20,
          isCompleted: false,
          createdAt: new Date()
        }
      ];

      const result = todoService.calculateDayTotals(todos);

      expect(result).toEqual({
        total: 30,
        completed: 10
      });
    });
  });

  describe('calculateMonthTotals', () => {
    it('should calculate correct totals for month schedule', () => {
      const mockDaySchedule1: DaySchedule = {
        date: '2024-01-01',
        totalPointValue: 30,
        totalCompletedPointValue: 10,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const mockDaySchedule2: DaySchedule = {
        date: '2024-01-02',
        totalPointValue: 20,
        totalCompletedPointValue: 20,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const mockMonthSchedule: MonthSchedule = {
        date: '2024-01',
        daySchedules: new Map([
          ['2024-01-01', mockDaySchedule1],
          ['2024-01-02', mockDaySchedule2]
        ]),
        totalMonthPoints: 50,
        totalCompletedMonthPoints: 30
      };

      const result = todoService.calculateMonthTotals(mockMonthSchedule);

      expect(result).toEqual({
        total: 50,
        completed: 30
      });
    });
  });
}); 