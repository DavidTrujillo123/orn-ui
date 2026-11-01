export interface Labels {
  close: string;
  cancel: string;
  confirm: string;
  loading: string;
  loadingMore: string;
  noResultsTitle: string;
  noResultsDescription: string;
  search: string;
  selectPlaceholder: string;
  /** Month names, January to December. */
  months: string[];
  /** Weekday initials, index 0 = Sunday (matches `Date.getDay()`). */
  weekdaysShort: string[];
  selectDate: string;
  clear: string;
  /** Eye button in Input with `isPassword`. */
  showPassword: string;
  hidePassword: string;
  /** Appended to the accessible name of a `required` field (the asterisk is visual only). */
  required: string;
}

export const defaultLabels: Labels = {
  close: 'Close',
  cancel: 'Cancel',
  confirm: 'OK',
  loading: 'Loading...',
  loadingMore: 'Loading more...',
  noResultsTitle: 'No results found',
  noResultsDescription: 'Try a different search term',
  search: 'Search...',
  selectPlaceholder: 'Select...',
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  weekdaysShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  selectDate: 'Select date',
  clear: 'Clear',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  required: 'required',
};
