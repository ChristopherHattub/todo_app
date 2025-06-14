import React from 'react';
import { TodoItem } from '../../types';

interface TaskItemProps {
  todo: TodoItem;
  onToggleComplete: (todoId: string) => void;
}

// Point badge color logic
function getPointColor(pointValue: number): string {
  if (pointValue <= 5) return 'taskitem-badge--green';
  if (pointValue <= 19) return 'taskitem-badge--blue';
  if (pointValue <= 29) return 'taskitem-badge--purple';
  return 'taskitem-badge--orange';
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(({ todo, onToggleComplete }) => {
  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    onToggleComplete(todo.id);
  };

  return (
    <div
      className={`taskitem-container${todo.isCompleted ? ' taskitem--completed' : ''}`}
      tabIndex={0}
      aria-label={`Task: ${todo.title}${todo.isCompleted ? ', completed' : ''}`}
      role="listitem"
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleToggle(e);
      }}
      data-testid="taskitem-container"
    >
      <button
        className={`taskitem-toggle${todo.isCompleted ? ' taskitem-toggle--completed' : ''}`}
        aria-label={todo.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        aria-pressed={todo.isCompleted}
        onClick={handleToggle}
        tabIndex={0}
        data-testid="taskitem-toggle"
      >
        <span className="taskitem-toggle-circle" />
      </button>
      <div className="taskitem-content">
        <div className="taskitem-header">
          <span
            className={`taskitem-title${todo.isCompleted ? ' taskitem-title--completed' : ''}`}
            data-testid="taskitem-title"
          >
            {todo.title}
          </span>
          <span
            className={`taskitem-badge ${getPointColor(todo.pointValue)}`}
            data-testid="taskitem-badge"
          >
            {todo.pointValue}
          </span>
        </div>
        {todo.description && (
          <div
            className={`taskitem-desc${todo.isCompleted ? ' taskitem-desc--completed' : ''}`}
            data-testid="taskitem-desc"
          >
            {todo.description}
          </div>
        )}
      </div>
    </div>
  );
});

export default TaskItem; 