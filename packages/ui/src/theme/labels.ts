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
  /** Nombres de los meses, de enero a diciembre. */
  months: string[];
  /** Iniciales de los días, índice 0 = domingo (alinea con `Date.getDay()`). */
  weekdaysShort: string[];
  selectDate: string;
  clear: string;
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
};
