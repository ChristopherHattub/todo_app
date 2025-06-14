import { TodoItem, EntryFormData } from './index';

/**
 * UI-specific type definitions for the ToDo List Tracker application
 */

/**
 * Props for the TaskItem component
 */
export interface TaskItemProps {
  /** The todo item to display */
  todo: TodoItem;
  /** Callback when todo is completed */
  onComplete: (todoId: string) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Props for the TaskList component
 */
export interface TaskListProps {
  /** Array of todo items to display */
  todos: TodoItem[];
  /** Callback when a todo is completed */
  onComplete: (todoId: string) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Props for the EntryForm component
 */
export interface EntryFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: EntryFormData) => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Props for the DateSelectorModal component
 */
export interface DateSelectorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Currently selected date */
  selectedDate: Date;
  /** Callback when a date is selected */
  onDateSelect: (date: Date) => void;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Props for the ProgressAnimation component
 */
export interface ProgressAnimationProps {
  /** Point value to animate */
  pointValue: number;
  /** Whether the animation is currently playing */
  isPlaying: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Animation parameters for the circle fill animation
 */
export interface AnimationParams {
  /** Number of balls to animate */
  ballCount: number;
  /** Duration of animation in milliseconds */
  duration: number;
  /** Colors to use for the balls */
  colors: string[];
  /** Intensity of the animation (0-1) */
  intensity: number;
}

/**
 * Event handler types
 */
export type TodoCompleteHandler = (todoId: string) => void;
export type DateSelectHandler = (date: Date) => void;
export type FormSubmitHandler = (data: EntryFormData) => void;
export type ModalCloseHandler = () => void;
export type AnimationCompleteHandler = () => void; 