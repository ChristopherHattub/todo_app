import React, { useRef, useCallback } from 'react';
import { TodoItem } from '../../types';
import { animationHandler } from '../../services/AnimationHandler';

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
  const badgeRef = useRef<HTMLSpanElement>(null);

  const handleBadgeClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (todo.isCompleted) return; // Don't trigger if already completed
    
    const badgeElement = badgeRef.current;
    if (!badgeElement) return;
    
    // Get the current color class for the draining animation
    const colorClass = getPointColor(todo.pointValue);
    
    // Add draining animation class
    badgeElement.classList.add('taskitem-badge--draining');
    
    // Trigger progress animation
    animationHandler.queueAnimation(todo.pointValue, () => {
      // Animation complete callback - cleanup happens after progress animation
      if (badgeElement) {
        badgeElement.classList.remove('taskitem-badge--draining');
      }
    });
    
    // Complete the todo after a short delay to let the drain animation start
    setTimeout(() => {
      onToggleComplete(todo.id);
    }, 100);
    
  }, [todo.isCompleted, todo.pointValue, todo.id, onToggleComplete]);

  return (
    <div
      className={`taskitem-container${todo.isCompleted ? ' taskitem--completed' : ''}`}
      tabIndex={0}
      aria-label={`Task: ${todo.title}${todo.isCompleted ? ', completed' : ''}`}
      role="listitem"
      data-testid="taskitem-container"
    >
      {/* Toggle button is now just visual indicator, not interactive */}
      <div
        className={`taskitem-toggle${todo.isCompleted ? ' taskitem-toggle--completed' : ''}`}
        aria-label={todo.isCompleted ? 'Completed' : 'Not completed'}
        tabIndex={-1}
        data-testid="taskitem-toggle"
      >
        <span className="taskitem-toggle-circle" />
      </div>
      <div className="taskitem-content">
        <div className="taskitem-header">
          <span
            className={`taskitem-title${todo.isCompleted ? ' taskitem-title--completed' : ''}`}
            data-testid="taskitem-title"
          >
            {todo.title}
          </span>
          <span
            ref={badgeRef}
            className={`taskitem-badge ${getPointColor(todo.pointValue)}${todo.isCompleted ? ' taskitem-badge--completed' : ''}`}
            data-testid="taskitem-badge"
            onClick={handleBadgeClick}
            role="button"
            tabIndex={0}
            aria-label={todo.isCompleted ? `Completed task: ${todo.pointValue} points` : `Complete task for ${todo.pointValue} points`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBadgeClick(e as any);
              }
            }}
            style={{ 
              cursor: todo.isCompleted ? 'default' : 'pointer',
              pointerEvents: todo.isCompleted ? 'none' : 'auto'
            }}
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