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
  /** Input validation: shown when a `required` field is empty. */
  requiredError: string;
  /** Input validation, `rules.minLength`. `{n}` is replaced by the limit. */
  minLengthError: string;
  /** Input validation, `rules.maxLength`. `{n}` is replaced by the limit. */
  maxLengthError: string;
  /** Input validation, `rules.pattern`. */
  patternError: string;
  /** Stepper: accessible name of the numeric field. */
  quantity: string;
  /** Stepper: "+" button. */
  increment: string;
  /** Stepper: "-" button. */
  decrement: string;
  /** Steps: accessible name of a step. `{n}`, `{total}` and `{label}` are replaced. */
  stepOf: string;
  /** Steps: state of a step already done. */
  stepCompleted: string;
  /** Steps: state of the step in progress. */
  stepCurrent: string;
  /** Steps: state of a step not reached yet. */
  stepPending: string;
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
  requiredError: 'This field is required',
  minLengthError: 'Enter at least {n} characters',
  maxLengthError: 'Enter at most {n} characters',
  patternError: 'Invalid format',
  quantity: 'Quantity',
  increment: 'Increment',
  decrement: 'Decrement',
  stepOf: 'Step {n} of {total}: {label}',
  stepCompleted: 'completed',
  stepCurrent: 'current',
  stepPending: 'pending',
};
