import React from 'react';
import { TodoApp } from './components/containers/TodoApp';

/**
 * Main application component - Integration Phase 6
 * Now using the new modular architecture with DI, state management, and error boundaries
 */
const App: React.FC = () => {
  return <TodoApp />;
};

export default App; 