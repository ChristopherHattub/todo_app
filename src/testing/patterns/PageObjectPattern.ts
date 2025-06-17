import { RenderResult, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Base page object class with common functionality
 */
export abstract class BasePage {
  protected container: RenderResult;

  constructor(container: RenderResult) {
    this.container = container;
  }

  /**
   * Wait for element to appear
   */
  protected async waitForElement(selector: string): Promise<HTMLElement> {
    return await waitFor(() => this.getElement(selector));
  }

  /**
   * Get element by test id or text
   */
  protected getElement(selector: string): HTMLElement {
    // Try by test id first
    const byTestId = this.container.queryByTestId(selector);
    if (byTestId) return byTestId;

    // Try by text
    const byText = this.container.queryByText(selector);
    if (byText) return byText;

    // Try by role
    const byRole = this.container.queryByRole(selector);
    if (byRole) return byRole;

    throw new Error(`Element not found: ${selector}`);
  }

  /**
   * Check if element exists
   */
  protected hasElement(selector: string): boolean {
    try {
      this.getElement(selector);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click an element
   */
  protected async click(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    fireEvent.click(element);
  }

  /**
   * Type text into an input
   */
  protected async type(selector: string, text: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await userEvent.type(element, text);
  }

  /**
   * Clear input and type new text
   */
  protected async clearAndType(selector: string, text: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await userEvent.clear(element);
    await userEvent.type(element, text);
  }
}

/**
 * Page object for todo list management
 */
export class TodoListPage extends BasePage {
  /**
   * Get all todo items
   */
  getTodoItems(): HTMLElement[] {
    return this.container.getAllByTestId(/^todo-item-/);
  }

  /**
   * Get todo item by ID
   */
  getTodoItem(id: string): HTMLElement {
    return this.getElement(`todo-item-${id}`);
  }

  /**
   * Check if todo list is empty
   */
  isEmpty(): boolean {
    return !this.hasElement('todo-item');
  }

  /**
   * Get todo count
   */
  getTodoCount(): number {
    try {
      return this.getTodoItems().length;
    } catch {
      return 0;
    }
  }

  /**
   * Complete a todo item
   */
  async completeTodo(id: string): Promise<void> {
    await this.click(`todo-complete-${id}`);
  }

  /**
   * Delete a todo item
   */
  async deleteTodo(id: string): Promise<void> {
    await this.click(`todo-delete-${id}`);
  }

  /**
   * Edit a todo item
   */
  async editTodo(id: string): Promise<void> {
    await this.click(`todo-edit-${id}`);
  }

  /**
   * Get todo title
   */
  getTodoTitle(id: string): string {
    const element = this.getElement(`todo-title-${id}`);
    return element.textContent || '';
  }

  /**
   * Get todo points
   */
  getTodoPoints(id: string): number {
    const element = this.getElement(`todo-points-${id}`);
    return parseInt(element.textContent || '0', 10);
  }

  /**
   * Check if todo is completed
   */
  isTodoCompleted(id: string): boolean {
    const element = this.getTodoItem(id);
    return element.getAttribute('data-completed') === 'true';
  }

  /**
   * Filter todos by completion status
   */
  async filterByStatus(status: 'all' | 'completed' | 'incomplete'): Promise<void> {
    await this.click(`filter-${status}`);
  }

  /**
   * Sort todos
   */
  async sortBy(criteria: 'title' | 'points' | 'date'): Promise<void> {
    await this.click(`sort-${criteria}`);
  }
}

/**
 * Page object for todo form
 */
export class TodoFormPage extends BasePage {
  /**
   * Fill out the todo form
   */
  async fillForm(data: {
    title?: string;
    description?: string;
    points?: number;
  }): Promise<void> {
    if (data.title !== undefined) {
      await this.clearAndType('todo-title-input', data.title);
    }
    if (data.description !== undefined) {
      await this.clearAndType('todo-description-input', data.description);
    }
    if (data.points !== undefined) {
      await this.clearAndType('todo-points-input', data.points.toString());
    }
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.click('todo-submit-button');
  }

  /**
   * Cancel form
   */
  async cancel(): Promise<void> {
    await this.click('todo-cancel-button');
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    const submitButton = this.getElement('todo-submit-button');
    return !submitButton.hasAttribute('disabled');
  }

  /**
   * Get validation errors
   */
  getValidationErrors(): string[] {
    const errorElements = this.container.queryAllByTestId(/^error-/);
    return errorElements.map(el => el.textContent || '');
  }

  /**
   * Check if field has error
   */
  hasFieldError(field: string): boolean {
    return this.hasElement(`error-${field}`);
  }

  /**
   * Get field value
   */
  getFieldValue(field: string): string {
    const element = this.getElement(`todo-${field}-input`) as HTMLInputElement;
    return element.value;
  }

  /**
   * Clear all fields
   */
  async clearAll(): Promise<void> {
    await this.clearAndType('todo-title-input', '');
    await this.clearAndType('todo-description-input', '');
    await this.clearAndType('todo-points-input', '');
  }
}

/**
 * Page object for date navigation
 */
export class DateNavigationPage extends BasePage {
  /**
   * Get current date display
   */
  getCurrentDate(): string {
    const element = this.getElement('current-date');
    return element.textContent || '';
  }

  /**
   * Navigate to previous day
   */
  async previousDay(): Promise<void> {
    await this.click('nav-previous-day');
  }

  /**
   * Navigate to next day
   */
  async nextDay(): Promise<void> {
    await this.click('nav-next-day');
  }

  /**
   * Navigate to today
   */
  async goToToday(): Promise<void> {
    await this.click('nav-today');
  }

  /**
   * Open date picker
   */
  async openDatePicker(): Promise<void> {
    await this.click('date-picker-button');
  }

  /**
   * Select date from picker
   */
  async selectDate(date: Date): Promise<void> {
    await this.openDatePicker();
    const dateString = date.toISOString().split('T')[0];
    await this.click(`date-${dateString}`);
  }

  /**
   * Check if date picker is open
   */
  isDatePickerOpen(): boolean {
    return this.hasElement('date-picker-modal');
  }

  /**
   * Close date picker
   */
  async closeDatePicker(): Promise<void> {
    if (this.isDatePickerOpen()) {
      await this.click('date-picker-close');
    }
  }
}

/**
 * Page object for progress tracking
 */
export class ProgressPage extends BasePage {
  /**
   * Get total points for the day
   */
  getTotalPoints(): number {
    const element = this.getElement('total-points');
    return parseInt(element.textContent || '0', 10);
  }

  /**
   * Get completed points
   */
  getCompletedPoints(): number {
    const element = this.getElement('completed-points');
    return parseInt(element.textContent || '0', 10);
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const element = this.getElement('completion-percentage');
    return parseInt(element.textContent?.replace('%', '') || '0', 10);
  }

  /**
   * Check if progress animation is playing
   */
  isProgressAnimating(): boolean {
    const element = this.getElement('progress-bar');
    return element.classList.contains('animating');
  }

  /**
   * Get progress bar width
   */
  getProgressBarWidth(): string {
    const element = this.getElement('progress-bar-fill');
    return element.style.width;
  }
}

/**
 * Page object for settings/configuration
 */
export class SettingsPage extends BasePage {
  /**
   * Open settings modal
   */
  async openSettings(): Promise<void> {
    await this.click('settings-button');
  }

  /**
   * Close settings modal
   */
  async closeSettings(): Promise<void> {
    await this.click('settings-close');
  }

  /**
   * Change theme
   */
  async setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.click(`theme-${theme}`);
  }

  /**
   * Toggle feature
   */
  async toggleFeature(feature: string): Promise<void> {
    await this.click(`feature-${feature}`);
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    const element = this.getElement(`feature-${feature}`);
    return element.getAttribute('aria-checked') === 'true';
  }

  /**
   * Save settings
   */
  async saveSettings(): Promise<void> {
    await this.click('settings-save');
  }

  /**
   * Reset settings
   */
  async resetSettings(): Promise<void> {
    await this.click('settings-reset');
  }
}

/**
 * Main page object that combines all pages
 */
export class TodoAppPage {
  public readonly todoList: TodoListPage;
  public readonly todoForm: TodoFormPage;
  public readonly dateNavigation: DateNavigationPage;
  public readonly progress: ProgressPage;
  public readonly settings: SettingsPage;

  constructor(container: RenderResult) {
    this.todoList = new TodoListPage(container);
    this.todoForm = new TodoFormPage(container);
    this.dateNavigation = new DateNavigationPage(container);
    this.progress = new ProgressPage(container);
    this.settings = new SettingsPage(container);
  }

  /**
   * Wait for the app to load
   */
  async waitForLoad(): Promise<void> {
    await waitFor(() => {
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });
  }

  /**
   * Check if app is in loading state
   */
  isLoading(): boolean {
    return screen.queryByTestId('loading-spinner') !== null;
  }

  /**
   * Get any global error message
   */
  getGlobalError(): string | null {
    const errorElement = screen.queryByTestId('global-error');
    return errorElement ? errorElement.textContent : null;
  }

  /**
   * Perform a complete workflow: add and complete a todo
   */
  async addAndCompleteTodo(title: string, points: number = 10): Promise<string> {
    // Add todo
    await this.todoForm.fillForm({ title, points });
    await this.todoForm.submit();

    // Wait for todo to appear and get its ID
    const todoItems = this.todoList.getTodoItems();
    const newTodo = todoItems[todoItems.length - 1];
    const todoId = newTodo.getAttribute('data-todo-id') || '';

    // Complete the todo
    await this.todoList.completeTodo(todoId);

    return todoId;
  }
} 