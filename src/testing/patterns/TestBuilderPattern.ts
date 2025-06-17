import { TodoItem, DaySchedule, MonthSchedule, YearSchedule } from '../../types';
import { AppConfig } from '../../types/config';

/**
 * Base builder class with common builder functionality
 */
abstract class BaseBuilder<T> {
  protected data: Partial<T> = {};

  /**
   * Build the final object
   */
  abstract build(): T;

  /**
   * Reset the builder to its initial state
   */
  reset(): this {
    this.data = {};
    return this;
  }
}

/**
 * Builder for creating TodoItem test objects
 */
export class TodoTestBuilder extends BaseBuilder<TodoItem> {
  constructor() {
    super();
    // Set default values
    this.data = {
      id: `todo-${Date.now()}`,
      title: 'Test Todo',
      description: 'Test description',
      pointValue: 10,
      isCompleted: false,
      createdAt: new Date()
    };
  }

  /**
   * Set the todo ID
   */
  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set the todo title
   */
  withTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  /**
   * Set the todo description
   */
  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Set the point value
   */
  withPoints(points: number): this {
    this.data.pointValue = points;
    return this;
  }

  /**
   * Mark as completed
   */
  completed(): this {
    this.data.isCompleted = true;
    this.data.completedAt = new Date();
    return this;
  }

  /**
   * Mark as incomplete
   */
  incomplete(): this {
    this.data.isCompleted = false;
    this.data.completedAt = undefined;
    return this;
  }

  /**
   * Set creation date
   */
  createdAt(date: Date): this {
    this.data.createdAt = date;
    return this;
  }

  /**
   * Set completion date
   */
  completedAt(date: Date): this {
    this.data.completedAt = date;
    return this;
  }

  /**
   * Create a high priority todo (50+ points)
   */
  highPriority(): this {
    this.data.pointValue = 50 + Math.floor(Math.random() * 50);
    return this;
  }

  /**
   * Create a low priority todo (1-10 points)
   */
  lowPriority(): this {
    this.data.pointValue = 1 + Math.floor(Math.random() * 10);
    return this;
  }

  /**
   * Create with invalid data for testing validation
   */
  invalid(): this {
    this.data.title = '';
    this.data.pointValue = -1;
    return this;
  }

  /**
   * Build the final TodoItem
   */
  build(): TodoItem {
    return {
      id: this.data.id!,
      title: this.data.title!,
      description: this.data.description!,
      pointValue: this.data.pointValue!,
      isCompleted: this.data.isCompleted!,
      createdAt: this.data.createdAt!,
      ...(this.data.completedAt && { completedAt: this.data.completedAt })
    };
  }
}

/**
 * Builder for creating DaySchedule test objects
 */
export class DayScheduleTestBuilder extends BaseBuilder<DaySchedule> {
  constructor() {
    super();
    this.data = {
      date: new Date().toISOString().split('T')[0],
      totalPointValue: 0,
      totalCompletedPointValue: 0,
      todoItems: [],
      completedTodoItems: [],
      incompleteTodoItems: []
    };
  }

  /**
   * Set the date
   */
  forDate(date: string | Date): this {
    this.data.date = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return this;
  }

  /**
   * Add todos to the schedule
   */
  withTodos(todos: TodoItem[]): this {
    this.data.todoItems = todos;
    this.data.completedTodoItems = todos.filter(t => t.isCompleted);
    this.data.incompleteTodoItems = todos.filter(t => !t.isCompleted);
    this.data.totalPointValue = todos.reduce((sum, t) => sum + t.pointValue, 0);
    this.data.totalCompletedPointValue = this.data.completedTodoItems!.reduce((sum, t) => sum + t.pointValue, 0);
    return this;
  }

  /**
   * Add a single todo
   */
  addTodo(todo: TodoItem): this {
    this.data.todoItems = [...(this.data.todoItems || []), todo];
    return this.withTodos(this.data.todoItems);
  }

  /**
   * Create an empty day
   */
  empty(): this {
    return this.withTodos([]);
  }

  /**
   * Create a productive day (high completion rate)
   */
  productive(): this {
    const todos = [
      new TodoTestBuilder().withTitle('Task 1').withPoints(20).completed().build(),
      new TodoTestBuilder().withTitle('Task 2').withPoints(30).completed().build(),
      new TodoTestBuilder().withTitle('Task 3').withPoints(15).completed().build(),
      new TodoTestBuilder().withTitle('Task 4').withPoints(10).incomplete().build()
    ];
    return this.withTodos(todos);
  }

