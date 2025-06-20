import React, { useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import ProgressAnimationContainer from '../ProgressAnimation/ProgressAnimationContainer';
import { AppHeader } from './AppHeader';
import { ScheduleContainer } from '../Schedule/ScheduleContainer';
import { DateSelectorModal } from '../DateSelector/DateSelectorModal';
import { EntryForm } from '../EntryForm/EntryForm';
import { useTodoContext } from '../../contexts/TodoContext';

/**
 * Main layout component that defines the structure of the application
 * Integration Phase 6 - Now includes all main components
 */
export const AppLayout: React.FC = () => {
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
  const { state, addTodo, setSelectedDate } = useTodoContext();
  const { selectedDate } = state;

  const handleDateSelectorClick = () => {
    setIsDateSelectorOpen(true);
  };

  const handleDateSelectorClose = () => {
    setIsDateSelectorOpen(false);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDateSelectorOpen(false);
  };

  const handleAddTodo = async (formData: { title: string; description: string; pointValue: string }) => {
    await addTodo({
      title: formData.title,
      description: formData.description,
      pointValue: parseInt(formData.pointValue, 10),
      isCompleted: false
    });
  };

  return (
    <ErrorBoundary>
      <div className="app-layout">
        <AppHeader onDateSelectorClick={handleDateSelectorClick} />
        
        <main className="app-main">
          {/* Progress Animation Section */}
          <ErrorBoundary>
            <section className="animation-section">
              <ProgressAnimationContainer />
            </section>
          </ErrorBoundary>
          
          {/* Schedule Section */}
          <ErrorBoundary>
            <section className="content-section">
              <ScheduleContainer />
            </section>
          </ErrorBoundary>
        </main>
        
        {/* Entry Form Footer */}
        <ErrorBoundary>
          <footer className="app-footer">
            <EntryForm onSubmit={handleAddTodo} />
          </footer>
        </ErrorBoundary>

        {/* Date Selector Modal */}
        <DateSelectorModal
          isOpen={isDateSelectorOpen}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onClose={handleDateSelectorClose}
        />
      </div>
    </ErrorBoundary>
  );
}; 