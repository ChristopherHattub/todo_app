import { BaseStateSlice, SliceAction } from '../core/StateSlice';

export interface DateState {
  currentDate: Date;
  selectedDate: Date;
  currentMonth: Date;
  isDateSelectorOpen: boolean;
  calendarView: 'month' | 'year';
  timezone: string;
}

export type DateActions =
  | SliceAction<'DATE_SET_SELECTED', { date: Date }>
  | SliceAction<'DATE_SET_CURRENT_MONTH', { date: Date }>
  | SliceAction<'DATE_TOGGLE_SELECTOR', { isOpen?: boolean }>
  | SliceAction<'DATE_SET_CALENDAR_VIEW', { view: 'month' | 'year' }>
  | SliceAction<'DATE_SET_TIMEZONE', { timezone: string }>;

export class DateSlice extends BaseStateSlice<DateState, DateActions> {
  readonly name = 'date';

  readonly initialState: DateState = {
    currentDate: new Date(),
    selectedDate: new Date(),
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    isDateSelectorOpen: false,
    calendarView: 'month',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  actions = {
    setSelectedDate: this.createAction<'DATE_SET_SELECTED', { date: Date }>('DATE_SET_SELECTED'),
    setCurrentMonth: this.createAction<'DATE_SET_CURRENT_MONTH', { date: Date }>('DATE_SET_CURRENT_MONTH'),
    toggleSelector: this.createAction<'DATE_TOGGLE_SELECTOR', { isOpen?: boolean }>('DATE_TOGGLE_SELECTOR'),
    setCalendarView: this.createAction<'DATE_SET_CALENDAR_VIEW', { view: 'month' | 'year' }>('DATE_SET_CALENDAR_VIEW'),
    setTimezone: this.createAction<'DATE_SET_TIMEZONE', { timezone: string }>('DATE_SET_TIMEZONE')
  };

  selectors = {
    getCurrentDate: this.createSelector('getCurrentDate', (state: DateState): Date => state.currentDate),
    getSelectedDate: this.createSelector('getSelectedDate', (state: DateState): Date => state.selectedDate),
    getCurrentMonth: this.createSelector('getCurrentMonth', (state: DateState): Date => state.currentMonth),
    getIsDateSelectorOpen: this.createSelector('getIsDateSelectorOpen', (state: DateState): boolean => state.isDateSelectorOpen),
    getCalendarView: this.createSelector('getCalendarView', (state: DateState): 'month' | 'year' => state.calendarView),
    getTimezone: this.createSelector('getTimezone', (state: DateState): string => state.timezone),
    
    getSelectedDateFormatted: this.createSelector('getSelectedDateFormatted', (state: DateState): string => {
      return state.selectedDate.toLocaleDateString();
    }),
    
    getIsToday: this.createSelector('getIsToday', (state: DateState): boolean => {
      const today = state.currentDate;
      const selected = state.selectedDate;
      return today.toDateString() === selected.toDateString();
    })
  };

  reducer(state: DateState, action: DateActions): DateState {
    switch (action.type) {
      case 'DATE_SET_SELECTED': {
        const { date } = action.payload!;
        return {
          ...state,
          selectedDate: date,
          currentMonth: new Date(date.getFullYear(), date.getMonth(), 1),
          isDateSelectorOpen: false
        };
      }

      case 'DATE_SET_CURRENT_MONTH':
        return {
          ...state,
          currentMonth: new Date(action.payload!.date.getFullYear(), action.payload!.date.getMonth(), 1)
        };

      case 'DATE_TOGGLE_SELECTOR': {
        const { isOpen } = action.payload || {};
        return {
          ...state,
          isDateSelectorOpen: isOpen !== undefined ? isOpen : !state.isDateSelectorOpen
        };
      }

      case 'DATE_SET_CALENDAR_VIEW':
        return {
          ...state,
          calendarView: action.payload!.view
        };

      case 'DATE_SET_TIMEZONE':
        return {
          ...state,
          timezone: action.payload!.timezone
        };

      default:
        return state;
    }
  }
} 