  /**
   * Build the final DaySchedule
   */
  build(): DaySchedule {
    return {
      date: this.data.date!,
      totalPointValue: this.data.totalPointValue!,
      totalCompletedPointValue: this.data.totalCompletedPointValue!,
      todoItems: this.data.todoItems!,
      completedTodoItems: this.data.completedTodoItems!,
      incompleteTodoItems: this.data.incompleteTodoItems!
    };
  }
}

/**
 * Builder for creating AppConfig test objects
 */
export class ConfigTestBuilder extends BaseBuilder<AppConfig> {
  constructor() {
    super();
    this.data = {
      environment: 'test',
      features: {
        enableAnimations: true,
        enableDataExport: true,
        enableOfflineMode: false,
        enableAdvancedValidation: false
      },
      ui: {
        theme: 'light',
        timezone: 'UTC',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h'
      },
      storage: {
        provider: 'memory',
        compressionEnabled: false,
        encryptionEnabled: false
      },
      performance: {
        maxCacheSize: 100,
        debounceDelay: 300,
        batchSize: 50
      },
      animations: {
        enableTaskCompletionAnimation: true,
        enableProgressAnimation: true,
        enablePageTransitions: true,
        animationDuration: 300,
        easingFunction: 'ease-in-out'
      },
      physics: {
        gravity: 9.81,
        friction: 0.8,
        restitution: 0.6,
        airDensity: 1.2
      }
    };
  }

  /**
   * Set environment
   */
  environment(env: 'development' | 'test' | 'production'): this {
    this.data.environment = env;
    return this;
  }

  /**
   * Enable all features
   */
  withAllFeatures(): this {
    this.data.features = {
      enableAnimations: true,
      enableDataExport: true,
      enableOfflineMode: true,
      enableAdvancedValidation: true
    };
    return this;
  }

  /**
   * Disable all features
   */
  withMinimalFeatures(): this {
    this.data.features = {
      enableAnimations: false,
      enableDataExport: false,
      enableOfflineMode: false,
      enableAdvancedValidation: false
    };
    return this;
  }

  /**
   * Set theme
   */
  withTheme(theme: 'light' | 'dark' | 'auto'): this {
    this.data.ui!.theme = theme;
    return this;
  }

  /**
   * Set storage provider
   */
  withStorage(provider: 'localStorage' | 'indexedDB' | 'memory'): this {
    this.data.storage!.provider = provider;
    return this;
  }

  /**
   * Enable high performance settings
   */
  highPerformance(): this {
    this.data.performance = {
      maxCacheSize: 2000,
      debounceDelay: 100,
      batchSize: 500
    };
    this.data.features!.enableAnimations = false;
    return this;
  }

  /**
   * Build the final AppConfig
   */
  build(): AppConfig {
    return this.data as AppConfig;
  }
}

/**
 * Builder for creating test collections
 */
export class CollectionTestBuilder<T> {
  private items: T[] = [];

  /**
   * Add an item to the collection
   */
  add(item: T): this {
    this.items.push(item);
    return this;
  }

  /**
   * Add multiple items
   */
  addMany(items: T[]): this {
    this.items.push(...items);
    return this;
  }

  /**
   * Generate multiple items using a builder
   */
  generate<B extends BaseBuilder<T>>(
    builderFactory: () => B,
    count: number,
    configure?: (builder: B, index: number) => B
  ): this {
    for (let i = 0; i < count; i++) {
      let builder = builderFactory();
      if (configure) {
        builder = configure(builder, i);
      }
      this.items.push(builder.build());
    }
    return this;
  }

  /**
   * Clear all items
   */
  clear(): this {
    this.items = [];
    return this;
  }

  /**
   * Build the final collection
   */
  build(): T[] {
    return [...this.items];
  }
}

/**
 * Main builder factory class
 */
export class TestBuilders {
  /**
   * Create a todo builder
   */
  static todo(): TodoTestBuilder {
    return new TodoTestBuilder();
  }

  /**
   * Create a day schedule builder
   */
  static daySchedule(): DayScheduleTestBuilder {
    return new DayScheduleTestBuilder();
  }

  /**
   * Create a config builder
   */
  static config(): ConfigTestBuilder {
    return new ConfigTestBuilder();
  }

  /**
   * Create a collection builder
   */
  static collection<T>(): CollectionTestBuilder<T> {
    return new CollectionTestBuilder<T>();
  }

  /**
   * Create multiple todos with a pattern
   */
  static todos(count: number): CollectionTestBuilder<TodoItem> {
    return new CollectionTestBuilder<TodoItem>()
      .generate(() => new TodoTestBuilder(), count, (builder, index) =>
        builder.withTitle(`Todo ${index + 1}`).withPoints((index + 1) * 10)
      );
  }
} 