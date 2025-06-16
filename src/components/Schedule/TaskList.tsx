import React from 'react';
import { TodoItem } from '../../types';
import { useTodoContext } from '../../contexts/TodoContext';

interface TaskListProps {
  tasks: TodoItem[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const { completeTodo } = useTodoContext();

  const handleToggleComplete = async (taskId: string) => {
    await completeTodo(taskId);
  };

  const getPointColor = (points: number): string => {
    if (points <= 5) return 'green';
    if (points <= 19) return 'blue';
    if (points <= 29) return 'purple';
    return 'orange';
  };

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`task-item-card ${task.isCompleted ? 'completed' : ''}`}
        >
          <div className="flex">
            <div className="flex-1">
              <div 
                className="cursor-pointer"
                onClick={() => handleToggleComplete(task.id)}
              >
                <h3>{task.title}</h3>
                {task.description && (
                  <p>{task.description}</p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div
                className={`point-badge ${getPointColor(task.pointValue)}`}
                onClick={() => handleToggleComplete(task.id)}
              >
                <span>
                  {task.pointValue}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList; 